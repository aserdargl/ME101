const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { webcrypto } = require("node:crypto");
const { IDBFactory } = require("fake-indexeddb");

function storageHarness(legacy) {
  const values = new Map([["me101_all_lectures_v2", JSON.stringify(legacy)]]);
  const context = {
    indexedDB: new IDBFactory(), crypto: webcrypto, TextEncoder, structuredClone,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    localStorage: { getItem: key => values.get(key) || null }, window: { addEventListener() {}, dispatchEvent() {} }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve("../lecture-storage.js"), "utf8"), context);
  return { store: context.window.LectureStorage, values };
}
const note = (id, html) => ({ id, title: "Notlar", slides: [{ html }] });

test("large-image saves survive even when the small legacy store remains unchanged", async () => {
  const old = [note("same", "Önceki not")];
  const current = [note("same", "Yeni not ve kalıcı görsel")];
  const { store, values } = storageHarness(old);
  assert.equal(await store.save(current), true);
  assert.equal((await store.load())[0].slides[0].html, "Yeni not ve kalıcı görsel");
  assert.equal(values.get("me101_all_lectures_v2"), JSON.stringify(old), "legacy data is never erased");
  values.set("me101_all_lectures_v2", "invalid older data");
  assert.equal((await store.load())[0].slides[0].html, "Yeni not ve kalıcı görsel");
});

test("a cached older tab cannot silently replace newer notes; both copies are preserved", async () => {
  const legacy = [note("same", "İlk not")];
  const { store, values } = storageHarness(legacy);
  await store.save([note("same", "Yeni sürümde eklediğim not")]);
  values.set("me101_all_lectures_v2", JSON.stringify([note("same", "Eski sekmede eklediğim not")]));
  const loaded = await store.load();
  assert.equal(loaded.length, 2);
  assert.ok(loaded.some(lecture => lecture.slides[0].html === "Yeni sürümde eklediğim not"));
  assert.ok(loaded.some(lecture => lecture.slides[0].html === "Eski sekmede eklediğim not"));
  assert.ok(store.warning.includes("her iki sürüm"));
});
