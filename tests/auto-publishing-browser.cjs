/* Synthetic files and an in-memory publisher, entirely on a separate local origin. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');
const { pdfFixture } = require('./pdf-fixture.cjs');

(async () => {
  const origin = 'http://127.0.0.1:4228';
  const server = fork(path.join(__dirname, 'preview-server.cjs'), { env: { ...process.env, MEE101_QA_PORT: '4228' }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin || route.request().url().startsWith('data:') ? route.continue() : route.abort());
    await page.goto(origin + '/qa');
    await page.waitForFunction(() => typeof LecturePublishing !== 'undefined' && LECTURES.some(item => item.id === 'qa-original'));
    await page.evaluate(async () => {
      window.qaPublished = [];
      window.qaManifest = null;
      window.qaOriginal = JSON.stringify(LECTURES.find(item => item.id === 'qa-original'));
      InstructorLectureRepository.prototype.login = async () => true;
      InstructorLectureRepository.prototype.readCurrent = async () => ({ manifest: window.qaManifest });
      InstructorLectureRepository.prototype.publish = async function (lectures) {
        window.qaPublished.push(LectureDocument.snapshot(lectures));
        window.qaManifest = { id: crypto.randomUUID(), digest: await this.documentDigest(lectures) };
        return window.qaManifest;
      };
      window.MEE101_GITHUB_ENABLED = true;
      await LecturePublishing.login();
      isAdminAuthenticated = true;
      renderCatalog();
      openPptxModal('tab-add-manual');
    });
    await page.locator('#inp-pdf-file').setInputFiles({ name: 'Synthetic.pdf', mimeType: 'application/pdf', buffer: pdfFixture() });
    await page.locator('#btn-process-pdf').click();
    await page.waitForFunction(() => qaPublished.length === 1 && currentLecture?.pdfUrl);
    assert.equal(await page.evaluate(() => qaPublished[0].find(item => item.pdfUrl).slides.length), 2);
    await page.evaluate(() => { window.qaPdfId = currentLecture.id; openEditLectureModal(qaPdfId); insertContentSlideAt(1); });
    await page.locator('#edit-slide-title').fill('Cancelled draft');
    await page.locator('#btn-cancel-edit-lecture').click();
    assert.equal(await page.evaluate(() => qaPublished.length), 1);
    await page.evaluate(() => { openEditLectureModal(qaPdfId); insertContentSlideAt(1); });
    await page.locator('#edit-slide-title').fill('Automatically published note');
    await page.locator('#btn-save-edit-lecture').click();
    await page.waitForFunction(() => qaPublished.length === 2 && editingLectureDraft === null);
    assert.equal(await page.evaluate(() => qaPublished[1].find(item => item.id === qaPdfId).slides[1].title), 'Automatically published note');
    assert.equal(await page.evaluate(() => qaPublished.every(document => JSON.stringify(document.find(item => item.id === 'qa-original')) === qaOriginal)), true);
    await page.reload();
    await page.waitForFunction(() => LECTURES.some(item => item.slides.some(slide => slide.title === 'Automatically published note')));
    assert.deepEqual(errors, []);
    console.info('Passed: adding PDF and saving edits publish automatically; cancel does not publish; original notes and reload persist.');
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
