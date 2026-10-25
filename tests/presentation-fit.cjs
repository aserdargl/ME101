/* Uses only synthetic content on an isolated origin. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');
const origin = 'http://127.0.0.1:4195';

async function bounds(page) {
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.active-slide')).opacity) > 0.99);
  return page.evaluate(() => {
    const slide = document.querySelector('.active-slide');
    const frame = slide.querySelector('.ppt-source-frame');
    const image = frame.querySelector('img');
    const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    return { slide: rect(slide), frame: rect(frame), image: rect(image), toolbar: rect(document.getElementById('presentation-toolbar')),
      scrollX: slide.scrollWidth - slide.clientWidth, scrollY: slide.scrollHeight - slide.clientHeight,
      pageX: document.documentElement.scrollWidth - innerWidth, pageY: document.documentElement.scrollHeight - innerHeight,
      imageRatio: image.naturalWidth / image.naturalHeight };
  });
}

async function verify(page) {
  const result = await bounds(page);
  assert.ok(result.scrollX <= 1 && result.scrollY <= 1, JSON.stringify(result));
  assert.ok(result.pageX <= 1 && result.pageY <= 1, JSON.stringify(result));
  assert.ok(result.slide.bottom <= result.toolbar.y + 1, JSON.stringify(result));
  assert.ok(result.image.y >= result.slide.y && result.image.bottom <= result.slide.bottom + 1, JSON.stringify(result));
  assert.ok(result.image.x >= result.slide.x && result.image.right <= result.slide.right + 1, JSON.stringify(result));
  assert.ok(Math.abs(result.image.width / result.image.height - result.imageRatio) < 0.02, JSON.stringify(result));
}

(async () => {
  const server = fork(path.join(__dirname, 'preview-server.cjs'), { env: { ...process.env, MEE101_QA_PORT: '4195' }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin);
    await page.waitForFunction(() => typeof openLecture === 'function');
    await page.evaluate(() => {
      const slides = [[1600, 900], [1200, 900], [900, 1600]].map(([width, height]) => ({
        title: 'A long synthetic title that must remain visible with the entire slide', kicker: 'QA',
        html: '<p>Additional notes must remain accessible and complete.</p>'.repeat(5),
        sourceSlideRatio: `${width}/${height}`,
        pptImageUrl: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fff"/><rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="#c43d3d" stroke-width="12"/><text x="40" y="${height - 40}" font-size="40">BOTTOM EDGE</text></svg>`)
      }));
      LECTURES.splice(0, LECTURES.length, { id: 'qa-fit', week: 'QA', title: 'Synthetic fit', slides });
      window.qaFitOriginal = JSON.stringify(LECTURES);
      openLecture('qa-fit', true);
    });
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 1024, height: 600 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      for (let index = 0; index < 3; index++) {
        await page.evaluate(i => { currentSlideIndex = i; updateActiveSlide(); }, index);
        await verify(page);
      }
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.locator('#btn-fullscreen').click();
    await page.waitForFunction(() => document.fullscreenElement || document.body.classList.contains('presentation-expanded'));
    await verify(page);
    await page.screenshot({ path: '.jtmp/presentation-fit-fullscreen.png' });
    await page.evaluate(() => PresentationFullscreen.exit());
    await page.evaluate(() => {
      document.documentElement.requestFullscreen = () => Promise.reject(new Error('Synthetic fallback'));
    });
    await page.locator('#btn-fullscreen').click();
    await page.waitForFunction(() => document.body.classList.contains('presentation-expanded'));
    await verify(page);
    await page.evaluate(() => exitPresentationMode());
    await page.locator('.slide').last().scrollIntoViewIfNeeded();
    const reading = await page.locator('.slide').last().evaluate(slide => {
      const frame = slide.querySelector('.ppt-source-frame');
      const image = frame.querySelector('img');
      return { clipped: image.getBoundingClientRect().bottom > frame.getBoundingClientRect().bottom + 1,
        scrollX: document.documentElement.scrollWidth > innerWidth, unchanged: JSON.stringify(LECTURES) === qaFitOriginal };
    });
    assert.deepEqual(reading, { clipped: false, scrollX: false, unchanged: true });
    assert.deepEqual(errors, []);
    console.info('Passed: wide, standard and portrait slides fit five screen sizes, fullscreen, fallback, and reading mode without clipping or scrollbars.');
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
