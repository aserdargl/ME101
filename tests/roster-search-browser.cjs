/** Exercises only the synthetic roster on a separate local origin. */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const target = "http://127.0.0.1:4193/qa-roster";

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto(target);
    await page.getByText("Open synthetic roster", { exact: true }).click();
    const search = page.locator("#inp-roster-search");
    const sort = page.locator("#sel-roster-sort");
    const rows = page.locator(".registered-roster-table tbody tr");
    const numbers = () => rows.locator("td:nth-child(2) input").evaluateAll(inputs => inputs.map(input => input.value));
    const stored = () => page.evaluate(() => JSON.stringify({ roster: localStorage.getItem("qa-registered-roster"), lectures: localStorage.getItem("me101_all_lectures_v2") }));
    const original = await stored();
    assert.deepEqual(await numbers(), ["00123", "00456", "00789"]);
    for (const [order, expected] of [["0:desc", ["00789", "00456", "00123"]], ["1:asc", ["00123", "00456", "00789"]], ["2:asc", ["00123", "00789", "00456"]]]) {
      await sort.selectOption(order);
      assert.deepEqual(await numbers(), expected);
    }
    await search.fill("guldibi ahmet");
    assert.deepEqual(await numbers(), ["00123"]);
    assert.equal(await page.locator("#roster-visible-count").textContent(), "1 / 3");
    await rows.locator('input[type="checkbox"]').check();
    await search.fill("ayse");
    await page.locator('thead input[type="checkbox"]').check();
    assert.equal(await page.locator("#roster-selected-count").textContent(), "2");
    await page.locator('thead input[type="checkbox"]').uncheck();
    assert.equal(await page.locator("#roster-selected-count").textContent(), "1");
    await search.fill("missing");
    assert.equal(await rows.locator("td").count(), 1);
    assert.equal(await page.locator('thead input[type="checkbox"]').isDisabled(), true);
    await search.fill("00123");
    await rows.locator("td:nth-child(3) input").fill("Ahmet Edited");
    await search.fill("00456");
    await search.fill("");
    const ahmet = rows.filter({ has: page.locator('input[aria-label="İsim 00123"], input[aria-label="First name 00123"]') });
    assert.equal(await ahmet.locator("td:nth-child(3) input").inputValue(), "Ahmet Edited");
    await ahmet.getByRole("button", { name: /Cancel|Vazgeç/, exact: true }).click();
    assert.equal(await ahmet.locator("td:nth-child(3) input").inputValue(), "Ahmet Serdar");
    assert.equal(await stored(), original);
    await ahmet.locator("td:nth-child(3) input").fill("Ahmet Saved");
    await ahmet.getByRole("button", { name: /Save|Kaydet/, exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("qa-registered-roster"))?.[0].firstName === "Ahmet Saved");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("qa-registered-roster")));
    assert.equal(saved.length, 3);
    assert.equal(saved[1].name, "Ayşe Kaya");
    assert.equal(saved[2].enabled, false);
    await page.reload();
    await page.getByText("Open synthetic roster", { exact: true }).click();
    assert.equal(await page.locator('.registered-roster-table input[aria-label="İsim 00123"], .registered-roster-table input[aria-label="First name 00123"]').inputValue(), "Ahmet Saved");
    await search.fill("legacy@");
    assert.deepEqual(await numbers(), ["00789"]);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator("#inp-roster-search, #sel-roster-sort, #roster-visible-count").evaluateAll(controls => controls.every(control => {
      const bounds = control.getBoundingClientRect();
      return bounds.left >= 0 && bounds.right <= innerWidth;
    })), true);
    assert.deepEqual(errors, []);
    process.stdout.write("Roster browser checks passed: search, sorting, selection, draft/cancel/save/reload, legacy data, mobile layout.\n");
  } finally { await browser.close(); }
}

run().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
