/* Synthetic files on a separate localhost origin; never edits production data. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { chromium } = require('playwright');
const { pdfFixture } = require('./pdf-fixture.cjs');

(async () => {
  const origin = 'http://127.0.0.1:4226';
  const server = fork(path.join(__dirname, 'preview-server.cjs'), { env: { ...process.env, MEE101_QA_PORT: '4226' }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const html = Buffer.from('<!doctype html><button id="run">Run</button><output id="answer">Ready</output><script>document.querySelector("button").onclick=()=>document.querySelector("output").textContent=42;</script>');
    const files = [pdfFixture(), html].map((bytes, index) => {
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const ext = index ? 'html' : 'pdf';
      return { bytes, entry: { id: 'week-file-' + String(index + 1).repeat(64), week: index + 1,
        name: `${index + 1}.Week.${ext}`, path: `weeks/files/${sha256}.${ext}`, sha256, size: bytes.length } };
    });
    let entries = files.map(file => file.entry);
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/weeks/manifest.json') return route.fulfill({ json: { version: 1, files: entries } });
      const file = files.find(file => '/' + file.entry.path === url.pathname);
      if (file) return route.fulfill({ body: file.bytes, contentType: file.entry.name.endsWith('.pdf') ? 'application/pdf' : 'text/html' });
      return route.continue();
    });
    await page.goto(origin + '/qa');
    await page.locator('.lecture-card').filter({ hasText: '1.Week' }).waitFor();
    const original = await page.evaluate(() => JSON.stringify(LECTURES));
    assert.equal(await page.locator('.lecture-card').count(), 3);
    await page.locator('.lecture-card').filter({ hasText: '1.Week' }).locator('.btn-read').click();
    await page.locator('.pdf-page canvas').first().waitFor();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES)), original);
    await page.locator('#btn-back-catalog').click();
    await page.locator('.lecture-card').filter({ hasText: '2.Week' }).locator('.btn-read').click();
    const frame = page.frameLocator('#slides-container iframe').first();
    await frame.locator('#run').click();
    assert.equal(await frame.locator('#answer').textContent(), '42');
    assert.equal(await frame.locator('body').evaluate(() => { try { parent.localStorage.getItem('x'); return false; } catch { return true; } }), true);
    await page.locator('#btn-back-catalog').click();
    // Deletion in the next published manifest must remove only managed cards.
    entries = [];
    await page.reload();
    await page.waitForFunction(() => typeof WeeklyFiles !== 'undefined' && document.querySelectorAll('.lecture-card').length === 1);
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES)), original);
    assert.equal(await page.evaluate(() => WeeklyFiles.all().length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: PDF rendering, isolated interactive HTML, managed deletion and existing-note preservation.');
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
