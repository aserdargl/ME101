/* Synthetic content only; all writes stay on this isolated local origin. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');
const origin = 'http://127.0.0.1:4196';

(async () => {
  const server = fork(path.join(__dirname, 'preview-server.cjs'), { env: { ...process.env, MEE101_QA_PORT: '4196' }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin);
    await page.waitForFunction(() => typeof openLecture === 'function');
    assert.equal(await page.evaluate(() => preferredSlideViewMode), 'image');
    await page.evaluate(async () => {
      const file = new File([await (await fetch('/fixture.pptx')).arrayBuffer()], 'fixture.pptx');
      const slides = await PptxImport.parse(file, 'QA', 'Synthetic');
      slides[0].html = '<p id="qa-note">Preserved notes</p>';
      slides.push({ title: 'Interactive', html: '<button id="qa-interactive" onclick="this.textContent=42">Calculate</button>' });
      const lecture = { id: 'qa-images', week: 'QA', title: 'Synthetic', slides };
      LECTURES.splice(0, LECTURES.length, lecture);
      window.qaOriginal = JSON.stringify(LECTURES);
      await PptxDisplay.prepareUpload(file, slides);
      openLecture(lecture.id);
    });
    const host = page.locator('[data-pptx-render]').first();
    await host.waitFor();
    await page.waitForFunction(() => document.querySelector('[data-pptx-render]')?.dataset.imageReady === 'true', null, { timeout: 30000 });
    assert.equal(await host.locator('img[src^="data:image/png"]').count(), 1);
    assert.match(await host.locator('img[src^="data:image/png"]').getAttribute('src'), /^data:image\/png/);
    const pixels = await host.locator('img[src^="data:image/png"]').evaluate(image => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let colored = 0;
      for (let i = 0; i < bytes.length; i += 4) if (bytes[i + 3] && Math.max(bytes[i], bytes[i + 1], bytes[i + 2]) - Math.min(bytes[i], bytes[i + 1], bytes[i + 2]) > 40) colored++;
      return colored;
    });
    assert.ok(pixels > 10000, `Expected actual artwork, got ${pixels} colored pixels`);
    await page.locator('#qa-note').waitFor({ state: 'visible' });
    await page.locator('#qa-interactive').click();
    assert.equal(await page.locator('#qa-interactive').textContent(), '42');
    await page.evaluate(() => applyPersistentSlideViewMode('ppt'));
    assert.equal(await host.locator('img[src^="data:image/png"]').isVisible(), false);
    await page.evaluate(() => applyPersistentSlideViewMode('web'));
    await page.locator('#btn-image-slide-mode').click();
    assert.equal(await host.locator('img[src^="data:image/png"]').isVisible(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === qaOriginal), true);
    await page.evaluate(() => { enterPresentationMode(); exitPresentationMode(); goHome(); openLecture('qa-images'); });
    assert.equal(await page.locator('#btn-image-slide-mode').getAttribute('aria-pressed'), 'true');
    await page.reload();
    assert.equal(await page.evaluate(() => preferredSlideViewMode), 'image');
    assert.deepEqual(errors, []);
    console.info('Passed: PNG pixels, original ratio, notes, HTML interaction, three modes, mobile, presentation, reload and unchanged lecture content.');
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
