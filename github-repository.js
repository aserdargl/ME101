(function (root) {
  const MANIFEST = "data/manifest.json";
  const CHUNK_LENGTH = 512 * 1024;

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
          : response.status === 401 ? "GitHub erişim anahtarı geçersiz veya süresi dolmuş."
          : response.status === 403 ? "GitHub yazma izni vermedi. Anahtar için yalnızca ME101 deposunda Contents: Read and write iznini seçin."
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
        await this.api(this.prefix);
        return true;
      } catch (error) { this.token = ""; throw error; }
    }

    async decode(manifest, readPart) {
      if (!manifest) return { manifest: null, lectures: null };
      if (!/^[a-f0-9-]{36}$/i.test(manifest.id) || !Number.isInteger(manifest.parts) || manifest.parts < 1 || manifest.parts > 400) throw new Error("GitHub ders kaydı geçersiz; yerel notlar korunuyor.");
      const chunks = [];
      for (let part = 0; part < manifest.parts; part += 1) chunks.push(await readPart(`data/snapshots/${manifest.id}/${part}.txt`));
      const text = chunks.join("");
      if (await this.digest(text) !== manifest.digest) throw new Error("GitHub kaydının bütünlüğü doğrulanamadı; yerel notlar korunuyor.");
      const lectures = JSON.parse(text);
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
      const text = JSON.stringify(lectures);
      const chunks = this.chunks(text);
      if (chunks.length > 400) throw new Error("Ders verisi tek yayın sınırını aşıyor. Yerel kayıtlar korunuyor.");
      const id = this.crypto.randomUUID();
      const entries = [];
      for (const [index, content] of chunks.entries()) {
        const blob = await this.api(`${this.prefix}/git/blobs`, { method: "POST", body: { content, encoding: "utf-8" } });
        entries.push({ path: `data/snapshots/${id}/${index}.txt`, mode: "100644", type: "blob", sha: blob.sha });
      }
      const manifest = { id, parts: chunks.length, digest: await this.digest(text), savedAt: new Date().toISOString(), lectureCount: lectures.length };
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
