/** Headless checks on a disposable origin, blocking every external service. */
const assert = require("node:assert/strict");
const { fork } = require("node:child_process");
const path = require("node:path");
const { chromium } = require("playwright");
const { pdfFixture } = require("./pdf-fixture.cjs");
const origin = "http://127.0.0.1:4211";
const upload = (pages = 2, name = "Synthetic.pdf") => ({ name, mimeType: "application/pdf", buffer: pdfFixture(pages) });

async function run() {
  const server = fork(path.join(__dirname, "preview-server.cjs"), { env: { ...process.env, MEE101_QA_PORT: "4211" }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once("data", resolve); server.once("error", reject); });
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on("pageerror", error => { errors.push(error.message); console.error("PAGE ERROR", error.message); });
    await page.route("**/*", route => new URL(route.request().url()).origin === origin || route.request().url().startsWith("data:") ? route.continue() : route.abort());
    await page.goto(origin);
    await page.waitForFunction(() => typeof openEditLectureModal === "function");
    await page.evaluate(async () => {
      isAdminAuthenticated = true;
      LECTURES.splice(0, LECTURES.length, { id: "qa-keep", title: "Preserve", week: "QA", custom: { keep: true },
        slides: [{ title: "Saved notes", html: '<p data-keep="yes">Unchanged notes</p>', pptImageUrl: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>') }] });
      window.originalLecture = JSON.stringify(LECTURES[0]);
      localStorage.setItem("qa-ratings", "preserved");
      await saveAllLecturesToStorage();
      openPptxModal("tab-add-manual");
    });
    const legacy = await page.evaluate(() => originalLecture);
    await page.locator("#inp-pdf-file").setInputFiles(upload());
    await page.waitForFunction(() => document.querySelector("#import-preview-stage [data-pdf-ready='true']"), null, { timeout: 15000 }).catch(async error => { console.error(await page.locator("#import-preview-status").textContent()); console.error(await page.locator("#import-preview-stage").evaluate(el => ({html:el.innerHTML, rect:el.getBoundingClientRect().toJSON(),parent:el.closest(".modal-backdrop").className}))); await page.screenshot({path:".jtmp/failure.png",fullPage:true}); throw error; });
    assert.match(await page.locator("#import-preview-status").textContent(), /1 \/ 2/);
    await page.locator("#btn-import-preview-next").click();
    await page.waitForFunction(() => document.querySelector("#import-preview-stage [data-pdf-page='2'][data-pdf-ready='true']"));
    await page.locator("#btn-process-pdf").click();
    await page.waitForFunction(() => currentLecture?.pdfUrl && document.querySelector(".slide [data-pdf-ready='true']"));
    assert.equal(await page.locator(".slide").count(), 2);
    assert.equal(await page.locator(".slide").first().locator("h2").isVisible(), false);
    const pixels = await page.locator(".slide canvas").first().evaluate(canvas => {
      const context = canvas.getContext("2d");
      return { blue: [...context.getImageData(Math.floor(canvas.width * .5), Math.floor(canvas.height * .6), 1, 1).data],
        white: [...context.getImageData(Math.floor(canvas.width * .5), Math.floor(canvas.height * .25), 1, 1).data] };
    });
    assert.ok(pixels.blue[2] > pixels.blue[0] + 70);
    assert.ok(pixels.white.slice(0, 3).every(channel => channel > 245));
    await page.screenshot({ path: path.join(__dirname, "../.jtmp/pdf-desktop.png"), fullPage: true });
    await page.evaluate(() => { window.pdfId = currentLecture.id; window.originalPdf = JSON.stringify(currentLecture); openEditLectureModal(pdfId); insertContentSlideAt(1); });
    await page.locator("#edit-slide-title").fill("Extra slide between PDF pages");
    await page.locator("#edit-slide-lead").fill("Additional explanation");
    await page.locator("#btn-cancel-edit-lecture").click();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES.find(l => l.id === pdfId)) === originalPdf), true);
    await page.evaluate(() => { openEditLectureModal(pdfId); insertContentSlideAt(1); });
    await page.locator("#edit-slide-title").fill("Extra slide between PDF pages");
    await page.locator("#edit-slide-lead").fill("Additional explanation");
    await page.locator("#btn-save-edit-lecture").click();
    await page.waitForFunction(() => editingLectureDraft === null);
    assert.deepEqual(await page.evaluate(() => currentLecture.slides.map(s => s.pdf?.page || s.title)), [1, "Extra slide between PDF pages", 2]);
    await page.evaluate(() => openEditLectureModal(pdfId, 1));
    const chooser = page.waitForEvent("filechooser");
    await page.locator('.btn-insert-here[data-ins-type="pdf"][data-ins-pos="1"]').click();
    await (await chooser).setFiles(upload(1, "Second.pdf"));
    await page.waitForFunction(() => editingLectureDraft.slides.length === 4 && !document.getElementById("btn-save-edit-lecture").disabled);
    await page.locator("#btn-save-edit-lecture").click();
    await page.waitForFunction(() => editingLectureDraft === null);
    assert.deepEqual(await page.evaluate(() => currentLecture.slides.map(s => s.pdf?.fileName || s.title)), ["Synthetic.pdf", "Second.pdf", "Extra slide between PDF pages", "Synthetic.pdf"]);
    await page.evaluate(() => { openEditLectureModal(pdfId, 1); document.getElementById("btn-move-slide-down").click(); });
    await page.locator("#btn-save-edit-lecture").click();
    await page.waitForFunction(() => editingLectureDraft === null);
    await page.evaluate(() => { sessionStorage.setItem("qa-id", pdfId); sessionStorage.setItem("qa-document", JSON.stringify(LECTURES)); });
    await page.reload();
    await page.waitForFunction(() => LECTURES.some(l => l.id === sessionStorage.getItem("qa-id")));
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem("qa-document")), true);
    assert.equal(await page.evaluate(() => localStorage.getItem("qa-ratings")), "preserved");
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES.find(l => l.id === "qa-keep"))), legacy);
    await page.evaluate(() => { isAdminAuthenticated = true; openLecture(sessionStorage.getItem("qa-id"), true); });
    await page.waitForFunction(() => document.querySelector(".active-slide [data-pdf-ready='true']"));
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => currentSlideIndex), 1);
    assert.match(await page.locator(".active-slide .slide-body-web").textContent(), /Additional explanation/);
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector(".active-slide [data-pdf-ready='true']"));
    assert.equal(await page.locator(".active-slide [data-pdf-page]").getAttribute("data-pdf-page"), "1");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const box = await page.locator(".active-slide .pdf-page").boundingBox();
    const toolbar = await page.locator("#presentation-toolbar").boundingBox();
    assert.ok(box.x >= -1 && box.x + box.width <= 391 && box.y + box.height <= toolbar.y + 1);
    await page.screenshot({ path: path.join(__dirname, "../.jtmp/pdf-mobile-presentation.png"), fullPage: true });
    await page.evaluate(() => { exitPresentationMode(); openEditLectureModal(currentLecture.id); });
    const saved = await page.evaluate(() => JSON.stringify(LECTURES));
    await page.locator("#inp-edit-pdf-file").setInputFiles({ name: "Broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("broken") });
    await page.waitForFunction(() => document.getElementById("edit-pdf-status").textContent.startsWith("Hata:"));
    await page.locator("#btn-cancel-edit-lecture").click();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES)), saved);
    assert.equal(await page.evaluate(() => document.querySelectorAll("[accept='.pptx'], #tab-method-2").length), 0);
    assert.deepEqual(errors, []);
    console.info("Passed: PDF preview/layout, extra slide insertion, second PDF insertion, reorder, cancel/save/reload, legacy data, presentation/mobile, invalid file isolation.");
  } finally { await browser?.close(); server.kill(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
