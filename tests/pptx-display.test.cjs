const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function renderer(binding) {
  const context = { window: { PptxDisplay: { visualFor: () => binding } } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../slide-visual.js"), "utf8"), context);
  return context.window.SlideVisual;
}

test("uploaded PPTX uses its native aspect ratio and an isolated rendering target without changing notes", () => {
  const render = renderer({ token: "synthetic-target", ratio: "960/720" });
  const slide = { title: '<My title>', html: '<p data-note="keep">Private notes</p>', sourceSlideEdited: true };
  const before = structuredClone(slide);
  const html = render.render(slide, 0, 1, "Test");
  assert.match(html, /aspect-ratio:960\/720/);
  assert.match(html, /data-pptx-render="synthetic-target"/);
  assert.match(html, /aria-label="&lt;My title&gt;"/);
  assert.doesNotMatch(html, /Private notes|font-family="Arial/);
  assert.deepEqual(slide, before);
});

test("explicit user slide images keep priority over automatic PPTX display", () => {
  const html = renderer({ token: "automatic", ratio: "4/3" }).render({ title: "Custom image", pptImageUrl: "custom.png", sourceSlideRatio: "3/4" }, 0, 1, "Test");
  assert.match(html, /src="custom.png"/);
  assert.match(html, /aspect-ratio:3\/4/);
  assert.doesNotMatch(html, /data-pptx-render/);
});
