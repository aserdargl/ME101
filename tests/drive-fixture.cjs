const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

/** Isolated Google Drive fixture; credentials and files never leave this process. */
function fakeDrive() {
  const files = new Map(), uploads = new Map(), registered = new Map(), requests = [];
  const state = { interruptAfterBytes: Infinity, transferred: 0, quotaExceeded: false };
  let sequence = 0;
  const json = (body, status = 200) => Response.json(body, { status });
  const metadata = file => ({ id: file.id, size: String(file.bytes.length), mimeType: file.mimeType, parents: file.parents, sha256Checksum: sha(file.bytes) });
  async function fetch(input, options = {}) {
    const url = new URL(input), method = options.method || "GET";
    requests.push({ url: url.href, method });
    if (url.protocol === "data:") return globalThis.fetch(url);
    if (url.hostname === "lecture.example.test") {
      if (url.pathname.startsWith("/drive/assets/") && method === "GET") {
        const file = files.get(registered.get(url.pathname.split("/").at(-1)));
        return file ? new Response(file.bytes, { headers: { "Content-Type": file.mimeType } }) : json({},404);
      }
      assert.equal(options.headers.Authorization, "Bearer firebase-fixture");
      const body = JSON.parse(options.body);
      if (url.pathname === "/drive/session") return json({ ok: true, token: "google-fixture", expiresIn: 3000, assetsFolder: "course-folder-123", backupFolder: "backup-folder-123" });
      if (url.pathname === "/drive/register") {
        const file = files.get(body.fileId);
        assert.equal(sha(file.bytes), body.hash);
        assert.equal(file.bytes.length, body.size);
        assert.ok(file.parents.includes("course-folder-123"));
        registered.set(body.hash, body.fileId);
        return json({ ok: true });
      }
      if (url.pathname === "/drive/lookup") return json({ ok: true, fileId: registered.get(body.hash) });
      throw Error(`Unexpected fixture service ${url.pathname}`);
    }
    assert.equal(url.hostname, "www.googleapis.com");
    assert.equal(options.headers.Authorization, "Bearer google-fixture");
    if (state.quotaExceeded && method !== "GET") return json({ error: "quota" }, 403);
    if (url.pathname === "/drive/v3/files" && method === "GET") {
      const query = url.searchParams.get("q");
      const parent = query.match(/^'([^']+)'/)[1], [, property, value] = query.match(/key='([^']+)' and value='([^']+)'/);
      return json({ files: [...files.values()].filter(file => file.parents.includes(parent) && file.appProperties?.[property] === value && file.complete).map(metadata) });
    }
    if (url.pathname === "/drive/v3/files" && method === "POST") {
      const body = JSON.parse(options.body), id = `drive-folder-${++sequence}`;
      files.set(id, { ...body, id, bytes: Buffer.alloc(0), complete: true });
      return json({ id });
    }
    if (url.pathname.startsWith("/upload/drive/v3/files") && method === "POST") {
      const body = JSON.parse(options.body), id = `drive-file-${++sequence}`;
      const file = { ...body, id, bytes: Buffer.alloc(0), complete: false };
      files.set(id, file); uploads.set(id, file);
      return new Response("", { headers: { Location: `https://www.googleapis.com/upload/drive/v3/files?upload_id=${id}` } });
    }
    if (url.pathname.startsWith("/upload/drive/v3/files") && method === "PUT") {
      const file = uploads.get(url.searchParams.get("upload_id"));
      if (!file) return json({}, 404);
      const range = options.headers["Content-Range"];
      if (!range.startsWith("bytes */")) {
        if (state.transferred >= state.interruptAfterBytes) throw Error("Synthetic interrupted upload");
        const match = range.match(/bytes (\d+)-(\d+)\/(\d+)/);
        assert.equal(Number(match[1]), file.bytes.length);
        const bytes = Buffer.from(await options.body.arrayBuffer());
        file.bytes = Buffer.concat([file.bytes, bytes]); state.transferred += bytes.length;
        file.complete = file.bytes.length === Number(match[3]);
      }
      return file.complete ? json(metadata(file)) : new Response("", { status: 308, headers: file.bytes.length ? { Range: `bytes=0-${file.bytes.length - 1}` } : {} });
    }
    const match = url.pathname.match(/^\/drive\/v3\/files\/([^/]+)(\/copy)?$/);
    if (match) {
      const file = files.get(decodeURIComponent(match[1]));
      assert.ok(file);
      if (method === "POST" && match[2]) {
        const body = JSON.parse(options.body), id = `drive-copy-${++sequence}`;
        const copy = { ...file, ...body, id, bytes: Buffer.from(file.bytes) }; files.set(id, copy);
        return json(metadata(copy));
      }
      return url.searchParams.get("alt") === "media" ? new Response(file.bytes, { headers: { "Content-Type": file.mimeType } }) : json(metadata(file));
    }
    throw Error(`Unexpected fixture endpoint ${method} ${url.href}`);
  }
  return { fetch, files, uploads, registered, requests, state };
}
module.exports = { fakeDrive, sha };
