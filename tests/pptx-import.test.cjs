const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DOMParser } = require("@xmldom/xmldom");
const JSZip = require("jszip");
const { fixture } = require("./pptx-fixture.cjs");
const importer = require("../pptx-import.js");
const visual = require("../slide-visual.js");
const parse = async buffer => importer.parse(buffer, "5. Hafta", "Deney", { JSZip, parser: new DOMParser() });

test("real relationship paths, presentation order, alternate XML prefixes and all images survive", async () => {
  const slides = await parse(await fixture());
  assert.deepEqual(slides.map(slide => slide.sourceSlidePath), ["ppt/slides/slide7.xml", "ppt/slides/slide2.xml"]);
  assert.equal(slides[0].title, "Özgün Görseller");
  assert.equal(slides[0].extractedImages.length, 2);
  assert.notEqual(slides[0].extractedImages[1], slides[1].extractedImages[0], "same filenames in different package folders must stay distinct");
  assert.equal((slides[0].html.match(/<img /g) || []).length, 2);
  assert.equal(slides[0].sourceSlideRatio, "9144000/6858000");
  const svg = decodeURIComponent(slides[0].sourceSlideVisual.split(",")[1]);
  assert.match(svg, /<image /);
  assert.match(svg, /viewBox="0 0 1280 960"/);
  const rendered = new DOMParser().parseFromString(svg, "image/svg+xml");
  assert.ok(Number(rendered.getElementsByTagName("text")[0].getAttribute("font-size")) > 30);
  assert.ok(Number(rendered.getElementsByTagName("image")[0].getAttribute("width")) > 400);
  assert.doesNotMatch(svg, /Teknik Şema/);
  assert.doesNotMatch(JSON.stringify(slides), /blob:/);
  const restored = JSON.parse(JSON.stringify(slides));
  assert.equal(restored[0].extractedImages[1], slides[0].extractedImages[1]);
});

test("repair restores images without dropping notes, slides, titles or custom fields", async () => {
  const imported = await parse(await fixture());
  const existing = [{ id: "user", title: imported[0].title, html: '<p data-note="user">Benim özel notum</p>', customData: { important: true } }, { title: "Elle eklenmiş slayt", html: "Aynı kalmalı" }];
  const result = importer.repairMedia(existing, imported);
  assert.equal(result.repaired, 1);
  assert.equal(result.unmatched.length, 1);
  assert.match(existing[0].html, /Benim özel notum/);
  assert.equal(existing[0].customData.important, true);
  assert.equal(existing.length, 2);
  assert.equal(existing[1].html, "Aynı kalmalı");
});

test("fallback visuals keep every bullet and every image without artificial technical drawings", () => {
  const longText = "Tam metin korunmalı. ".repeat(30);
  const html = visual.render({ title: "Başlık", pptSummaryBullets: Array(12).fill(longText), extractedImages: ["data:image/png;base64,AA", "data:image/png;base64,BB"] }, 0, 1, "Hafta");
  assert.equal((html.match(/<li>/g) || []).length, 12);
  assert.equal((html.match(/<img /g) || []).length, 2);
  assert.ok(html.includes(longText));
  assert.doesNotMatch(html, /Teknik Şema/);
});
