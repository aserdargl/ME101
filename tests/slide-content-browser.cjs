/* Uses only synthetic records on a separate localhost origin; blocks all remote traffic. */
const assert = require("node:assert/strict");
const { fork } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = "http://127.0.0.1:4197";
const root = path.resolve(__dirname, "..");

async function seed(page) {
  await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.addInitScript(() => { window.MEE101_GITHUB_ENABLED = false; });
  await page.goto(origin);
  await page.waitForFunction(() => typeof openLecture === "function");
  await page.evaluate(async () => {
    const html = '<p data-added-note="keep">Added explanation absent from summary</p>' +
      '<textarea id="qa-input">Retained input</textarea>' + '<p>Long explanation</p>'.repeat(65);
    const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><text x="20" y="60">Original PPTX title</text></svg>');
    LECTURES.splice(0, LECTURES.length, { id: "qa-content", week: "QA", title: "Synthetic", description: "QA", pptxUrl: "/fixture.pptx", slides: [
      { title: "Complete title", kicker: "QA", html, pptSummaryBullets: [], defaultViewMode: "ppt" },
      { title: "Original and added text", kicker: "QA", html: '<p data-added-note="keep">Supplementary notes</p>', pptImageUrl: image, defaultViewMode: "ppt" },
      { title: "Bullet title", kicker: "QA", html: '<ul class="bullet-list"><li class="fragment">Saved bullet</li></ul>', defaultViewMode: "ppt" },
      { title: "Native PPTX with added notes", kicker: "QA", html: '<p data-native-note="keep">Native supplementary notes</p>', sourceSlidePath: "ppt/slides/slide7.xml", sourceSlideEdited: true, defaultViewMode: "ppt" }
    ] });
    isAdminAuthenticated = true;
    await LectureStorage.save(LECTURES);
    window.qaOriginal = JSON.stringify(LECTURES);
    openLecture("qa-content");
  });
}

async function verify(page) {
  const first = page.locator('.slide').first();
  for (const mode of ["ppt", "web", "ppt"]) {
    await page.evaluate(mode => applyPersistentSlideViewMode(mode), mode);
    assert.equal(await first.locator('h2').isVisible(), true);
    assert.equal(await first.locator('[data-added-note]').isVisible(), true);
    assert.equal(await page.locator('.slide').nth(1).locator('[data-added-note]').isVisible(), true);
  }
  assert.equal(await page.locator('.slide').nth(1).locator('.ppt-source-frame img').isVisible(), true);
  const native = page.locator('.slide').nth(3);
  await native.scrollIntoViewIfNeeded();
  await native.locator('[data-rendered="true"][data-pptx-render]').waitFor();
  assert.equal(await native.locator('[data-native-note]').isVisible(), true);
  assert.equal(await native.locator('h2').isVisible(), true);
  await page.locator('#qa-input').fill("Kept while switching");
  await page.evaluate(() => { applyPersistentSlideViewMode("web"); applyPersistentSlideViewMode("ppt"); });
  assert.equal(await page.locator('#qa-input').inputValue(), "Kept while switching");
  await page.evaluate(() => enterPresentationMode());
  for (const mode of ["ppt", "web"]) {
    await page.evaluate(mode => applyPersistentSlideViewMode(mode), mode);
    await page.waitForTimeout(300);
    assert.equal(await first.locator('h2').evaluate(title => {
      const rect = title.getBoundingClientRect(), parent = title.closest('.slide').getBoundingClientRect();
      return rect.top >= parent.top && rect.bottom <= innerHeight;
    }), true, `title must remain in viewport in ${mode}`);
    assert.equal(await first.locator('[data-added-note]').isVisible(), true);
    await first.evaluate(slide => { slide.scrollTop = slide.scrollHeight; });
    assert.equal(await first.locator('.slide-body-web p').last().evaluate(last => last.getBoundingClientRect().bottom <= innerHeight), true);
    await first.evaluate(slide => { slide.scrollTop = 0; });
  }
  await page.evaluate(() => { applyPersistentSlideViewMode("ppt"); currentSlideIndex = 2; updateActiveSlide(); });
  assert.equal(await page.locator('.active-slide .fragment').evaluate(node => getComputedStyle(node).opacity), "1");
  await page.evaluate(() => exitPresentationMode());
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.evaluate(() => { applyPersistentSlideViewMode("web"); enterPresentationMode(); });
  assert.equal(await first.locator('h2').evaluate(title => title.getBoundingClientRect().top >= title.closest('.slide').getBoundingClientRect().top), true);
  await page.evaluate(() => { exitPresentationMode(); openEditLectureModal("qa-content", 0); });
  await page.locator('#edit-slide-title').fill("Cancelled title");
  await page.evaluate(() => closeEditLectureModal());
  assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === window.qaOriginal), true);
  await page.evaluate(() => openEditLectureModal("qa-content", 0));
  await page.locator('#btn-save-edit-lecture').click();
  await page.waitForFunction(() => !editingLectureDraft);
  assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === window.qaOriginal), true);
  assert.equal(await page.evaluate(async () => JSON.stringify(await LectureStorage.load()) === window.qaOriginal), true);
  const saved = await page.evaluate(() => window.qaOriginal);
  await page.reload();
  await page.waitForFunction(() => typeof openLecture === "function");
  assert.equal(await page.evaluate(async () => JSON.stringify(await LectureStorage.load())), saved);
  await page.evaluate(() => openLecture("qa-content"));
  assert.equal(await first.locator('h2').textContent(), "Complete title");
  assert.equal(await first.locator('[data-added-note]').isVisible(), true);
  fs.mkdirSync(path.join(root, '.jtmp'), { recursive: true });
  await page.screenshot({ path: path.join(root, '.jtmp/slide-content-mobile.png') });
  console.info("Passed: complete titles and notes in both modes, original image retained, long presentation scroll, mobile layout, editor cancel/save/reload and unchanged stored records.");
}

(async () => {
  const server = fork(path.join(__dirname, "preview-server.cjs"), { env: { ...process.env, MEE101_QA_PORT: "4197" }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once("data", resolve); server.once("error", reject); });
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await seed(page);
    await verify(page);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
