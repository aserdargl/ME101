/** Isolated scroll regression and lecture preservation checks. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');
const origin = 'http://127.0.0.1:4243';

(async () => {
  const server = fork(path.join(__dirname, 'preview-server.cjs'), {
    env: { ...process.env, MEE101_QA_PORT: '4243' }, silent: true
  });
  let browser;
  try {
    server.stderr.on('data', bytes => process.stderr.write(bytes));
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      await page.route('**/*', route => new URL(route.request().url()).origin === origin || route.request().url().startsWith('data:') ? route.continue() : route.abort());
      await page.goto(origin + '/qa');
      await page.waitForFunction(() => typeof LECTURES !== 'undefined' && LECTURES.some(item => item.id === 'qa-original'));
      await page.evaluate(async () => {
        document.querySelectorAll('body > button').forEach(button => button.remove());
        isAdminAuthenticated = true;
        const source = 'data:application/pdf;base64,' + btoa(await (await fetch('/fixture.pdf')).text());
        LECTURES[0].slides = Array.from({ length: 40 }, (_, i) => ({ title: `PDF ${i}`, html: '', defaultViewMode: 'pdf', pdf: { source, page: 1, width: 960, height: 540 } }));
        await saveAllLecturesToStorage();
        window.qaOriginal = JSON.stringify(LECTURES);
        openLecture('qa-original');
        openEditLectureModal('qa-original');
      });
      const body = page.locator('#edit-lecture-backdrop .modal-body');
      await page.locator('.edit-slide-filmstrip').scrollIntoViewIfNeeded();
      await page.locator('.edit-slide-filmstrip').hover();
      for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(250); }
      console.info('filmstrip', await page.locator('.edit-slide-filmstrip').evaluate(el => ({ top: el.scrollTop, height: el.clientHeight, total: el.scrollHeight, body: el.closest('.modal-body').scrollTop })));
      await body.hover({ position: { x: 20, y: 100 } });
      let previous = await body.evaluate(el => el.scrollTop);
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, 250);
        await page.waitForTimeout(400);
        const current = await body.evaluate(el => el.scrollTop);
        assert(current >= previous - 1, `Downward scrolling jumped back: ${previous} to ${current}`);
        previous = current;
      }
      await page.mouse.wheel(0, 650);
      await page.waitForTimeout(800);
      const samples = [];
      for (let i = 0; i < 6; i++) {
        samples.push(await body.evaluate(el => ({ top: el.scrollTop, height: el.clientHeight, total: el.scrollHeight })));
        await page.waitForTimeout(100);
      }
      console.info(JSON.stringify({ viewport, samples }));
      assert(samples.every(sample => sample.top > 200), 'Editor must stay scrolled down');
      assert(Math.max(...samples.map(s => s.top)) - Math.min(...samples.map(s => s.top)) <= 1, 'Scroll position must remain stable');
      await page.locator('#btn-cancel-edit-lecture').click();
      assert(await page.evaluate(() => JSON.stringify(LECTURES) === qaOriginal));
      await page.evaluate(() => openEditLectureModal('qa-original'));
      await page.locator('#btn-save-edit-lecture').click();
      await page.waitForFunction(() => editingLectureDraft === null);
      assert(await page.evaluate(() => JSON.stringify(LECTURES) === qaOriginal));
      const expected = await page.evaluate(() => JSON.stringify(LECTURES));
      await page.reload();
      await page.waitForFunction(() => typeof LECTURES !== 'undefined' && LECTURES.some(item => item.id === 'qa-original'));
      assert.equal(await page.evaluate(() => JSON.stringify(LECTURES)), expected);
      await page.close();
    }
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
