/** Isolated browser measurements and preservation checks. Never uses a live origin. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const baseline = process.env.LECTURE_BASELINE_APP;
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function serve(request, response) {
  const url = new URL(request.url, "http://localhost");
  const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  try {
    const target = url.searchParams.has("baseline") && relative === "app.js" ? baseline : file;
    let bytes = await fs.readFile(target);
    if (relative === "index.html" && url.searchParams.has("baseline")) {
      bytes = bytes.toString().replace(/app\.js\?v=\d+/, "app.js?baseline=1");
    }
    const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" };
    response.setHeader("Content-Type", `${types[path.extname(file)] || "application/octet-stream"}; charset=utf-8`);
    response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
}

async function newPage(browser, origin, before = false) {
  const page = await browser.newPage();
  await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.addInitScript(() => {
    window.MEE101_GITHUB_ENABLED = false;
    sessionStorage.setItem("me101_instructor_unlocked", "true");
  });
  await page.goto(origin + (before ? "/?baseline=1" : "/"));
  await page.waitForFunction(() => document.getElementById("cloud-status-text").textContent.includes("GitHub"));
  return page;
}

async function benchmark(browser, origin, before) {
  const page = await newPage(browser, origin, before);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const samples = [];
  for (let run = 0; run < 5; run += 1) {
    samples.push(await page.evaluate(async () => {
      const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="white"/><!--' + "x".repeat(150000) + '--></svg>');
      const slides = Array.from({ length: 120 }, (_, index) => ({
        kicker: "QA", title: `QA ${index}`, html: `<p data-note='keep'>QA</p><img src="${image}">`,
        sourceSlideVisual: image, extractedImages: [image], pptSummaryBullets: ["QA"], defaultViewMode: "ppt"
      }));
      LECTURES.splice(0, LECTURES.length, { id: "qa-perf", week: "QA", title: "QA", description: "QA", slides });
      const started = performance.now();
      openLecture("qa-perf");
      const lectureMs = performance.now() - started;
      const editorStart = performance.now();
      openEditLectureModal("qa-perf");
      const editorMs = performance.now() - editorStart;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const firstCard = document.querySelector(".edit-thumb-card");
      const switchStart = performance.now();
      document.querySelectorAll(".edit-thumb-card")[1].click();
      const switchMs = performance.now() - switchStart;
      const retainedCards = firstCard === document.querySelector(".edit-thumb-card");
      const renderedWeb = document.querySelectorAll(".slide-body-web:not(:empty)").length;
      const thumbnails = document.querySelectorAll(".edit-thumb-preview:not(:empty)").length;
      const lastPreview = document.querySelectorAll(".edit-thumb-preview")[119];
      lastPreview.scrollIntoView({ block: "center" });
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!lastPreview.querySelector("img")) throw new Error("Last thumbnail did not render after scrolling");
      closeEditLectureModal();
      goHome();
      return { lectureMs, editorMs, switchMs, retainedCards, renderedWeb, thumbnails };
    }));
  }
  assert.deepEqual(errors, []);
  await page.close();
  const result = { label: before ? "before" : "after" };
  for (const key of ["lectureMs", "editorMs", "switchMs"]) result[key] = +median(samples.map(sample => sample[key])).toFixed(1);
  return { ...result, ...Object.fromEntries(["retainedCards", "renderedWeb", "thumbnails"].map(key => [key, samples.at(-1)[key]])) };
}

async function preserve(browser, origin) {
  const page = await newPage(browser, origin);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const check = (value, message) => { if (!value) throw new Error(message); };
    const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="red"/></svg>');
    const slide = { title: "QA", kicker: "QA", defaultViewMode: "ppt", pptSummaryBullets: ["note"],
      html: "<p class='lead' data-custom='untouched'>Keep my notes</p>", extractedImages: [image], sourceSlideVisual: image, custom: { keep: true } };
    const lecture = { id: "qa-preserve", title: "QA", week: "1. Hafta", description: "QA", pptxUrl: "data:application/octet-stream;base64,QUJD", pptxFileName: "QA.pptx", slides: [slide, structuredClone(slide)] };
    LECTURES.splice(0, LECTURES.length, lecture);
    const original = JSON.stringify(LECTURES);
    localStorage.setItem("qa-personal-settings", "retained");
    localStorage.setItem(STUDENT_ROSTER_KEY, "[]");
    localStorage.setItem(RATING_STORAGE_KEY, "{}");
    check(await saveAllLecturesToStorage(), "Initial save failed");
    openLecture(lecture.id);
    check(!document.querySelector(".slide-body-web").innerHTML, "Inactive web view rendered early");
    applyPersistentSlideViewMode("web");
    check(document.querySelector(".slide-body-web").textContent === "Keep my notes", "Web view lost notes");
    applyPersistentSlideViewMode("ppt");
    check(document.querySelector(".slide-body-ppt img").getAttribute("src") === image, "PPT view lost image");
    enterPresentationMode();
    nextStepOrSlide();
    check(document.querySelector(".slide.active-slide").dataset.index === "1", "Presentation cannot reach final slide");
    applyPersistentSlideViewMode("web");
    check(document.querySelector(".slide.active-slide .slide-body-web").textContent === "Keep my notes", "Presentation view switch lost notes");
    exitPresentationMode();
    openEditLectureModal(lecture.id);
    document.getElementById("edit-slide-title").value = "Cancelled";
    closeEditLectureModal();
    check(JSON.stringify(LECTURES) === original, "Cancel modified lecture");
    openEditLectureModal(lecture.id);
    document.querySelectorAll(".edit-thumb-card")[1].click();
    document.querySelectorAll(".edit-thumb-card")[0].click();
    document.getElementById("btn-save-edit-lecture").click();
    while (editingLectureDraft) await new Promise(resolve => setTimeout(resolve, 20));
    check(JSON.stringify(LECTURES) === original, "Untouched save changed original fields or HTML");
    check(JSON.stringify(await LectureStorage.load()) === original, "Storage changed original");
    openEditLectureModal(lecture.id);
    document.getElementById("edit-slide-title").value = "Edited QA";
    document.querySelectorAll(".edit-thumb-card")[1].click();
    document.getElementById("btn-save-edit-lecture").click();
    while (editingLectureDraft) await new Promise(resolve => setTimeout(resolve, 20));
    check(LECTURES[0].slides[0].title === "Edited QA", "Edited title lost");
    check(LECTURES[0].slides[0].sourceSlideVisual === image, "Edited slide lost source image");
    check(JSON.stringify(LECTURES[0].slides[1]) === JSON.stringify(slide), "Other slide changed");
    const expected = JSON.stringify(LECTURES);
    sessionStorage.setItem("qa-expected", expected);
    const gear = getSimulationSlideObject("gear", "QA");
    LECTURES.push({ id: "qa-simulation", title: "QA", week: "QA", description: "QA", slides: [gear] });
    openLecture("qa-simulation");
    check(animationFrameId !== null, "Simulation animation did not start");
    applyPersistentSlideViewMode("ppt");
    check(!isSimulationVisible(document.getElementById("gear-canvas")), "Hidden simulation still draws");
    goHome();
    check(animationFrameId === null && tensileAutoTimer === null, "Simulation work persists on catalog");
    return { openingCancelSaveAndStoragePreserved: true, viewSwitchPreserved: true, editedTitlePreserved: true, simulationStopped: true };
  });
  await page.reload();
  await page.waitForFunction(() => typeof LECTURES !== "undefined" && LECTURES.some(lecture => lecture.id === "qa-preserve"));
  assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem("qa-expected")), true, "Page reload lost saved data");
  assert.equal(await page.evaluate(() => localStorage.getItem("qa-personal-settings")), "retained");
  assert.equal(await page.evaluate(() => localStorage.getItem(STUDENT_ROSTER_KEY)), "[]");
  assert.equal(await page.evaluate(() => localStorage.getItem(RATING_STORAGE_KEY)), "{}");
  assert.deepEqual(errors, []);
  await page.close();
  return { ...result, pageReloadPreserved: true };
}

(async () => {
  const server = http.createServer((request, response) => { void serve(request, response); });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const origin = `http://127.0.0.1:${server.address().port}`;
    if (baseline) console.info(JSON.stringify(await benchmark(browser, origin, true)));
    console.info(JSON.stringify(await benchmark(browser, origin, false)));
    console.info(JSON.stringify(await preserve(browser, origin)));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
