(function (root) {
  const MANIFEST = "data/manifest.json";
  const CHUNK_LENGTH = 512 * 1024;
  const MAX_DOCUMENT_PARTS = 4096;
  const UPLOAD_CONCURRENCY = 3;
  const REQUEST_TIMEOUT_MS = 90000;
  const documentCodec = root.LectureDocument || (typeof require !== "undefined" ? require("./lecture-document.js") : null);

  /** GitHub is the shared store. Every update uses the current tree and a non-forced commit. */
  class GitHubLectureRepository {
    constructor({ owner, repository, branch = "main", fetch: fetcher = root.fetch.bind(root), crypto = root.crypto, baseUrl = root.location?.href, storage = root.sessionStorage }) {
      this.owner = owner;
      this.repository = repository;
      this.branch = branch;
      this.fetch = fetcher;
      this.crypto = crypto;
      this.baseUrl = baseUrl;
      this.token = "";
      this.prefix = `/repos/${owner}/${repository}`;
      this.storage = storage;
      this.checkpointKey = `mee101_github_upload_v1:${owner}/${repository}/${branch}`;
    }

    async digest(text) {
      const bytes = await this.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, "0")).join("");
    }

    async documentHashes(lectures, onProgress = () => {}) {
      const hashes = [];
      for (const part of documentCodec.parts(lectures)) {
        if (hashes.length >= MAX_DOCUMENT_PARTS) throw new Error("Ders verisi tek yayın sınırını aşıyor. Yerel kayıtlar korunuyor.");
        hashes.push(await this.digest(part));
        onProgress({ stage: "prepare", completed: hashes.length });
      }
      return hashes;
    }

    /** Fingerprints bounded parts, including repeated media, without a giant JSON string. */
    async documentDigest(lectures) {
      return this.digest(JSON.stringify(await this.documentHashes(lectures)));
    }

    async api(path, { method = "GET", body, raw = false, optional = false } = {}) {
      const response = await this.fetch(`https://api.github.com${path}`, {
        method, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: {
          Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`, "X-GitHub-Api-Version": "2022-11-28",
          ...(body ? { "Content-Type": "application/json" } : {})
        }, ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (optional && response.status === 404) return null;
      if (!response.ok) {
        const error = new Error([409, 422].includes(response.status)
          ? "GitHub’da daha yeni değişiklik var. Yerel notlar korundu; yeniden yayımlarken iki sürüm birleştirilecek."
          : response.status === 401 ? "GitHub oturumunun süresi dolmuş. Hesabınızla yeniden giriş yapınız."
          : response.status === 403 ? "GitHub yazma izni vermedi. LectureNotes uygulamasının ME101 deposuna içerik yazma iznini kontrol ediniz."
          : "GitHub işlemine ulaşılamadı. Yerel notlar ve önceki yayın korunuyor.");
        error.status = response.status;
        throw error;
      }
      return raw ? response.text() : response.json();
    }

    checkpoint(digest) {
      try {
        const saved = JSON.parse(this.storage?.getItem(this.checkpointKey) || "null");
        if (saved?.digest === digest && /^[a-f0-9-]{36}$/i.test(saved.id) && saved.uploaded && typeof saved.uploaded === "object") return saved;
      } catch { /* A missing checkpoint never changes the local document. */ }
      return { digest, id: this.crypto.randomUUID(), uploaded: {}, encodings: {} };
    }

    rememberCheckpoint(checkpoint) {
      try { this.storage?.setItem(this.checkpointKey, JSON.stringify(checkpoint)); }
      catch { /* Publishing still works when tab storage is unavailable. */ }
    }

    /** Sends a bounded number of parts together and reuses acknowledged parts after reload. */
    async uploadParts(lectures, hashes, checkpoint, onProgress, currentManifest) {
      const iterator = documentCodec.parts(lectures);
      const entries = new Array(hashes.length);
      let next = 0, completed = 0, failure;
      checkpoint.encodings ||= {};
      const reusable = new Map((currentManifest?.hashes || []).map((hash, index) => [hash, {
        sha: currentManifest.blobs?.[index], encoding: currentManifest.encodings?.[index] || "plain"
      }]));
      const worker = async () => {
        while (!failure) {
          const item = iterator.next();
          if (item.done) return;
          const index = next++;
          try {
            let sha = checkpoint.uploaded[index];
            const existing = reusable.get(hashes[index]);
            if (!sha && existing?.sha) {
              sha = existing.sha;
              checkpoint.uploaded[index] = sha;
              checkpoint.encodings[index] = existing.encoding;
              this.rememberCheckpoint(checkpoint);
            }
            if (!sha) {
              const packed = await documentCodec.pack(item.value);
              const blob = await this.api(`${this.prefix}/git/blobs`, { method: "POST", body: { content: packed.content, encoding: "utf-8" } });
              sha = blob.sha;
              checkpoint.uploaded[index] = sha;
              checkpoint.encodings[index] = packed.encoding;
              this.rememberCheckpoint(checkpoint);
            }
            entries[index] = { path: `data/snapshots/${checkpoint.id}/${index}.txt`, mode: "100644", type: "blob", sha };
            completed += 1;
            onProgress({ stage: "upload", completed, total: hashes.length });
          } catch (error) { failure = error; }
        }
      };
      await Promise.all(Array.from({ length: UPLOAD_CONCURRENCY }, worker));
      if (failure) throw failure;
      return entries;
    }

    /** Keeps the access key in memory only and verifies the repository owner. */
    async login(token) {
      this.token = token.trim();
      try {
        const user = await this.api("/user");
        if (user.login.toLowerCase() !== this.owner.toLowerCase()) throw new Error("Yayımlama yalnızca depo sahibinin GitHub hesabına açık.");
        const repository = await this.api(this.prefix);
        if (repository.permissions?.push !== true) throw new Error("ME101 deposunda ders yayımlama izni bulunamadı.");
        return true;
      } catch (error) { this.token = ""; throw error; }
    }

    async decode(manifest, readPart) {
      if (!manifest) return { manifest: null, lectures: null };
      if (!/^[a-f0-9-]{36}$/i.test(manifest.id) || !Number.isInteger(manifest.parts) || manifest.parts < 1 || manifest.parts > (manifest.format === 2 ? MAX_DOCUMENT_PARTS : 400)) throw new Error("GitHub ders kaydı geçersiz; yerel notlar korunuyor.");
      if (manifest.format === 2) return this.decodeDocument(manifest, readPart);
      const chunks = [];
      for (let part = 0; part < manifest.parts; part += 1) chunks.push(await readPart(`data/snapshots/${manifest.id}/${part}.txt`));
      const text = chunks.join("");
      if (await this.digest(text) !== manifest.digest) throw new Error("GitHub kaydının bütünlüğü doğrulanamadı; yerel notlar korunuyor.");
      const lectures = JSON.parse(text);
      if (!Array.isArray(lectures)) throw new Error("GitHub ders kaydı okunamadı.");
      return { manifest, lectures };
    }

    async decodeDocument(manifest, readPart) {
      if (!Array.isArray(manifest.hashes) || manifest.hashes.length !== manifest.parts || await this.digest(JSON.stringify(manifest.hashes)) !== manifest.digest) throw new Error("GitHub kaydının bütünlüğü doğrulanamadı; yerel notlar korunuyor.");
      const decoder = documentCodec.decoder();
      for (let part = 0; part < manifest.parts; part += 1) {
        const stored = await readPart(`data/snapshots/${manifest.id}/${part}.txt`);
        let text;
        try { text = await documentCodec.unpack(stored, manifest.encodings?.[part] || "plain"); }
        catch { throw new Error("GitHub kaydının bütünlüğü doğrulanamadı; yerel notlar korunuyor."); }
        if (await this.digest(text) !== manifest.hashes[part]) throw new Error("GitHub kaydının bütünlüğü doğrulanamadı; yerel notlar korunuyor.");
        decoder.add(text);
      }
      const lectures = decoder.result();
      if (!Array.isArray(lectures)) throw new Error("GitHub ders kaydı okunamadı.");
      return { manifest, lectures };
    }

    /** Reads the published Pages files without asking visitors to sign in. */
    async readPublished() {
      const response = await this.fetch(new URL(`${MANIFEST}?v=${Date.now()}`, this.baseUrl), { cache: "no-store" });
      if (response.status === 404) return { manifest: null, lectures: null };
      if (!response.ok) throw new Error("Yayımlanmış ders kaydı okunamadı.");
      return this.decode(await response.json(), async path => {
        const part = await this.fetch(new URL(path, this.baseUrl), { cache: "no-store" });
        if (!part.ok) throw new Error("Yayın dosyası henüz hazır değil. Notlarınız korunuyor.");
        return part.text();
      });
    }

    /** Reads a consistent Git commit, including changes not yet served by Pages. */
    async readCurrent({ skipLecturesForVersion = null } = {}) {
      const reference = await this.api(`${this.prefix}/git/ref/heads/${encodeURIComponent(this.branch)}`);
      const head = reference.object.sha;
      const commit = await this.api(`${this.prefix}/git/commits/${head}`);
      const read = path => this.api(`${this.prefix}/contents/${path}?ref=${head}`, { raw: true, optional: path === MANIFEST });
      const manifestText = await read(MANIFEST);
      const manifest = manifestText ? JSON.parse(manifestText) : null;
      const result = manifest && manifest.id === skipLecturesForVersion
        ? { manifest, lectures: null } : await this.decode(manifest, read);
      return { ...result, head, tree: commit.tree.sha };
    }

    chunks(text) {
      const chunks = [];
      for (let start = 0; start < text.length;) {
        let end = Math.min(start + CHUNK_LENGTH, text.length);
        if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end -= 1;
        chunks.push(text.slice(start, end));
        start = end;
      }
      return chunks;
    }

    /** Publishes one atomic commit; never removes source files or older snapshots. */
    async publish(lectures, current, onProgress = () => {}) {
      if (!this.token) throw new Error("Yayımlamak için GitHub girişi gerekli.");
      const hashes = await this.documentHashes(lectures, onProgress);
      const digest = await this.digest(JSON.stringify(hashes));
      if (current.manifest?.format === 2 && current.manifest.digest === digest) {
        onProgress({ stage: "commit", completed: hashes.length, total: hashes.length });
        return current.manifest;
      }
      const checkpoint = this.checkpoint(digest);
      this.rememberCheckpoint(checkpoint);
      const entries = await this.uploadParts(lectures, hashes, checkpoint, onProgress, current.manifest);
      onProgress({ stage: "commit", completed: hashes.length, total: hashes.length });
      const manifest = { format: 2, partLength: documentCodec.partLength, id: checkpoint.id, parts: hashes.length, hashes, digest,
        blobs: entries.map(entry => entry.sha), encodings: entries.map((_, index) => checkpoint.encodings[index] || "plain"),
        savedAt: new Date().toISOString(), lectureCount: lectures.length };
      const manifestBlob = await this.api(`${this.prefix}/git/blobs`, { method: "POST", body: { content: JSON.stringify(manifest), encoding: "utf-8" } });
      entries.push({ path: MANIFEST, mode: "100644", type: "blob", sha: manifestBlob.sha });
      const tree = await this.api(`${this.prefix}/git/trees`, { method: "POST", body: { base_tree: current.tree, tree: entries } });
      const commit = await this.api(`${this.prefix}/git/commits`, { method: "POST", body: { message: "Update published MEE 101 lecture notes", tree: tree.sha, parents: [current.head] } });
      await this.api(`${this.prefix}/git/refs/heads/${encodeURIComponent(this.branch)}`, { method: "PATCH", body: { sha: commit.sha, force: false } });
      return { ...manifest, commit: commit.sha };
    }

    logout() { this.token = ""; }
  }

  root.GitHubLectureRepository = GitHubLectureRepository;
  if (typeof module !== "undefined") module.exports = { GitHubLectureRepository };
})(typeof window !== "undefined" ? window : globalThis);
