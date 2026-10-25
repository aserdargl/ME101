/** Uses an isolated local origin and synthetic data; never calls live account services. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const note = [{ id: "qa-student", week: "1. Hafta", title: "Synthetic lesson", description: "Preserve",
  slides: [{ title: "Synthetic slide", html: "<p>Preserved notes</p>" }] }];

async function run() {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (name === "firebase-config.js") {
      response.setHeader("Content-Type", "text/javascript");
      return response.end("window.MEE101_FIREBASE_CONFIG={synthetic:true};window.MEE101_GITHUB_ENABLED=false;");
    }
    const file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    try {
      const bytes = await fs.readFile(file);
      response.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css" })[path.extname(name)] || "application/octet-stream");
      response.end(bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript(note => {
      if (!localStorage.getItem("qa-seeded")) {
        localStorage.setItem("me101_all_lectures_v2", JSON.stringify(note));
        localStorage.setItem("me101_student_votes_v4", JSON.stringify({ "old-lesson": { "00099": 4 } }));
        localStorage.setItem("me101_student_roster_v1", JSON.stringify([{ no: "00099", name: "Keep" }]));
        localStorage.setItem("qa-settings", "preserved");
        localStorage.setItem("qa-seeded", "true");
      }
      window.qaAccountCalls = 0;
      Object.defineProperty(window, "createFirebaseStudentAdapter", {
        get: () => async () => ({
          start: async onUser => { window.qaAuthEvent = onUser; await onUser(null); },
          signIn: async () => { window.qaAccountCalls++; throw new Error("Student account sign-in forbidden"); },
          signOut: async () => { window.qaAccountCalls++; },
          errorMessage: error => error.message
        }), set() {}
      });
    }, note);
    await page.goto(origin);
    await page.waitForFunction(() => document.querySelector(".btn-read"));
    const snapshot = () => page.evaluate(() => ({
      notes: localStorage.getItem("me101_all_lectures_v2"), roster: localStorage.getItem("me101_student_roster_v1"),
      settings: localStorage.getItem("qa-settings"), votes: localStorage.getItem("me101_student_votes_v4")
    }));
    const before = await snapshot();
    await page.locator(".btn-read").first().click();
    assert.equal(await page.locator("#student-login-backdrop input").count(), 1);
    assert.equal(await page.locator("#btn-student-register, #inp-student-email, #inp-student-password").count(), 0);
    await page.locator("#btn-submit-student-login").click();
    await page.locator("#student-login-error").waitFor({ state: "visible" });
    await page.locator("#inp-student-number").fill("abc");
    await page.locator("#inp-student-number").press("Enter");
    assert.equal(await page.evaluate(() => activeStudentNo), null);
    await page.locator("#btn-close-student-login").click();
    assert.deepEqual(await snapshot(), before);
    await page.locator(".btn-read").first().click();
    await page.locator("#inp-student-number").fill("001234");
    await page.locator("#inp-student-number").press("Enter");
    await page.locator("#lecture-view").waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => activeStudentNo), "001234");
    assert.equal(await page.evaluate(() => isAdminAuthenticated), false);
    await page.evaluate(() => window.qaAuthEvent(null));
    assert.equal(await page.evaluate(() => activeStudentNo), "001234");
    await page.reload();
    await page.waitForFunction(() => document.getElementById("btn-student-toggle").classList.contains("logged-in"));
    assert.equal(await page.evaluate(() => activeStudentNo), "001234");
    assert.deepEqual(await snapshot(), before);
    await page.locator("#btn-student-toggle").click();
    await page.reload();
    await page.waitForFunction(() => document.querySelector(".star-btn"));
    assert.equal(await page.evaluate(() => activeStudentNo), null);
    await page.locator('.star-btn[data-val="5"]').first().click();
    await page.locator("#inp-student-number").fill("005678");
    await page.locator("#btn-submit-student-login").click();
    const afterVote = await snapshot();
    assert.deepEqual(JSON.parse(afterVote.votes), { "old-lesson": { "00099": 4 }, "qa-student": { "005678": 5 } });
    assert.equal(afterVote.notes, before.notes);
    assert.equal(afterVote.roster, before.roster);
    assert.equal(afterVote.settings, before.settings);
    await page.evaluate(() => { isAdminAuthenticated = true; });
    await page.locator("#btn-student-toggle").click();
    assert.equal(await page.evaluate(() => isAdminAuthenticated), true);
    assert.equal(await page.evaluate(() => window.qaAccountCalls), 0);
    assert.deepEqual(errors, []);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#btn-student-toggle").click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator("#btn-close-student-login").click();
    process.stdout.write("Student number entry passed: one field, invalid input, cancel, lecture continuation, leading zeroes, reload, logout, vote continuation, data preservation, instructor isolation, mobile layout; zero account calls.\n");
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}

run().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
