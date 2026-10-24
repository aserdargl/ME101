const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parts, decoder } = require("../lecture-document.js");

function roundTrip(document) {
  const reader = decoder();
  let size = 0, count = 0;
  for (const part of parts(document)) {
    assert.ok(part.length <= 512 * 1024);
    size += part.length; count += 1; reader.add(part);
  }
  return { document: reader.result(), size, count };
}

test("bounded records preserve Unicode, escaped notes, metadata and repeated images", () => {
  const media = "data:image/svg+xml," + "A".repeat(32767) + "😀\n\"\\".repeat(80000);
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
