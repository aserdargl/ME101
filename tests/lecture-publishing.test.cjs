const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto, createHash } = require("node:crypto");
const digest = text => createHash("sha256").update(text).digest("hex");

test("explicit publication replaces the list exactly, preserves edits during transfer, and rejects unseen remote changes", async () => {
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
  await service.publish();
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
  assert.equal(applied, 1, "a completed upload cannot overwrite edits saved during the transfer");
  assert.equal(saved, 2, "an unchanged upload is backed up once before transfer");
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
