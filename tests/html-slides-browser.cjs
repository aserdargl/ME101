/** Uses synthetic data on a separate origin; never writes to the published site. */
const assert = require("node:assert/strict");
const { fork } = require("node:child_process");
const path = require("node:path");
require("node:fs").mkdirSync(path.join(__dirname, "../.jtmp"), { recursive: true });
const { chromium } = require("playwright");
const { pdfFixture } = require("./pdf-fixture.cjs");
const origin = "http://127.0.0.1:4212";
const source = `<!doctype html><meta charset="utf-8"><style>body{background:rgb(220,240,230);font:20px system-ui}button{padding:12px}
@keyframes spin{to{transform:rotate(360deg)}}#animated{width:30px;height:30px;background:red;animation:spin 1s linear infinite}</style>
<div id="animated"></div><canvas id="canvas" width="20" height="20"></canvas><output id="ticks">0</output>
<button id="run">Calculate</button><output id="result">Ready</output><p id="isolation"></p>
<script>document.getElementById('run').onclick=()=>document.getElementById('result').textContent=6*7;
try { parent.localStorage.setItem('qa-isolation','changed'); document.getElementById('isolation').textContent='FAILED'; }
catch { document.getElementById('isolation').textContent='Isolated'; }
const ctx=document.getElementById('canvas').getContext('2d');ctx.fillStyle='blue';ctx.fillRect(0,0,20,20);
let ticks=0;function animate(){document.getElementById('ticks').textContent=++ticks;requestAnimationFrame(animate)}animate();</script>`;

async function selectHtmlFile(page, position, name = "Animation.html", content = source) {
  await page.locator(`.btn-slide-insert-toggle[aria-controls="slide-insert-menu-${position}"]`).click();
  const picker = page.waitForEvent("filechooser");
  await page.locator(`.btn-insert-here[data-ins-type="html-file"][data-ins-pos="${position}"]`).click();
  await (await picker).setFiles({ name, mimeType: "text/html", buffer: Buffer.from(content) });
  await page.waitForFunction(() => !document.getElementById("btn-save-edit-lecture").disabled);
}

async function verifyAnimations(frame) {
  await frame.locator("#ticks").evaluate(element => new Promise(resolve => {
    const before = Number(element.textContent);
    const check = () => Number(element.textContent) > before + 2 ? resolve() : requestAnimationFrame(check);
    check();
  }));
  assert.equal(await frame.locator("#canvas").evaluate(canvas => canvas.getContext("2d").getImageData(0, 0, 1, 1).data[2]), 255);
  assert.equal(await frame.locator("#animated").evaluate(element => element.getAnimations()[0].playState), "running");
}

(async () => {
  const server = fork(path.join(__dirname, "preview-server.cjs"), { env: { ...process.env, MEE101_QA_PORT: "4212" }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once("data", resolve); server.once("error", reject); });
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => new URL(route.request().url()).origin === origin || route.request().url().startsWith("data:") ? route.continue() : route.abort());
    await page.goto(origin);
    await page.waitForFunction(() => typeof insertHtmlSlideAt === "function");
    await page.evaluate(async bytes => {
      isAdminAuthenticated = true;
      const file = new File([new Uint8Array(bytes)], "Synthetic.pdf", { type: "application/pdf" });
      const slides = await PdfSlides.parse(file, "QA", "Mixed");
      LECTURES.splice(0, LECTURES.length, { id: "qa-mixed", title: "Mixed", week: "QA", pdfUrl: slides[0].pdf.source, slides },
        { id: "qa-legacy", custom: { preserve: true }, title: "Legacy", week: "QA", slides: [{ html: "<p>Original notes</p>" }] });
      localStorage.setItem("qa-isolation", "preserved");
      window.qaBefore = JSON.stringify(LECTURES);
      sessionStorage.setItem("qa-before", qaBefore);
      await saveAllLecturesToStorage();
      openEditLectureModal("qa-mixed");
    }, [...pdfFixture()]);
    await selectHtmlFile(page, 1, "empty.html", "");
    assert.equal(await page.evaluate(() => editingLectureDraft.slides.length), 2);
    assert.match(await page.locator("#edit-html-import-status").textContent(), /empty|boş/);
    await selectHtmlFile(page, 1);
    assert.equal(await page.locator("#edit-html-document").inputValue(), source);
    assert.equal(await page.locator("#edit-slide-title").inputValue(), "Animation");
    const preview = page.frameLocator("#edit-live-preview-stage iframe");
    await preview.locator("#isolation").filter({ hasText: "Isolated" }).waitFor();
    await page.screenshot({path:".jtmp/html-editor.png"});
    await preview.locator("#run").click();
    await preview.locator("#result").filter({hasText:"42"}).waitFor();
    assert.equal(await preview.locator("body").evaluate(body => getComputedStyle(body).backgroundColor), "rgb(220, 240, 230)");
    await verifyAnimations(preview);
    assert.equal(await page.locator(".edit-thumb-preview iframe").count(), 0);
    await page.locator("#btn-cancel-edit-lecture").click();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem("qa-before")), true);
    await page.reload();
    await page.waitForFunction(() => typeof LECTURES !== "undefined" && LECTURES[0]?.id === "qa-mixed");
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem("qa-before")), true);
    await page.evaluate(() => { isAdminAuthenticated = true; });
    await page.evaluate(() => openEditLectureModal("qa-mixed"));
    await selectHtmlFile(page, 0, "Beginning.HTM");
    await selectHtmlFile(page, 3, "End.html");
    assert.deepEqual(await page.evaluate(() => editingLectureDraft.slides.map(slide => slide.pdf?.page || slide.title)), ["Beginning", 1, 2, "End"]);
    await page.locator("#btn-cancel-edit-lecture").click();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem("qa-before")), true);
    await page.evaluate(() => openEditLectureModal("qa-mixed"));
    await selectHtmlFile(page, 0, "Cancelled.html", "");
    await page.evaluate(() => {
      pendingHtmlInsert = { draft: editingLectureDraft, position: 0 };
      document.getElementById("inp-edit-html-file").dispatchEvent(new Event("cancel"));
    });
    assert.equal(await page.evaluate(() => pendingHtmlInsert), null);
    await selectHtmlFile(page, 1);
    await page.locator("#edit-slide-title").fill("Interactive page");
    await page.locator("#btn-save-edit-lecture").click();
    await page.waitForFunction(() => editingLectureDraft === null);
    assert.deepEqual(await page.evaluate(() => LECTURES[0].slides.map(s => s.pdf?.page || "HTML")), [1, "HTML", 2]);
    await page.evaluate(() => { sessionStorage.setItem("qa-saved", JSON.stringify(LECTURES)); });
    await page.reload();
    await page.waitForFunction(() => LECTURES[0]?.slides.length === 3);
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem("qa-saved")), true);
    await page.evaluate(() => { isAdminAuthenticated = true; openEditLectureModal("qa-mixed", 1); });
    assert.equal(await page.locator("#edit-html-document").inputValue(), source);
    await page.locator("#btn-save-edit-lecture").click();
    await page.waitForFunction(() => editingLectureDraft === null);
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem("qa-saved")), true);
    await page.evaluate(() => openLecture("qa-mixed", true));
    await page.waitForFunction(() => document.querySelector(".active-slide [data-pdf-ready='true']"));
    await page.locator("#btn-next-slide").click();
    const active = page.frameLocator(".active-slide iframe");
    await active.locator("#run").click();
    await active.locator("#result").filter({hasText:"42"}).waitFor();
    assert.equal(await active.locator("#isolation").textContent(), "Isolated");
    await verifyAnimations(active);
    assert.equal(await page.evaluate(() => localStorage.getItem("qa-isolation")), "preserved");
    await page.evaluate(() => applyPersistentSlideViewMode("web"));
    assert.equal(await active.locator("#result").textContent(), "42");
    await page.screenshot({ path: path.join(__dirname, "../.jtmp/html-slide-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const frameBox = await page.locator(".active-slide iframe").boundingBox();
    const toolbar = await page.locator("#presentation-toolbar").boundingBox();
    assert.ok(frameBox.x >= -1 && frameBox.x + frameBox.width <= 391 && frameBox.y + frameBox.height <= toolbar.y + 1);
    await page.locator("#btn-next-slide").click();
    await page.waitForFunction(() => document.querySelector(".active-slide [data-pdf-page='2'][data-pdf-ready='true']"));
    assert.equal(await page.evaluate(() => currentSlideIndex), 2);
    assert.deepEqual(errors, []);
    console.info("Passed: file picker and exact insertion, empty-file recovery, CSS/JS animations, canvas, preview, isolated execution, cancel/save/reload, unchanged legacy notes, PDF navigation, view switching and mobile.");
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
