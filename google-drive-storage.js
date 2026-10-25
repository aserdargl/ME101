(function (root) {
  const API = "https://www.googleapis.com/drive/v3/";
  const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,size,sha256Checksum,mimeType,parents";
  const CHUNK_SIZE = 8 * 1024 * 1024;
  const MIN_ASSET_LENGTH = 32 * 1024;

  /** Own-account uploads use only drive.file; access tokens stay in memory. */
  class GoogleDriveStorage {
    constructor({ baseUrl, getIdToken, fetch: fetcher = root.fetch.bind(root), crypto = root.crypto, codec = root.LectureDocument, storage = root.sessionStorage }) {
      this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      this.assetBase = new URL("drive/assets/", this.baseUrl).href;
      this.getIdToken = getIdToken;
      this.fetch = fetcher;
      this.crypto = crypto;
      this.codec = codec;
      this.storage = storage;
      this.access = null;
    }

    async digest(value) {
      const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
      const hash = await this.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    async service(path, body = {}) {
      const token = await this.getIdToken();
      const response = await this.fetch(new URL(`drive/${path}`, this.baseUrl), {
        method: "POST", credentials: "omit", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Drive bağlantısı hazır değil. Önce Drive’a bağlanın.");
      return result;
    }

    async session() {
      if (!this.access || this.access.expiresAt <= Date.now()) {
        const session = await this.service("session");
        this.access = { ...session, expiresAt: Date.now() + session.expiresIn * 1000 - 60000 };
      }
      return this.access;
    }

    async google(url, options = {}, acceptedStatuses = []) {
      const target = new URL(url);
      if (target.protocol !== "https:" || target.hostname !== "www.googleapis.com") throw new Error("Geçersiz Drive adresi.");
      const session = await this.session();
      const response = await this.fetch(target.href, { credentials: "omit", ...options, headers: { ...options.headers, Authorization: `Bearer ${session.token}` } });
      if (!response.ok && response.status !== 308 && !acceptedStatuses.includes(response.status)) {
        if (response.status === 401) this.access = null;
        throw new Error(response.status === 403 ? "Drive kotası veya dosya izni yeterli değil. Ücretli plana geçilmedi; notlar korunuyor." : "Drive işlemi tamamlanamadı. Yerel notlar korunuyor.");
      }
      return response;
    }

    async find(parent, property, value) {
      if (![parent, property, value].every(item => /^[a-zA-Z0-9_-]+$/.test(item))) throw new Error("Geçersiz Drive dosya sorgusu.");
      const url = new URL("files", API);
      url.searchParams.set("q", `'${parent}' in parents and trashed = false and appProperties has { key='${property}' and value='${value}' }`);
      url.searchParams.set("fields", "files(id,size,sha256Checksum,mimeType,parents)");
      const result = await (await this.google(url)).json();
      return result.files?.[0] || null;
    }

    remember(key, value) {
      try { this.storage?.setItem(key, JSON.stringify(value)); } catch { /* Uploads remain usable without resumable tab metadata. */ }
    }

    async upload(blob, name, parent, hash, onProgress = () => {}) {
      const existing = await this.find(parent, "sha256", hash);
      if (existing?.sha256Checksum === hash && Number(existing.size) === blob.size) return existing;
      const key = `mee101_drive_upload_v1:${parent}:${hash}`;
      let checkpoint;
      try { checkpoint = JSON.parse(this.storage?.getItem(key) || "null"); } catch { /* Start a fresh session. */ }
      let offset = 0, result;
      if (checkpoint?.size === blob.size) {
        const response = await this.google(checkpoint.url, { method: "PUT", headers: { "Content-Range": `bytes */${blob.size}` }, body: new Blob([]) }, [404,410]);
        if ([404,410].includes(response.status)) checkpoint = null;
        else if (response.status !== 308) result = await response.json();
        else offset = Number(response.headers.get("Range")?.match(/-(\d+)$/)?.[1] ?? -1) + 1;
      } else checkpoint = null;
      if (!checkpoint) {
        const response = await this.google(UPLOAD, { method: "POST", headers: { "Content-Type": "application/json", "X-Upload-Content-Type": blob.type || "application/octet-stream", "X-Upload-Content-Length": String(blob.size) },
          body: JSON.stringify({ name, parents: [parent], mimeType: blob.type || "application/octet-stream", appProperties: { sha256: hash } }) });
        checkpoint = { url: response.headers.get("Location"), size: blob.size };
        if (!checkpoint.url) throw new Error("Drive yükleme oturumu açılamadı.");
        this.remember(key, checkpoint);
      }
      while (!result && offset < blob.size) {
        const end = Math.min(offset + CHUNK_SIZE, blob.size);
        const response = await this.google(checkpoint.url, { method: "PUT", headers: { "Content-Range": `bytes ${offset}-${end - 1}/${blob.size}` }, body: blob.slice(offset, end) });
        if (response.status !== 308) result = await response.json();
        offset = response.status === 308 ? Number(response.headers.get("Range")?.match(/-(\d+)$/)?.[1] ?? end - 1) + 1 : end;
        onProgress({ stage: "drive-upload", completed: offset, total: blob.size });
      }
      if (!result?.id) throw new Error("Drive dosyası kaydedilemedi.");
      if (!result.sha256Checksum) result = await (await this.google(new URL(`files/${encodeURIComponent(result.id)}?fields=id,size,sha256Checksum,mimeType,parents`, API))).json();
      if (result.sha256Checksum !== hash || Number(result.size) !== blob.size) throw new Error("Drive dosyası doğrulanamadı; özgün notlar korunuyor.");
      return result;
    }

    async externalize(lectures, onProgress = () => {}) {
      const addresses = new Set();
      // PDF sources are published inline to GitHub, including all mixed-page references.
      const pdfSources = new Set(lectures.flatMap(lecture => [lecture.pdfUrl,
        ...(lecture.slides || []).map(slide => slide.pdf?.source)]).filter(Boolean));
      const urls = text => text.startsWith("data:") ? [text] : [...text.matchAll(/(["'])(data:[\s\S]*?)\1/g)].map(match => match[2]);
      const collect = value => {
        if (typeof value === "string") urls(value).filter(url => url.length >= MIN_ASSET_LENGTH && !pdfSources.has(url)).forEach(url => addresses.add(url));
        else if (value && typeof value === "object") Object.values(value).forEach(collect);
      };
      collect(lectures);
      if (!addresses.size) return lectures;
      const document = this.codec.snapshot(lectures);
      const replacements = new Map(), iterator = addresses.values();
      let completed = 0;
      const worker = async () => {
        for (let item = iterator.next(); !item.done; item = iterator.next()) {
          const response = await this.fetch(item.value);
          if (!response.ok) throw new Error("Özgün dosya okunamadı; notlar korunuyor.");
          const blob = await response.blob(), hash = await this.digest(await blob.arrayBuffer());
          const session = await this.session();
          const file = await this.upload(blob, hash, session.assetsFolder, hash, onProgress);
          await this.service("register", { hash, fileId: file.id, size: blob.size });
          replacements.set(item.value, this.assetBase + hash);
          onProgress({ stage: "drive-assets", completed: ++completed, total: addresses.size });
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, addresses.size) }, worker));
      const replace = value => {
        if (typeof value === "string") {
          if (replacements.has(value)) return replacements.get(value);
          return value.replace(/(["'])(data:[\s\S]*?)\1/g, (match, quote, url) => replacements.has(url) ? `${quote}${replacements.get(url)}${quote}` : match);
        }
        if (value && typeof value === "object") for (const key of Object.keys(value)) value[key] = replace(value[key]);
        return value;
      };
      return replace(document);
    }

    async backup(lectures, onProgress = () => {}) {
      const session = await this.session(), hashes = [];
      for (const part of this.codec.parts(lectures)) hashes.push(await this.digest(part));
      const digest = await this.digest(JSON.stringify(hashes));
      let folder = await this.find(session.backupFolder, "snapshot", digest);
      if (!folder) folder = await (await this.google(new URL("files?fields=id", API), { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `ME101-${new Date().toISOString().slice(0, 10)}-${digest.slice(0, 10)}`, mimeType: "application/vnd.google-apps.folder", parents: [session.backupFolder], appProperties: { snapshot: digest } }) })).json();
      const parts = [];
      for (const part of this.codec.parts(lectures)) {
        const index = parts.length, packed = await this.codec.pack(part);
        const blob = new Blob([packed.content], { type: "text/plain" });
        const file = await this.upload(blob, `${index}.txt`, folder.id, await this.digest(await blob.arrayBuffer()));
        parts.push({ id: file.id, digest: hashes[index], encoding: packed.encoding });
        onProgress({ stage: "drive-backup", completed: parts.length, total: hashes.length });
      }
      const assets = await this.backupAssets(lectures, session.backupFolder);
      const manifest = { format: "mee101-drive-backup-v2", savedAt: new Date().toISOString(), lectureCount: lectures.length, parts, assets, digest };
      const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
      const file = await this.upload(blob, "backup.json", folder.id, await this.digest(await blob.arrayBuffer()));
      return { id: file.id, folderId: folder.id, manifest };
    }

    async backupAssets(lectures, backupFolder) {
      const hashes = new Set();
      const pattern = new RegExp(this.assetBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([a-f0-9]{64})", "g");
      const collect = value => {
        if (typeof value === "string") for (const match of value.matchAll(pattern)) hashes.add(match[1]);
        else if (value && typeof value === "object") Object.values(value).forEach(collect);
      };
      collect(lectures);
      const result = [];
      for (const hash of hashes) {
        let file = await this.find(backupFolder, "backupMedia", hash);
        if (!file) {
          const original = await this.service("lookup", { hash });
          file = await (await this.google(new URL(`files/${encodeURIComponent(original.fileId)}/copy?fields=id,sha256Checksum,mimeType,size`, API), { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: hash, parents: [backupFolder], appProperties: { backupMedia: hash } }) })).json();
        }
        if (file.sha256Checksum !== hash) throw new Error("Drive medya yedeği doğrulanamadı; notlar korunuyor.");
        result.push({ hash, fileId: file.id, mimeType: file.mimeType });
      }
      return result;
    }
  }

  root.GoogleDriveStorage = GoogleDriveStorage;
  if (typeof module !== "undefined") module.exports = { GoogleDriveStorage };
})(typeof window !== "undefined" ? window : globalThis);
