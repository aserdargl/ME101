(function (root) {
  const MANIFEST = "data/manifest.json";
  const CHUNK_LENGTH = 512 * 1024;
  const MAX_DOCUMENT_PARTS = 4096;
  const documentCodec = root.LectureDocument || (typeof require !== "undefined" ? require("./lecture-document.js") : null);

  /** GitHub is the shared store. Every update uses the current tree and a non-forced commit. */
  class GitHubLectureRepository {
    constructor({ owner, repository, branch = "main", fetch: fetcher = root.fetch.bind(root), crypto = root.crypto, baseUrl = root.location?.href }) {
      this.owner = owner;
      this.repository = repository;
      this.branch = branch;
      this.fetch = fetcher;
      this.crypto = crypto;
      this.baseUrl = baseUrl;
      this.token = "";
      this.prefix = `/repos/${owner}/${repository}`;
    }

    async digest(text) {
      const bytes = await this.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, "0")).join("");
    }

    async documentHashes(lectures) {
      const hashes = [];
      for (const part of documentCodec.parts(lectures)) {
        if (hashes.length >= MAX_DOCUMENT_PARTS) throw new Error("Ders verisi tek yayın sınırını aşıyor. Yerel kayıtlar korunuyor.");
        hashes.push(await this.digest(part));
      }
      return hashes;
    }

    /** Fingerprints bounded parts, including repeated media, without a giant JSON string. */
    async documentDigest(lectures) {
      return this.digest(JSON.stringify(await this.documentHashes(lectures)));
    }

    async api(path, { method = "GET", body, raw = false, optional = false } = {}) {
      const response = await this.fetch(`https://api.github.com${path}`, {
        method, cache: "no-store", headers: {
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
        const text = await readPart(`data/snapshots/${manifest.id}/${part}.txt`);
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
    async readCurrent() {
      const reference = await this.api(`${this.prefix}/git/ref/heads/${encodeURIComponent(this.branch)}`);
      const head = reference.object.sha;
      const commit = await this.api(`${this.prefix}/git/commits/${head}`);
      const read = path => this.api(`${this.prefix}/contents/${path}?ref=${head}`, { raw: true, optional: path === MANIFEST });
      const manifestText = await read(MANIFEST);
      const result = await this.decode(manifestText ? JSON.parse(manifestText) : null, read);
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
    async publish(lectures, current) {
      if (!this.token) throw new Error("Yayımlamak için GitHub girişi gerekli.");
      const hashes = await this.documentHashes(lectures);
      const id = this.crypto.randomUUID();
      const entries = [];
      let index = 0;
      for (const content of documentCodec.parts(lectures)) {
        const blob = await this.api(`${this.prefix}/git/blobs`, { method: "POST", body: { content, encoding: "utf-8" } });
        entries.push({ path: `data/snapshots/${id}/${index}.txt`, mode: "100644", type: "blob", sha: blob.sha });
        index += 1;
      }
      const manifest = { format: 2, id, parts: hashes.length, hashes, digest: await this.digest(JSON.stringify(hashes)), savedAt: new Date().toISOString(), lectureCount: lectures.length };
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
