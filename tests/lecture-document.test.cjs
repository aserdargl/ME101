const { test } = require("node:test");
const assert = require("node:assert/strict");
const { snapshot, legacyJson, parts, decoder, partLength, pack, unpack } = require("../lecture-document.js");

test("small legacy backups preserve exact JSON and large media bypasses the bounded store", () => {
  const small = [{ title: 'Özgün 😀', html: '<p>Keep "quoted" text</p>', metadata: { keep: true } }];
  assert.equal(legacyJson(small), JSON.stringify(small));
  const large = [{ slides: [{ image: 'A'.repeat(3 * 1024 * 1024) }] }];
  assert.equal(legacyJson(large), null);
  assert.equal(large[0].slides[0].image.length, 3 * 1024 * 1024);
  assert.equal(legacyJson({ html: '\\'.repeat(60) }, 100), null, "escaped JSON also respects the limit");
});

test("media snapshots isolate nested edits while preserving Unicode, metadata and shared references", () => {
  const media = "data:image/png;base64," + "A".repeat(8 * 1024 * 1024);
  const shared = { image: media, html: "Özgün not 😀" };
  const original = [{ id: "notes", metadata: { custom: [false, null, 42] }, slides: [shared, shared] }];
  const copy = snapshot(original);
  assert.deepEqual(copy, original);
  assert.notEqual(copy[0].slides[0], shared);
  assert.equal(copy[0].slides[0], copy[0].slides[1]);
  copy[0].slides[0].html = "Changed only in snapshot";
  copy[0].metadata.custom.push("new");
  assert.equal(shared.html, "Özgün not 😀");
  assert.equal(original[0].metadata.custom.length, 3);
  assert.equal(copy[0].slides[0].image, media);
});

function roundTrip(document) {
  const reader = decoder();
  let size = 0, count = 0;
  for (const part of parts(document)) {
    assert.ok(part.length <= partLength);
    size += part.length; count += 1; reader.add(part);
  }
  return { document: reader.result(), size, count };
}

test("bounded records preserve Unicode, escaped notes, metadata and repeated images", () => {
  const media = "data:image/svg+xml," + "A".repeat(32767) + "😀\n\"\\".repeat(400000);
  const input = [{ id: "custom", title: "Özgün ders", metadata: { keep: true, empty: null },
    slides: [{ html: `<p>Notlar</p><img src='${media}'>`, extractedImages: [media], visual: media },
      { html: "", image: media, list: [], object: {} }] }];
  const result = roundTrip(input);
  assert.deepEqual(result.document, input);
  assert.ok(result.count > 1);
  assert.ok(result.size < JSON.stringify(input).length);
});

test("documents above the engine string limit transfer without a document-wide string", () => {
  const image = "data:image/png;base64," + "A".repeat(1024 * 1024);
  const input = [{ id: "large", slides: Array.from({ length: 600 }, (_, index) => ({ title: `Slide ${index}`, image })) }];
  assert.ok(image.length * input[0].slides.length > require("node:buffer").constants.MAX_STRING_LENGTH);
  const result = roundTrip(input);
  assert.ok(result.size < 2 * 1024 * 1024, "repeated media is encoded once");
  assert.equal(result.document[0].slides.length, 600);
  for (const slide of result.document[0].slides) assert.equal(slide.image, image);
});

test("ordinary own properties cannot alter object prototypes during decoding", () => {
  const input = JSON.parse('{"__proto__":{"keep":"yes"},"constructor":{"name":"note"}}');
  assert.deepEqual(roundTrip(input).document, input);
  assert.equal({}.keep, undefined);
  const reader = decoder();
  assert.throws(() => reader.add('{"path":[],"value":{}}\n{"path":["__proto__","keep"],"value":"no"}'), /Invalid lecture document reference/);
  assert.equal({}.keep, undefined);
});

test("lossless packing reduces transfer size and preserves Unicode, notes and images exactly", async () => {
  const text = JSON.stringify({ note: "Özgün notlar 😀".repeat(2000), image: "data:image/png;base64," + "A".repeat(1024 * 1024) });
  const packed = await pack(text);
  assert.equal(packed.encoding, "gzip");
  assert.ok(packed.content.length < text.length / 10);
  assert.equal(await unpack(packed.content, packed.encoding), text);
  assert.equal(await unpack(text), text, "previously published uncompressed files still open");
});

test("photo-like data bypasses unhelpful whole-part compression", async () => {
  const photo = require("node:crypto").randomBytes(256 * 1024).toString("base64");
  const text = JSON.stringify({ image: `data:image/png;base64,${photo}` });
  const packed = await pack(text);
  assert.equal(packed.encoding, "plain");
  assert.equal(packed.content, text);
});
