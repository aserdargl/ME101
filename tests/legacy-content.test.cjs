const { test } = require("node:test");
const assert = require("node:assert/strict");
const { userLectures } = require("../legacy-content.js");
const defaults = require("./legacy-defaults.fixture.json");

test("bundled samples disappear without mutating the stored records", async () => {
  const before = JSON.stringify(defaults);
  assert.deepEqual(await userLectures(defaults), []);
  assert.equal(JSON.stringify(defaults), before);
});

test("uploaded lessons and edits to a bundled lesson are preserved exactly", async () => {
  const edited = structuredClone(defaults[0]);
  edited.slides[0].html += '<p>Öğretim üyesinin eklediği not.</p>';
  const uploaded = { id: "custom-upload", title: "Kendi sunumum", slides: [{ html: "Kendi notum" }] };
  const result = await userLectures([...defaults, edited, uploaded]);
  assert.deepEqual(result, [edited, uploaded]);
  assert.equal(result[0], edited);
});
