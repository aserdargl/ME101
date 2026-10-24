const { test } = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const codec = require("../lecture-document.js");
const { GoogleDriveStorage } = require("../google-drive-storage.js");
const { fakeDrive } = require("./drive-fixture.cjs");

function create(server, values = new Map()) {
  return new GoogleDriveStorage({ baseUrl: "https://lecture.example.test/", fetch: server.fetch, crypto: webcrypto, codec,
    getIdToken: async () => "firebase-fixture", storage: { getItem: key => values.get(key), setItem: (key,value) => values.set(key,value) } });
}

test("Drive backup remains self-contained and verified before large assets replace inline URLs", async () => {
  const server = fakeDrive(), service = create(server);
  const image = "data:image/png;base64," + Buffer.alloc(70000, 42).toString("base64");
  const lectures = [{ id: "preserve", title: "Özgün notlar", custom: { keep: true }, slides: [{ html: `<p>Özgün açıklama</p><img src="${image}">`, extractedImages: [image] }] }];
  const before = structuredClone(lectures);
  const backup = await service.backup(lectures);
  const reader = codec.decoder();
  for (const part of backup.manifest.parts) {
    const text = await codec.unpack(server.files.get(part.id).bytes.toString(), part.encoding);
    assert.equal(await service.digest(text), part.digest);
    reader.add(text);
  }
  assert.deepEqual(reader.result(), before);
  const external = await service.externalize(lectures);
  assert.deepEqual(lectures, before, "uploading cannot mutate the original notes");
  assert.equal(server.registered.size, 1, "repeated media is uploaded once");
  const url = external[0].slides[0].extractedImages[0];
  assert.ok(url.startsWith(service.assetBase));
  assert.equal(external[0].slides[0].html, `<p>Özgün açıklama</p><img src="${url}">`);
  const secondBackup = await service.backup(external);
  assert.equal(secondBackup.manifest.assets.length, 1);
  const copy = secondBackup.manifest.assets[0], source = server.registered.get(copy.hash);
  assert.notEqual(copy.fileId, source, "an independent private media copy survives deletion of the course file");
  assert.deepEqual(server.files.get(copy.fileId).bytes, server.files.get(source).bytes);
  assert.ok(server.files.get(copy.fileId).parents.includes("backup-folder-123"));
  assert.ok(server.requests.every(request => request.method !== "DELETE"));
});

test("resumable Drive uploads continue after reload without sending acknowledged bytes twice", async () => {
  const server = fakeDrive(), values = new Map();
  const blob = new Blob([Buffer.alloc(10 * 1024 * 1024, 17)], { type: "application/octet-stream" });
  const service = create(server, values), hash = await service.digest(await blob.arrayBuffer());
  server.state.interruptAfterBytes = 8 * 1024 * 1024;
  await assert.rejects(() => service.upload(blob, "original.pptx", "course-folder-123", hash), /Synthetic interrupted/);
  assert.equal(server.state.transferred, 8 * 1024 * 1024);
  server.state.interruptAfterBytes = Infinity;
  const file = await create(server, values).upload(blob, "original.pptx", "course-folder-123", hash);
  assert.equal(server.state.transferred, blob.size);
  assert.equal(file.sha256Checksum, hash);
  assert.ok([...values.values()].every(value => !value.includes("google-fixture") && !value.includes("firebase-fixture")));
});

test("Drive quota failures retain notes and do not attempt an upgrade or alternate storage", async () => {
  const server = fakeDrive(), service = create(server);
  const lectures = [{ id: "safe", slides: [{ html: "Korunacak not" }] }];
  const before = structuredClone(lectures);
  server.state.quotaExceeded = true;
  await assert.rejects(() => service.backup(lectures), /Ücretli plana geçilmedi/);
  assert.deepEqual(lectures, before);
  assert.equal(server.registered.size, 0);
  assert.ok(server.requests.every(request => !/billing|cloudflare\.com|r2\./.test(request.url)));
});
