(function (root) {
  const Base = typeof module !== "undefined" ? require("./github-repository.js").GitHubLectureRepository : root.GitHubLectureRepository;

  /** Publishes through the authenticated service; GitHub credentials never reach the browser. */
  class InstructorLectureRepository extends Base {
    constructor({ serviceUrl, getIdToken, ...options }) {
      super(options);
      this.serviceUrl = serviceUrl;
      this.getIdToken = getIdToken;
      this.connected = false;
      this.generation = 0;
    }

    async request(operation, body = {}) {
      const generation = this.generation;
      const token = await this.getIdToken();
      if (generation !== this.generation || !token) throw new Error("Öğretim üyesi oturumu kapandı. Yeniden giriş yapın.");
      const response = await this.fetch(new URL(`publisher/${operation}`, this.serviceUrl), {
        method: "POST", cache: "no-store", signal: AbortSignal.timeout(90000),
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (generation !== this.generation) throw new Error("Öğretim üyesi oturumu kapandı.");
      const result = await response.json().catch(() => ({ error: "Yayın hizmetine ulaşılamadı. Yerel notlarınız korundu." }));
      if (!response.ok) throw new Error(result.error || "Yayın hizmetine ulaşılamadı. Yerel notlarınız korundu.");
      return result;
    }

    async login() {
      await this.request("session");
      this.connected = true;
      return true;
    }

    async api(path, { body } = {}) {
      if (path === `${this.prefix}/git/blobs` && typeof body?.content === "string" && body.encoding === "utf-8") return this.request("blob", { content: body.content });
      throw new Error("Desteklenmeyen yayın işlemi.");
    }

    async readCurrent({ skipLecturesForVersion = null } = {}) {
      if (!this.connected) throw new Error("Yayımlamak için öğretim üyesi girişi yapın.");
      const current = await this.request("current");
      if (current.manifest?.id === skipLecturesForVersion) return { ...current, lectures: null };
      const result = await this.decode(current.manifest, async path => {
        const response = await this.fetch(new URL(`https://raw.githubusercontent.com/${this.owner}/${this.repository}/${current.head}/${path}`), { cache: "no-store" });
        if (!response.ok) throw new Error("Ortak ders kaydı okunamadı. Yerel notlarınız korundu.");
        return response.text();
      });
      return { ...current, ...result };
    }

    async publish(lectures, current, onProgress = () => {}) {
      if (!this.connected) throw new Error("Yayımlamak için öğretim üyesi girişi yapın.");
      const hashes = await this.documentHashes(lectures, onProgress);
      const digest = await this.digest(JSON.stringify(hashes));
      if (current.manifest?.format === 2 && current.manifest.digest === digest) return current.manifest;
      const checkpoint = this.checkpoint(digest);
      this.rememberCheckpoint(checkpoint);
      const entries = await this.uploadParts(lectures, hashes, checkpoint, onProgress, current.manifest);
      onProgress({ stage: "commit", completed: hashes.length, total: hashes.length });
      return this.request("commit", { head: current.head, id: checkpoint.id, parts: entries.map(entry => entry.sha),
        digest, hashes, encodings: entries.map((_, index) => checkpoint.encodings[index] || "plain"),
        format: 2, partLength: root.LectureDocument?.partLength || 4 * 1024 * 1024, lectureCount: lectures.length });
    }

    logout() { ++this.generation; this.connected = false; super.logout(); }
  }

  root.InstructorLectureRepository = InstructorLectureRepository;
  if (typeof module !== "undefined") module.exports = { InstructorLectureRepository };
})(typeof window !== "undefined" ? window : globalThis);
