const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function setup(parse) {
  const nodes = new Map();
  const document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { value: "", textContent: "", innerHTML: "", disabled: false, addEventListener() {}, replaceChildren() { this.innerHTML = ""; } });
    return nodes.get(id);
  } };
  document.getElementById("imp-week").value = "2. Hafta";
  document.getElementById("imp-title").value = "QA";
  const window = {};
  vm.runInNewContext(fs.readFileSync(require.resolve("../pdf-preview.js"), "utf8"), {
    window, document, structuredClone, LectureDocument: { snapshot: structuredClone }, PdfSlides: { parse }, SlideVisual: { render: slide => slide.title }
  });
  return { preview: window.PdfPreview, nodes };
}

test("upload preview reuses parsing and returns an independent copy for import", async () => {
  let parses = 0;
  const { preview, nodes } = setup(async () => { parses++; return [{ title: "First" }]; });
  const file = {};
  await preview.prepare(file);
  const imported = await preview.getSlides(file, "2. Hafta", "QA");
  imported[0].title = "Changed";
  assert.equal(parses, 1);
  assert.equal(nodes.get("import-preview-stage").innerHTML, "First");
  assert.equal((await preview.getSlides(file, "2. Hafta", "QA"))[0].title, "First");
});

test("a late parsing result cannot overwrite a newer upload or cleared preview", async () => {
  const pending = [];
  const { preview, nodes } = setup(() => new Promise(resolve => pending.push(resolve)));
  const first = preview.prepare({});
  const second = preview.prepare({});
  pending[1]([{ title: "Second" }]);
  await second;
  pending[0]([{ title: "First" }]);
  await first;
  assert.equal(nodes.get("import-preview-stage").innerHTML, "Second");
  const third = preview.prepare({});
  preview.clear();
  pending[2]([{ title: "Third" }]);
  await third;
  assert.equal(nodes.get("import-preview-stage").innerHTML, "");
});

test("invalid uploads display an error without saving any lecture", async () => {
  const { preview, nodes } = setup(async () => { throw new Error("Invalid PDF"); });
  await preview.prepare({});
  assert.match(nodes.get("import-preview-status").textContent, /Invalid PDF/);
  assert.equal(nodes.get("btn-import-preview-next").disabled, true);
});
