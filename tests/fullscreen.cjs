/* Uses an isolated origin, synthetic lessons, and headless Edge only. */
const assert = require("node:assert/strict");
const { fork } = require("node:child_process");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const port = "4203";
const origin = `http://127.0.0.1:${port}`;

async function openPresentation(page, mode) {
  await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.addInitScript(mode => {
    window.MEE101_GITHUB_ENABLED = false;
    sessionStorage.setItem("me101_instructor_unlocked", "true");
    if (mode === "denied") Element.prototype.requestFullscreen = () => Promise.reject(new Error("Denied"));
    if (mode === "missing" || mode === "webkit") Element.prototype.requestFullscreen = undefined;
    if (mode === "missing") Element.prototype.webkitRequestFullscreen = undefined;
    if (mode === "webkit") {
      Object.defineProperty(document, "webkitFullscreenElement", { writable: true, configurable: true, value: null });
      Element.prototype.webkitRequestFullscreen = function () {
        document.webkitFullscreenElement = this;
        document.dispatchEvent(new Event("webkitfullscreenchange"));
      };
      document.webkitExitFullscreen = () => {
        document.webkitFullscreenElement = null;
        document.dispatchEvent(new Event("webkitfullscreenchange"));
      };
    }
  }, mode);
  await page.goto(`${origin}/qa`);
  await page.waitForFunction(() => typeof openLecture === "function" && typeof LECTURES !== "undefined");
  await page.evaluate(() => {
    openLecture("qa-original");
    enterPresentationMode();
  });
  return page.evaluate(() => ({ lessons: JSON.stringify(LECTURES), storage: JSON.stringify(localStorage) }));
}

async function verify(browser, mode) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    const before = await openPresentation(page, mode);
    const button = page.locator("#btn-fullscreen");
    await button.click();
    await page.waitForFunction(() => document.getElementById("btn-fullscreen").getAttribute("aria-pressed") === "true");
    const fallback = mode === "denied" || mode === "missing";
    assert.equal(await page.evaluate(() => document.body.classList.contains("presentation-expanded")), fallback);
    assert.equal(await page.locator(".presentation-fullscreen-notice").isVisible(), fallback);
    if (fallback) {
      assert.equal(await page.locator(".presentation-fullscreen-notice a").getAttribute("href"), `${origin}/qa`);
      assert.equal(await page.locator(".slides-container").evaluate(el => getComputedStyle(el).maxWidth), "none");
    } else {
      assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement || document.webkitFullscreenElement)), true);
    }
    await button.click();
    await page.waitForFunction(() => document.getElementById("btn-fullscreen").getAttribute("aria-pressed") === "false");
    // F must still work while the fullscreen button retains keyboard focus.
    await page.keyboard.press("f");
    await page.waitForFunction(() => document.getElementById("btn-fullscreen").getAttribute("aria-pressed") === "true");
    if (mode === "native") {
      await page.evaluate(() => document.exitFullscreen());
      await page.waitForFunction(() => document.getElementById("btn-fullscreen").getAttribute("aria-pressed") === "false");
      await button.click();
    }
    if (fallback) await page.keyboard.press("Escape");
    else await page.locator("#btn-exit-presentation").click();
    await page.waitForFunction(() => !document.fullscreenElement && !document.webkitFullscreenElement && !document.body.classList.contains("presentation-expanded"));
    assert.equal(await page.locator(".presentation-fullscreen-notice").isVisible(), false);
    assert.deepEqual(await page.evaluate(() => ({ lessons: JSON.stringify(LECTURES), storage: JSON.stringify(localStorage) })), before);
    await page.reload();
    await page.waitForFunction(() => typeof LECTURES !== "undefined");
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), before.storage);
    assert.deepEqual(errors, []);
    console.info(`Passed fullscreen: ${mode}, click, F, exit, unchanged lessons and reload storage.`);
  } finally {
    await page.close();
  }
}

(async () => {
  const server = fork(path.join(__dirname, "preview-server.cjs"), { env: { ...process.env, MEE101_QA_PORT: port }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once("data", resolve); server.once("error", reject); server.once("exit", code => reject(new Error(`Preview exited: ${code}`))); });
    browser = await chromium.launch({ channel: "msedge", headless: true });
    for (const mode of ["native", "denied", "missing", "webkit"]) await verify(browser, mode);
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
