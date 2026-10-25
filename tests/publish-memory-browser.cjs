/* Uses only a random localhost origin, synthetic notes and an in-memory publisher. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");

async function serve(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/firebase-config.js") {
    response.setHeader("Content-Type", "text/javascript");
    return response.end("window.MEE101_FIREBASE_CONFIG=null;window.MEE101_DRIVE_ENABLED=false;");
  }
  const filename = path.resolve(root, pathname === "/" ? "index.html" : `.${pathname}`);
  if (!filename.startsWith(root + path.sep)) { response.writeHead(403); return response.end(); }
  try {
    const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" };
    response.setHeader("Content-Type", types[path.extname(filename)] || "application/octet-stream");
    response.end(await fs.readFile(filename));
  } catch { response.writeHead(404); response.end(); }
}

async function main() {
  const server = http.createServer((request, response) => { void serve(request, response); });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage();
    const origin = `http://127.0.0.1:${server.address().port}`;
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("crash", () => errors.push("Browser tab crashed"));
    await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(() => {
      window.MEE101_GITHUB_ENABLED = false;
      class Publisher {
        async login() {}
        async readCurrent() { return { manifest: null, lectures: null }; }
        async publish(lectures) {
          if (window.qaFailPublish) throw new Error("Synthetic network interruption");
          window.qaPublishedNote = lectures[0].slides[0].html;
          return { id: "synthetic", digest: "synthetic" };
        }
      }
      Object.defineProperty(window, "InstructorLectureRepository", { get: () => Publisher, set() {} });
    });
    await page.goto(origin);
    await page.waitForFunction(() => document.getElementById("cloud-status-text").textContent.includes("GitHub"));
    const result = await page.evaluate(async () => {
      const check = (value, message) => { if (!value) throw new Error(message); };
      const keys = async () => {
        const db = await new Promise(resolve => {
          const request = indexedDB.open("mee101-notes-v1", 1);
          request.onsuccess = () => resolve(request.result);
        });
        try {
          return await new Promise(resolve => {
            const request = db.transaction("lecture-snapshots").objectStore("lecture-snapshots").getAllKeys();
            request.onsuccess = () => resolve(request.result);
          });
        } finally { db.close(); }
      };
      const html = '<p class="lead" data-user-note="keep">Özgün açıklamam 😀</p>';
      LECTURES.splice(0, LECTURES.length, { id: "qa-memory", week: "1. Hafta", title: "Özgün ders", description: "QA",
        custom: { keep: true, asset: "data:application/octet-stream;base64," + "A".repeat(16 * 1024 * 1024) },
        slides: [{ title: "Özgün slayt", kicker: "QA", html }] });
      localStorage.setItem("qa-settings", "retained");
      localStorage.setItem(STUDENT_ROSTER_KEY, "[]");
      localStorage.setItem(RATING_STORAGE_KEY, "{}");
      check(await LectureStorage.save(LECTURES), "Initial recovery save failed");
      const before = (await keys()).length;
      await LecturePublishing.login();
      isAdminAuthenticated = true;
      let saves = 0;
      const save = LectureStorage.save;
      LectureStorage.save = (...args) => { saves += 1; return save(...args); };
      const clone = window.structuredClone;
      window.structuredClone = value => {
        if (Array.isArray(value) && value[0]?.id === "qa-memory") throw new Error("Full media document was cloned");
        return clone(value);
      };
      for (let index = 0; index < 3; index += 1) {
        await LecturePublishing.publish();
        check(!document.getElementById("cloud-status").classList.contains("cloud-error"), "Publish failed");
        check(window.qaPublishedNote === html, "Publish changed original notes");
      }
      check(saves === 3, "Publish saved the identical full document twice");
      check((await keys()).length === before, "Repeated publish accumulated recovery copies");
      window.qaFailPublish = true;
      await LecturePublishing.publish();
      check(document.getElementById("cloud-status").classList.contains("cloud-error"), "Failure was hidden");
      check((await LectureStorage.load())[0].slides[0].html === html, "Failed publish lost notes");
      window.structuredClone = clone;
      openEditLectureModal("qa-memory");
      document.getElementById("edit-slide-title").value = "Cancelled title";
      closeEditLectureModal();
      check(LECTURES[0].slides[0].title === "Özgün slayt", "Cancel changed saved slide");
      openEditLectureModal("qa-memory");
      document.getElementById("btn-save-edit-lecture").click();
      while (editingLectureDraft) await new Promise(resolve => setTimeout(resolve, 20));
      check(LECTURES[0].slides[0].html === html, "Untouched editor save changed notes");
      check((await keys()).length === before, "Untouched editor save added a recovery copy");
      return { syntheticMediaMiB: 16, repeatedPublishes: 3, savesPerPublish: 1, recoveryRecordsBefore: before,
        recoveryRecordsAfter: (await keys()).length, failedPublishPreserved: true, editorCancelSavePreserved: true };
    });
    await page.reload();
    await page.waitForFunction(() => typeof LECTURES !== "undefined" && LECTURES.some(lecture => lecture.id === "qa-memory"));
    const reloaded = await page.evaluate(() => ({
      note: LECTURES[0].slides[0].html.includes("Özgün açıklamam 😀"),
      media: LECTURES[0].custom.asset.length > 16 * 1024 * 1024,
      settings: localStorage.getItem("qa-settings") === "retained",
      students: localStorage.getItem(STUDENT_ROSTER_KEY) === "[]", ratings: localStorage.getItem(RATING_STORAGE_KEY) === "{}"
    }));
    assert.ok(Object.values(reloaded).every(Boolean), JSON.stringify(reloaded));
    assert.deepEqual(errors, []);
    console.info(JSON.stringify({ ...result, reloadAndSettingsPreserved: true, browserErrors: errors.length }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
