const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto, createHash } = require("node:crypto");
const digest = text => createHash("sha256").update(text).digest("hex");

test("saving publishes automatically, queues edits during transfer, and rejects unseen remote changes", async () => {
  let local = [{ id: "same", title: "Ders", slides: [{ html: "Bu tarayıcıdaki özel not" }] }];
  let remote = [{ id: "same", title: "Ders", slides: [{ html: "Diğer cihazdaki özgün not" }] }];
  let manifest = { id: "published-id", digest: digest(JSON.stringify(remote)) };
  let applied = 0, published, blockPublish, saved = 0;
  const metadata = new Map(), elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { textContent: "", value: "", classList: { toggle() {}, add() {}, remove() {} }, addEventListener() {}, focus() {} });
    return elements.get(id);
  };
  class FakeRepository {
    async readPublished() { return { manifest, lectures: remote }; }
    async readCurrent() { return { manifest, lectures: remote, head: "head", tree: "tree" }; }
    async digest(text) { return digest(text); }
    async documentDigest(lectures) { return digest(JSON.stringify(lectures)); }
    async login() { return true; }
    async publish(lectures) { if (blockPublish) await blockPublish; published = structuredClone(lectures); remote = structuredClone(lectures); manifest = { id: "new-id", digest: digest(JSON.stringify(lectures)) }; return manifest; }
    logout() {}
  }
  const context = {
    document: { getElementById: element }, InstructorLectureRepository: FakeRepository, crypto: webcrypto,
    localStorage: { getItem: key => metadata.get(key) || null, setItem: (key, value) => metadata.set(key, value) },
    structuredClone, LectureStorage: { save: async () => { saved += 1; return true; } }, fetch: async () => { throw Error("Unexpected media fetch"); }
  };
  context.window = { addEventListener() {}, MEE101_GITHUB_ENABLED: true, LectureDocument: require("../lecture-document.js") };
  vm.runInNewContext(fs.readFileSync(require.resolve("../lecture-publishing.js"), "utf8"), context);
  const service = context.window.LecturePublishing;
  await service.initialize({ hasLocalData: true, getLectures: () => local, applyLectures: notes => { local = notes; applied += 1; }, onAuthenticated() {} });
  assert.equal(applied, 0, "reading shared notes must not replace unsynced notes");
  assert.equal(local[0].slides[0].html, "Bu tarayıcıdaki özel not");
  await service.login("fixture-access-key");
  await service.save();
  assert.equal(published.length, 1);
  assert.equal(published.some(lecture => lecture.slides[0].html === "Diğer cihazdaki özgün not"), false);
  assert.ok(published.some(lecture => lecture.slides[0].html === "Bu tarayıcıdaki özel not"));
  assert.equal(applied, 1);
  assert.equal(saved, 1, "the exact published document needs only its original local backup");
  assert.ok([...metadata.values()].every(value => !value.includes("fixture-access-key")));
  let release;
  blockPublish = new Promise(resolve => { release = resolve; });
  const inProgress = service.publish();
  await new Promise(resolve => setImmediate(resolve));
  local[0].slides[0].html = "Aktarım sırasında eklenen yeni not";
  service.markChanged();
  service.save();
  release();
  await inProgress;
  assert.equal(local[0].slides[0].html, "Aktarım sırasında eklenen yeni not");
  assert.equal(applied, 2, "only the queued latest publication may apply the latest saved edits");
  assert.equal(published[0].slides[0].html, "Aktarım sırasında eklenen yeni not");
  assert.equal(saved, 3, "the pending saved version is backed up and published in a second transfer");
  blockPublish = null;
  local = [];
  await service.publish();
  assert.equal(published.length, 0, "deleting all lessons publishes an empty list without resurrecting remote lessons");
  local = [{ id: "new", slides: [] }];
  await service.publish();
  assert.deepEqual(published.map(lecture => lecture.id), ["new"]);
  const previous = published;
  manifest = { id: "other-device", digest: "changed" };
  remote = [{ id: "other-device", slides: [] }];
  await service.publish();
  assert.equal(published, previous, "unseen changes from another device must block publication");
  assert.deepEqual(local.map(lecture => lecture.id), ["new"]);
  assert.match(element("cloud-status-text").textContent, /Başka bir cihazdan yeni yayın/);
});

test("failed automatic publication stops without a retry loop and the next save can retry", async () => {
  const local = [{ id: "unsynced", slides: [{ html: "Keep this note" }] }];
  let calls = 0, fail = true, active = 0, maximumActive = 0;
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: "", value: 0, classList: { toggle() {} }, addEventListener() {} });
    return nodes.get(id);
  };
  let manifest = null;
  class Repository {
    async login() { return true; }
    async readPublished() { return { manifest: null, lectures: null }; }
    async readCurrent() { return { manifest }; }
    async publish() {
      calls++; active++; maximumActive = Math.max(maximumActive, active);
      await new Promise(resolve => setImmediate(resolve));
      active--;
      if (fail) throw new Error("Synthetic offline failure");
      manifest = { id: `version-${calls}`, digest: "saved" };
      return manifest;
    }
  }
  const context = { document: { getElementById: element }, InstructorLectureRepository: Repository,
    localStorage: { getItem: () => null, setItem() {} }, LectureStorage: { save: async () => true } };
  context.window = { addEventListener() {}, LectureDocument: require("../lecture-document.js") };
  vm.runInNewContext(fs.readFileSync(require.resolve("../lecture-publishing.js"), "utf8"), context);
  const service = context.window.LecturePublishing;
  await service.initialize({ hasLocalData: true, getLectures: () => local, applyLectures() {} });
  await service.save();
  assert.equal(calls, 0, "signed-out saves must not publish");
  await service.login();
  await Promise.all([service.save(), service.save(), service.save()]);
  assert.equal(calls, 1, "failure must not drain queued saves into an endless retry");
  assert.match(element("cloud-status-text").textContent, /Synthetic offline failure/);
  assert.equal(local[0].slides[0].html, "Keep this note");
  fail = false;
  await service.save();
  assert.equal(calls, 2);
  assert.equal(maximumActive, 1);
});

test("an unavailable optional Drive backup does not block publishing the original PDF to GitHub", async () => {
  const source = "data:application/pdf;base64,c3ludGhldGljLW9ubHk=";
  let local = [{ id: "pdf", pdfUrl: source, slides: [{ pdf: { source, page: 1 }, html: "Original note" }] }];
  const before = structuredClone(local);
  let published, backupError = "Drive bağlantısı hazır değil.";
  let manifest = { id: "current", format: 2, partLength: 4 * 1024 * 1024, digest: "same-hash" };
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: "", value: 0, classList: { toggle() {} }, addEventListener() {} });
    return nodes.get(id);
  };
  class Repository {
    async readPublished() { return { manifest, lectures: local }; }
    async readCurrent() { return { manifest }; }
    async documentDigest() { return "same-hash"; }
    async login() { return true; }
    async publish(lectures) { published = structuredClone(lectures); manifest = { ...manifest, id: "next" }; return manifest; }
  }
  const root = { addEventListener() {}, LectureDocument: require("../lecture-document.js"),
    DrivePublishing: { enabled: () => true, prepare: async () => { throw new Error(backupError); } } };
  const context = { window: root, document: { getElementById: element }, InstructorLectureRepository: Repository,
    localStorage: { getItem: () => null, setItem() {} }, LectureStorage: { save: async () => true } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../lecture-publishing.js"), "utf8"), context);
  const service = root.LecturePublishing;
  await service.initialize({ hasLocalData: true, getLectures: () => local, applyLectures: value => { local = value; } });
  await service.login();
  for (backupError of ["Drive bağlantısı hazır değil.", "Drive kotası yeterli değil."]) {
    await service.publish();
    assert.deepEqual(published, before);
    assert.deepEqual(local, before);
    assert.match(element("cloud-status-text").textContent, /GitHub’a kaydedildi/);
    assert.ok(element("cloud-status-text").textContent.includes(backupError), "backup failure must remain visible");
  }
});
