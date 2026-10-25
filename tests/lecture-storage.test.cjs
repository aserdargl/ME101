const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { webcrypto } = require("node:crypto");
const { IDBFactory } = require("fake-indexeddb");

function storageHarness(legacy, indexedDB = new IDBFactory()) {
  const values = new Map([["me101_all_lectures_v2", JSON.stringify(legacy)]]);
  const context = {
    indexedDB, crypto: webcrypto, TextEncoder, structuredClone,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    localStorage: { getItem: key => values.get(key) || null }, window: { addEventListener() {}, dispatchEvent() {} }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve("../lecture-document.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(require.resolve("../lecture-storage.js"), "utf8"), context);
  return { store: context.window.LectureStorage, values, indexedDB };
}
const note = (id, html) => ({ id, title: "Notlar", slides: [{ html }] });

async function database(indexedDB) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mee101-notes-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("lecture-snapshots");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function records(indexedDB) {
  const db = await database(indexedDB);
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("lecture-snapshots").objectStore("lecture-snapshots").getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

test("repeated large-media saves and reloads retain only one recovery copy per version", async () => {
  const data = [note("large", "data:image/png;base64," + "A".repeat(8 * 1024 * 1024))];
  const { store, indexedDB } = storageHarness([]);
  assert.equal(await store.save(data), true);
  assert.equal(await store.save(data), true);
  const restarted = storageHarness([], indexedDB).store;
  assert.equal(await restarted.save(data), true);
  assert.equal((await records(indexedDB)).length, 2, "one current record and one recovery copy");
  assert.equal((await restarted.load())[0].slides[0].html, data[0].slides[0].html);
  data[0].slides[0].html += "edited";
  assert.equal(await restarted.save(data), true);
  assert.equal((await records(indexedDB)).length, 3, "a changed version adds one recovery copy");
});

test("save captures edits before awaiting and preserves all pre-existing recovery records", async () => {
  const { store, indexedDB, values } = storageHarness([]);
  const db = await database(indexedDB);
  const old = { lectures: [note("old", "Earlier recovery note")] };
  await new Promise((resolve, reject) => {
    const transaction = db.transaction("lecture-snapshots", "readwrite");
    transaction.objectStore("lecture-snapshots").put(old, "backup-original");
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  const data = [note("current", "Saved before awaiting")];
  const saving = store.save(data);
  data[0].slides[0].html = "Newer unsaved edit";
  assert.equal(await saving, true);
  assert.equal((await store.load())[0].slides[0].html, "Saved before awaiting");
  assert.ok((await records(indexedDB)).includes("backup-original"));
  const record = await new Promise(resolve => {
    const request = db.transaction("lecture-snapshots").objectStore("lecture-snapshots").get("backup-original");
    request.onsuccess = () => resolve(request.result);
  });
  assert.deepEqual(record, old);
  assert.equal(values.get("me101_all_lectures_v2"), "[]");
  db.close();
});

test("a slow publication backup cannot overwrite a newer edit saved while it is running", async () => {
  const { store, indexedDB } = storageHarness([]);
  const earlier = store.save([note("same", "A".repeat(8 * 1024 * 1024))]);
  const newer = store.save([note("same", "Newest edited note")]);
  assert.deepEqual(await Promise.all([earlier, newer]), [true, true]);
  assert.equal((await store.load())[0].slides[0].html, "Newest edited note");
  assert.equal((await records(indexedDB)).length, 3, "both versions remain recoverable");
});

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

test("PDF page references store the original bytes once and survive a fresh load", async () => {
  const source = "data:application/pdf;base64," + "A".repeat(64 * 1024);
  const data = [{ id: "many-pages", pdfUrl: source, slides: Array.from({ length: 80 }, (_, index) => ({
    title: `Page ${index + 1}`, html: "", pdf: { source, page: index + 1, width: 960, height: 540 }
  })) }];
  const { store, indexedDB } = storageHarness([]);
  assert.equal(await store.save(data), true);
  const db = await database(indexedDB);
  const record = await new Promise(resolve => {
    const request = db.transaction("lecture-snapshots").objectStore("lecture-snapshots").get("current");
    request.onsuccess = () => resolve(request.result);
  });
  db.close();
  assert.ok(JSON.stringify(record).length < source.length * 3, "page count must not multiply stored PDF bytes");
  const restarted = storageHarness([], indexedDB).store;
  const loaded = await restarted.load();
  assert.equal(loaded[0].slides.length, 80);
  assert.equal(loaded[0].pdfUrl, source);
  assert.ok(loaded[0].slides.every(slide => slide.pdf.source === source));
});

test("legacy IndexedDB documents remain readable without rewriting their records", async () => {
  const { store, indexedDB, values } = storageHarness([]);
  values.clear();
  const db = await database(indexedDB);
  const old = { lectures: [note("old-current", "Existing saved notes")], savedAt: "2026-01-01" };
  await new Promise((resolve, reject) => {
    const tx = db.transaction("lecture-snapshots", "readwrite");
    tx.objectStore("lecture-snapshots").put(old, "current");
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
  assert.equal((await store.load())[0].slides[0].html, "Existing saved notes");
  const after = await new Promise(resolve => {
    const request = db.transaction("lecture-snapshots").objectStore("lecture-snapshots").get("current");
    request.onsuccess = () => resolve(request.result);
  });
  assert.deepEqual(after, old);
  db.close();
});
