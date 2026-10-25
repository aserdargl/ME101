const { test } = require("node:test");
const assert = require("node:assert/strict");
const HtmlSlides = require("../html-slides.js");

test("HTML source and title remain inside an isolated frame, including quotes and script tags", () => {
  const slide = { title: 'Example" onload="unsafe()', htmlDocument: '<script>document.body.textContent="42"</script><p title="value">&</p>' };
  const before = structuredClone(slide);
  const html = HtmlSlides.render(slide);
  assert.match(html, /sandbox="allow-scripts"/);
  assert.doesNotMatch(html, /allow-same-origin|allow-top-navigation|allow-popups/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /title="Example&quot; onload=&quot;unsafe\(\)"/);
  assert.deepEqual(slide, before);
});

test("HTML thumbnails never execute source code and empty HTML remains an HTML slide", () => {
  const slide = { title: "Empty", htmlDocument: "" };
  assert.equal(HtmlSlides.isHtmlSlide(slide), true);
  assert.equal(HtmlSlides.isHtmlSlide({ html: "<p>Ordinary note</p>" }), false);
  assert.doesNotMatch(HtmlSlides.thumbnail(slide), /iframe|script|srcdoc/);
});

test("new HTML slides contain an editable, working JavaScript starter without changing existing notes", () => {
  const first = HtmlSlides.create("QA");
  const second = HtmlSlides.create("QA");
  first.title = "Changed";
  assert.equal(second.title, "HTML Sayfası");
  assert.match(second.htmlDocument, /addEventListener\("click"/);
  assert.equal(second.html, "");
});
