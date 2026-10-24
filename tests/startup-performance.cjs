/** Measures cold startup on an isolated origin with deterministic network delays. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const baselineRef = process.env.STARTUP_BASELINE_REF || 'b66ec45';
  const baselineFiles = new Map(['index.html', 'legacy-content.js', 'lecture-publishing.js', 'pptx-import.js'].map(file =>
    [file, execFileSync('git', ['show', `${baselineRef}:${file}`], { cwd: root })]));
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    try {
      const relative = path.relative(root, file);
      const body = pathname === '/fixture.pptx' ? await require('./pptx-fixture.cjs').fixture() :
        pathname === '/before.html' ? baselineFiles.get('index.html') :
          process.env.STARTUP_BEFORE === '1' && baselineFiles.has(relative) ? baselineFiles.get(relative) : await fs.readFile(file);
      await delay(100);
      response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const samples = [];
  try {
    const runs = Number(process.env.STARTUP_RUNS || 5);
    for (let run = 0; run < runs; run++) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/firebase-config.js') return route.fulfill({ contentType: 'text/javascript', body: 'window.MEE101_FIREBASE_CONFIG=null;' });
        if (url.origin === origin) return route.continue();
        // External bootstrap latency is fixed; no production data is ever used.
        await delay(700);
        if (url.hostname === 'cdnjs.cloudflare.com') return route.fulfill({ contentType: 'text/javascript', body: '' });
        if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: '' });
        return route.abort();
      });
      await page.addInitScript(() => {
        window.MEE101_GITHUB_ENABLED = false;
        if (localStorage.getItem('qa-seeded')) return;
        const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="red"/></svg>');
        const lectures = [{ id: 'qa-startup', week: '5. Hafta', title: 'Startup QA', description: 'Synthetic data', custom: { keep: true }, slides: Array.from({ length: 80 }, (_, i) => ({ title: `QA ${i}`, pptImageUrl: image, extractedImages: [image], html: '<p>Retain this note</p><!--' + 'x'.repeat(40000) + '-->' })) }];
        localStorage.setItem('me101_all_lectures_v2', JSON.stringify(lectures));
        localStorage.setItem('qa-settings', 'keep');
        localStorage.setItem('qa-seeded', 'true');
        new MutationObserver(() => {
          if (!window.qaCatalogMs && document.querySelector('.lecture-card h4')?.textContent === 'Startup QA') {
            requestAnimationFrame(() => requestAnimationFrame(() => { window.qaCatalogMs ||= performance.now(); }));
          }
        }).observe(document, { childList: true, subtree: true });
      });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.qaCatalogMs > 0);
      await delay(100);
      const sample = await page.evaluate(() => ({
        catalogMs: Math.round(window.qaCatalogMs),
        fcpMs: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0),
        domReadyMs: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),
        cards: document.querySelectorAll('.lecture-card').length,
        preserved: LECTURES[0].slides.length === 80 && localStorage.getItem('qa-settings') === 'keep'
      }));
      assert.deepEqual(errors, []);
      assert.equal(sample.cards, 1);
      assert.equal(sample.preserved, true);
      samples.push(sample);
      if (run === runs - 1 && process.env.STARTUP_VERIFY === '1') await verifyPreservation(page, origin);
      await page.close();
    }
    console.info(JSON.stringify({ label: process.env.STARTUP_LABEL || 'current', profile: `cold cache; local resources 100ms; external bootstrap 700ms; 3.2MB synthetic notes; ${runs} runs`, ...Object.fromEntries(['catalogMs', 'fcpMs', 'domReadyMs'].map(key => [key, median(samples.map(sample => sample[key]))])), samples }, null, 2));
  } finally { await browser.close(); server.close(); }
}

async function verifyPreservation(page, origin) {
  const expected = await page.evaluate(async () => {
    isAdminAuthenticated = true;
    const original = JSON.stringify(LECTURES);
    const settings = { [RATING_STORAGE_KEY]: '{"qa-startup":{"0001":4}}', [STUDENT_ROSTER_KEY]: '[{"no":"0001","name":"Synthetic QA"}]' };
    Object.entries(settings).forEach(([key, value]) => localStorage.setItem(key, value));
    openEditLectureModal('qa-startup');
    document.getElementById('edit-slide-title').value = 'Cancelled draft';
    closeEditLectureModal();
    if (JSON.stringify(LECTURES) !== original) throw Error('Cancel changed original notes');
    openEditLectureModal('qa-startup');
    document.getElementById('btn-save-edit-lecture').click();
    while (editingLectureDraft) await new Promise(resolve => setTimeout(resolve, 20));
    if (JSON.stringify(LECTURES) !== original || JSON.stringify(await LectureStorage.load()) !== original) throw Error('Save changed original notes');
    if (window.JSZip) throw Error('ZIP was loaded before any upload');
    const bytes = await (await fetch('/fixture.pptx')).arrayBuffer();
    const slides = await PptxImport.parse(new File([bytes], 'qa.pptx'), 'QA', 'QA');
    if (!window.JSZip || slides.length !== 2 || !slides[0].extractedImages.length) throw Error('Lazy ZIP reader failed');
    return { original, settings };
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof LECTURES !== 'undefined' && LECTURES[0]?.id === 'qa-startup');
  assert.equal(await page.evaluate(() => JSON.stringify(LECTURES)), expected.original);
  assert.deepEqual(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(expected.settings)), expected.settings);
  assert.equal(await page.evaluate(() => localStorage.getItem('qa-settings')), 'keep');
  // Compare the final catalog against the previous published HTML on this same origin.
  if (process.env.STARTUP_REAL_FONTS === '1') {
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.continue());
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
  }
  await page.evaluate(() => { isAdminAuthenticated = false; renderCatalog(); });
  await delay(1000);
  const after = await page.screenshot({ animations: 'disabled' });
  await page.goto(origin + '/before.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('.lecture-card h4')?.textContent === 'Startup QA');
  const before = await page.screenshot({ animations: 'disabled' });
  assert.equal(after.equals(before), true, 'Catalog appearance changed');
  console.info(JSON.stringify({ openingCancelSaveReload: 'preserved', notesImagesRatingsRosterSettings: 'preserved', lazyLocalZipImport: 'passed', catalogScreenshot: 'identical' }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });

