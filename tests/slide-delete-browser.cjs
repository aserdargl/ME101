/** Reproduces repeated delete confirmations using isolated synthetic lecture data. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = 'http://127.0.0.1:4241';

(async () => {
  const server = fork(path.join(__dirname, 'preview-server.cjs'), {
    env: { ...process.env, MEE101_QA_PORT: '4241' }, silent: true
  });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const errors = [];
    const prompts = [];
    let accept = true;
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => {
      prompts.push(dialog.message());
      if (accept) await dialog.accept(); else await dialog.dismiss();
    });
    await page.route('**/*', route => new URL(route.request().url()).origin === origin || route.request().url().startsWith('data:') ? route.continue() : route.abort());
    await page.goto(origin + '/qa');
    await page.waitForFunction(() => typeof LECTURES !== 'undefined' && LECTURES.some(item => item.id === 'qa-original'));
    await page.evaluate(async () => {
      isAdminAuthenticated = true;
      window.qaOriginal = JSON.stringify(LECTURES);
      localStorage.setItem('me101_student_roster_v1', '[{"no":"00123","name":"Synthetic"}]');
      localStorage.setItem('me101_student_votes_v1', '{"qa-original":5}');
      for (let i = 0; i < 6; i++) renderCatalog();
      openEditLectureModal('qa-original');
      insertHtmlSlideAt(1);
      insertContentSlideAt(2);
    });
    const deleteButton = page.locator('#btn-delete-current-slide');
    accept = false;
    await deleteButton.click();
    assert.equal(prompts.length, 1);
    assert.equal(await page.evaluate(() => editingLectureDraft.slides.length), 3);
    accept = true;
    await deleteButton.click();
    assert.equal(prompts.length, 2);
    assert.equal(await page.evaluate(() => editingLectureDraft.slides.length), 2);
    await deleteButton.click();
    assert.equal(prompts.length, 3);
    assert.equal(await page.evaluate(() => editingLectureDraft.slides.length), 1);
    assert(prompts.every(message => /^Slayt \d+ silinsin mi\?$/.test(message)));
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === qaOriginal), true);
    await page.locator('#btn-cancel-edit-lecture').click();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === qaOriginal), true);

    await page.evaluate(() => { openEditLectureModal('qa-original'); insertHtmlSlideAt(1); insertContentSlideAt(2); });
    await page.locator('#btn-save-edit-lecture').click();
    await page.waitForFunction(() => editingLectureDraft === null);
    await page.evaluate(() => { for (let i = 0; i < 6; i++) renderCatalog(); openEditLectureModal('qa-original', 2); });
    const saved = await page.evaluate(async () => JSON.stringify(await LectureStorage.load()));
    await deleteButton.click();
    await deleteButton.click();
    assert.equal(prompts.length, 5);
    assert.equal(await page.evaluate(async () => JSON.stringify(await LectureStorage.load())), saved);
    await page.locator('#btn-save-edit-lecture').click();
    await page.waitForFunction(() => editingLectureDraft === null);
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === qaOriginal), true);
    await page.evaluate(() => deleteCustomLectureFromStorage(undefined));
    assert.equal(prompts.length, 5);
    await page.reload();
    await page.waitForFunction(() => typeof LECTURES !== 'undefined' && LECTURES.some(item => item.id === 'qa-original'));
    assert.equal(await page.evaluate(() => LECTURES.find(item => item.id === 'qa-original').slides.length), 1);
    assert.equal(await page.evaluate(() => localStorage.getItem('me101_student_roster_v1')), '[{"no":"00123","name":"Synthetic"}]');
    assert.equal(await page.evaluate(() => localStorage.getItem('me101_student_votes_v1')), '{"qa-original":5}');
    await page.evaluate(() => {
      isAdminAuthenticated = true;
      LECTURES.push({ ...LectureDocument.snapshot(LECTURES[0]), id: 'qa-delete-course' });
      for (let i = 0; i < 6; i++) renderCatalog();
    });
    const courseDelete = page.locator('[data-del-lec="qa-delete-course"]');
    accept = false;
    await courseDelete.click();
    assert.equal(prompts.length, 6);
    assert.equal(await page.evaluate(() => LECTURES.some(item => item.id === 'qa-delete-course')), true);
    accept = true;
    await courseDelete.click();
    assert.equal(prompts.length, 7);
    assert.equal(await page.evaluate(() => LECTURES.some(item => item.id === 'qa-delete-course')), false);
    assert.equal(await page.evaluate(() => LECTURES.some(item => item.id === 'qa-original')), true);
    assert.deepEqual(errors, []);
    console.info('Passed: one confirmation after repeated catalog renders; HTML/Content delete, dismiss, cancel, save/reload, invalid lecture guard, preserved original content, roster and ratings.');
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
