const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto, createHash } = require("node:crypto");
const digest = text => createHash("sha256").update(text).digest("hex");

test("unsynced browser notes stay local until an explicit merge; conflicts preserve both versions", async () => {
  let local = [{ id: "same", title: "Ders", slides: [{ html: "Bu tarayıcıdaki özel not" }] }];
  const remote = [{ id: "same", title: "Ders", slides: [{ html: "Diğer cihazdaki özgün not" }] }];
  const manifest = { id: "published-id", digest: digest(JSON.stringify(remote)) };
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
    async publish(lectures) { if (blockPublish) await blockPublish; published = structuredClone(lectures); return { id: "new-id", digest: digest(JSON.stringify(lectures)) }; }
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
  assert.equal(published.length, 2);
  assert.ok(published.some(lecture => lecture.slides[0].html === "Diğer cihazdaki özgün not"));
  assert.ok(published.some(lecture => lecture.slides[0].html === "Bu tarayıcıdaki özel not"));
  assert.equal(applied, 1);
  assert.equal(saved, 2, "a merged document needs both the original and merged recovery copies");
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
  assert.equal(saved, 3, "an unchanged upload is backed up once before transfer");
});
