/* Headless browser checks on a separate origin with synthetic lecture data. */
const assert = require("node:assert/strict");
const { fork } = require("node:child_process");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const port = "4207";
const origin = `http://127.0.0.1:${port}`;

async function verify(page) {
  await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(`${origin}/qa`);
  await page.waitForFunction(() => typeof openLecture === "function" && LECTURES.length > 0);
  const before = await page.evaluate(() => {
    document.getElementById("qa-import")?.remove();
    LECTURES.splice(0, LECTURES.length, { id: "qa-jump", week: "QA", title: "Synthetic slides",
      slides: Array.from({ length: 50 }, (_, i) => ({ title: `Slide ${i + 1}`, kicker: "QA",
        defaultViewMode: "web", html: `<p>Content ${i + 1}</p><p class="fragment">Step</p>` })) });
    openLecture("qa-jump");
    applyPersistentSlideViewMode("web");
    enterPresentationMode();
    return { lessons: JSON.stringify(LECTURES), storage: JSON.stringify(localStorage) };
  });
  const input = page.locator("#slide-number");
  const index = () => page.evaluate(() => currentSlideIndex);
  assert.equal(await input.inputValue(), "1");
  assert.equal(await page.locator("#slide-total").textContent(), "50");
  await input.click();
  await page.keyboard.type("25");
  assert.equal(await index(), 0);
  await input.press("Enter");
  assert.equal(await index(), 24);
  assert.equal(await page.locator(".active-slide h2").textContent(), "Slide 25");
  assert.equal(await page.locator("#pres-progress-bar").evaluate(el => el.style.width), "50%");
  for (const invalid of ["", "0", "51", "-1", "2.5", "abc", "1e1"]) {
    await input.fill(invalid);
    await input.press("Enter");
    assert.equal(await index(), 24, invalid);
    assert.equal(await input.inputValue(), "25", invalid);
  }
  await input.fill("12");
  await input.press("Escape");
  assert.equal(await input.inputValue(), "25");
  assert.equal(await page.evaluate(() => isPresentationMode), true);
  await input.fill("50");
  await input.press("Tab");
  assert.equal(await index(), 49);
  await input.fill("1");
  await input.press("Enter");
  assert.equal(await index(), 0);
  await page.locator("#btn-next-slide").click();
  assert.equal(await input.inputValue(), "1");
  await page.locator("#btn-next-slide").click();
  assert.equal(await input.inputValue(), "2");
  await page.evaluate(() => PortalLanguage.setLanguage("tr"));
  await page.waitForFunction(() => document.getElementById("slide-number").getAttribute("aria-label") === "Slayt numarası");
  await page.evaluate(() => PortalLanguage.setLanguage("en"));
  await page.waitForFunction(() => document.getElementById("slide-number").getAttribute("aria-label") === "Slide number");
  await page.setViewportSize({ width: 390, height: 844 });
  await input.fill("40");
  await input.press("Enter");
  assert.equal(await index(), 39);
  assert.equal(await input.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
  }), true);
  await page.screenshot({ path: path.join(__dirname, "../.jtmp/slide-number-mobile.png") });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.screenshot({ path: path.join(__dirname, "../.jtmp/slide-number-desktop.png") });
  assert.deepEqual(await page.evaluate(() => ({ lessons: JSON.stringify(LECTURES), storage: JSON.stringify(localStorage) })), before);
  await page.reload();
  await page.waitForFunction(() => typeof openLecture === "function");
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), before.storage);
  console.info("Passed: direct jump, boundaries, invalid input, cancel, blur, steps, translation, mobile and unchanged data.");
}

(async () => {
  require("node:fs").mkdirSync(path.join(__dirname, "../.jtmp"), { recursive: true });
  const server = fork(path.join(__dirname, "preview-server.cjs"), { env: { ...process.env, MEE101_QA_PORT: port }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once("data", resolve);
      server.once("error", reject);
      server.once("exit", code => reject(new Error(`Preview exited: ${code}`)));
    });
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await verify(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
