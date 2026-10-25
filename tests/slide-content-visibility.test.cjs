const { test } = require("node:test");
const assert = require("node:assert/strict");
const { contentVisibility } = require("../slide-visual.js");

test("complete HTML remains visible in both modes regardless of a stale PPT summary", () => {
  const slide = { title: "Title", html: "<p>Added explanation</p>", pptSummaryBullets: [] };
  const before = structuredClone(slide);
  assert.deepEqual(contentVisibility(slide, "ppt"), { web: true, ppt: false });
  assert.deepEqual(contentVisibility(slide, "web"), { web: true, ppt: false });
  assert.deepEqual(slide, before);
});

test("original images and complete notes coexist without rewriting either", () => {
  for (const source of [{ pptImageUrl: "image.png" }, { sourceSlideVisual: "original.svg" }, { extractedImages: ["recovered.png"] }]) {
    const slide = { ...source, html: "<p>Notes</p>" };
    assert.deepEqual(contentVisibility(slide, "ppt"), { web: true, ppt: true });
    assert.deepEqual(contentVisibility(slide, "web"), { web: true, ppt: false });
  }
  assert.deepEqual(contentVisibility({ html: "", pptSummaryBullets: ["Summary"] }, "ppt"), { web: false, ppt: true });
});

test("image mode shows only the whole slide and keeps duplicate extracted content for Web", () => {
  for (const source of [{ pptImageUrl: "slide.png" }, { sourceSlideVisual: "whole-slide.svg" }]) {
    const slide = { ...source, html: '<p>Saved notes</p><img src="embedded.png"/>', extractedImages: ["embedded.png"] };
    const before = structuredClone(slide);
    assert.deepEqual(contentVisibility(slide, "image"), { web: false, ppt: true });
    assert.deepEqual(contentVisibility(slide, "web"), { web: true, ppt: false });
    assert.deepEqual(slide, before);
  }
});

test("image mode preserves HTML-only interactive slides and never adds a recovered-image collage beside HTML", () => {
  for (const source of [{}, { extractedImages: ["embedded.png"] }]) {
    assert.deepEqual(contentVisibility({ ...source, html: '<button>Simulation</button>' }, "image"), { web: true, ppt: false });
  }
});
