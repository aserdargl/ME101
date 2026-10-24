/* Runs entirely on a random localhost origin with an in-memory GitHub fixture. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { fakeGitHub } = require("./github-fixture.cjs");
const root = path.resolve(__dirname, "..");
const modules = ["lecture-document.js", "lecture-storage.js", "github-repository.js", "lecture-publishing.js"];
const html = '<div id="cloud-status"><span id="cloud-status-text"></span></div><button id="btn-cloud-publish"></button>'
  + modules.map(name => `<script src="/${name}"></script>`).join("");

async function main() {
  const github = fakeGitHub();
  const server = http.createServer((request, response) => {
    const name = request.url.slice(1);
    response.setHeader("Content-Type", modules.includes(name) ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8");
    response.end(modules.includes(name) ? fs.readFileSync(path.join(root, name)) : html);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.hostname === "api.github.com" || url.pathname.startsWith("/data/")) {
        const target = url.pathname.startsWith("/data/") ? `https://aserdargl.github.io/ME101${url.pathname}` : url.href;
        const response = await github.fetch(target, { method: request.method(), body: request.postData(), headers: request.headers() });
        return route.fulfill({ status: response.status, body: await response.text(), headers: { "Access-Control-Allow-Origin": origin, "Content-Type": "application/json" } });
      }
      return url.origin === origin || url.protocol === "blob:" ? route.continue() : route.abort();
    });
    await page.goto(origin);
    const first = await page.evaluate(async () => {
      const image = "data:image/png;base64," + "A".repeat(256 * 1024);
      const temporary = URL.createObjectURL(new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><text>$& Özgün</text></svg>'], { type: "image/svg+xml" }));
      window.notes = [{ id: "custom-test", title: "Özgün ders", pptxUrl: "data:application/octet-stream;base64,QUJD", custom: { keep: true },
        slides: Array.from({ length: 24 }, (_, index) => ({ title: `Slayt ${index}`, image, html: `<p>Notlar ${index}</p><img src="${temporary}">` })) }];
      window.original = structuredClone(notes);
      localStorage.setItem("mee101_preferred_view_mode_v1", "ppt");
      await LectureStorage.save(notes);
      await LecturePublishing.initialize({ hasLocalData: true, getLectures: () => notes, applyLectures: value => { window.notes = value; } });
      await LecturePublishing.login("isolated-test-key");
      return { originalSize: JSON.stringify(notes).length, temporary };
    });
    const failure = await page.evaluate(async () => {
      const stale = URL.createObjectURL(new Blob(["expired"]));
      URL.revokeObjectURL(stale);
      notes[0].staleMedia = stale;
      await LectureStorage.save(notes);
      const before = JSON.stringify(notes);
      await LecturePublishing.publish();
      const preserved = JSON.stringify(notes) === before && JSON.stringify(await LectureStorage.load()) === before;
      const status = document.getElementById("cloud-status-text").textContent;
      delete notes[0].staleMedia;
      await LectureStorage.save(notes);
      return { preserved, status };
    });
    assert.equal(failure.preserved, true);
    assert.ok(failure.status.includes("notlarınız korunuyor"));
    assert.equal(github.state.head, "commit-0", "a failed preparation must not change the shared document");
    await page.click("#btn-cloud-publish");
    await page.waitForFunction(() => document.getElementById("cloud-status-text").textContent.startsWith("GitHub’a kaydedildi"));
    const result = await page.evaluate(async () => ({
      preserved: notes[0].slides.every((slide, index) => slide.title === original[0].slides[index].title && slide.image === original[0].slides[index].image && slide.html.startsWith(`<p>Notlar ${index}</p>`)),
      originalUnchanged: original[0].slides[0].html.includes("blob:"),
      portable: notes[0].slides.every(slide => slide.html.includes("data:image/svg+xml;base64,") && !slide.html.includes("blob:")),
      stored: JSON.stringify(await LectureStorage.load()) === JSON.stringify(notes),
      preference: localStorage.getItem("mee101_preferred_view_mode_v1")
    }));
    assert.deepEqual(result, { preserved: true, originalUnchanged: true, portable: true, stored: true, preference: "ppt" });
    const uploaded = github.state.requests.filter(request => request.path === "/git/blobs").reduce((sum, request) => sum + request.body.content.length, 0);
    assert.ok(uploaded < first.originalSize / 10);
    await page.reload();
    const restored = await page.evaluate(async () => {
      window.notes = await LectureStorage.load();
      await LecturePublishing.initialize({ hasLocalData: true, getLectures: () => notes, applyLectures: value => { window.notes = value; } });
      return { count: notes[0].slides.length, title: notes[0].title, preference: localStorage.getItem("mee101_preferred_view_mode_v1"), status: document.getElementById("cloud-status-text").textContent };
    });
    assert.equal(restored.count, 24);
    assert.equal(restored.title, "Özgün ders");
    assert.equal(restored.preference, "ppt");
    assert.ok(restored.status.includes("GitHub ortak ders kaydı"));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ originalBytes: first.originalSize, uploadedBytes: uploaded, ...result, failurePreserved: failure.preserved, reloadPreserved: true }));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
