/** Synthetic lectures on an isolated local origin; production is never modified. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');
const origin = 'http://127.0.0.1:4215';

async function paste(page, data) {
  await page.locator('#edit-text-content').evaluate((editor, values) => {
    editor.focus();
    const clipboardData = new DataTransfer();
    for (const [type, value] of Object.entries(values)) clipboardData.setData(type, value);
    editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  }, data);
}

async function add(page, position) {
  await page.locator(`[aria-controls="slide-insert-menu-${position}"]`).click();
  await page.locator(`[data-ins-type="text"][data-ins-pos="${position}"]`).click();
}

(async () => {
  const server = fork(path.join(__dirname, 'preview-server.cjs'), { env: { ...process.env, MEE101_QA_PORT: '4215' }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin || route.request().url().startsWith('data:') ? route.continue() : route.abort());
    await page.goto(origin);
    await page.waitForFunction(() => typeof insertTextSlideAt === 'function');
    await page.evaluate(async () => {
      isAdminAuthenticated = true;
      LECTURES.splice(0, LECTURES.length,
        { id: 'qa-text', week: 'QA', title: 'Mixed', description: 'Synthetic mixed lecture', features: [], custom: { keep: true }, slides: [
          { title: 'First', html: '<p data-keep="yes">Original notes</p>', pptSummaryBullets: ['Original'], custom: 42 },
          { ...HtmlSlides.create('QA'), title: 'Existing HTML', htmlDocument: '<h1>Original HTML</h1>' }
        ] },
        { id: 'qa-other', title: 'Unrelated', week: 'QA', description: 'Synthetic other lecture', features: [], slides: [{ title: 'Other', html: '<p>Keep me</p>' }], ratings: [5] });
      await saveAllLecturesToStorage();
      sessionStorage.setItem('qa-before', JSON.stringify(LECTURES));
      openEditLectureModal('qa-text');
    });
    // Opening and cancelling after typing must preserve the complete original record.
    await add(page, 1);
    await page.locator('#edit-text-content').fill('Cancelled content');
    await page.locator('#btn-cancel-edit-lecture').click();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem('qa-before')), true);
    await page.reload();
    await page.waitForFunction(() => LECTURES[0]?.id === 'qa-text');
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem('qa-before')), true);
    await page.evaluate(() => { isAdminAuthenticated = true; openEditLectureModal('qa-text'); });
    await add(page, 1);
    await page.locator('#edit-slide-title').fill('Text and table');
    const editor = page.locator('#edit-text-content');
    await editor.fill('Türkçe açıklama ve mühendislik');
    await editor.press('End');
    await editor.press('Enter');
    await page.locator('[name="rows"]').fill('2');
    await page.locator('[name="columns"]').fill('2');
    await page.locator('[data-table="insert"]').click();
    assert.equal(await editor.locator('tr').count(), 2);
    await editor.locator('td').first().fill('Malzeme');
    await editor.locator('td').nth(1).fill('Çelik');
    await editor.locator('td').first().click();
    await page.locator('[data-table="row"]').click();
    assert.equal(await editor.locator('tr').count(), 3);
    await editor.locator('td').first().click();
    await page.locator('[data-table="column"]').click();
    assert.equal(await editor.locator('td').count(), 9);
    // Cursor restoration after editing dimensions must retain text and table location.
    assert.match(await editor.textContent(), /Türkçe açıklama/);
    await editor.press('Control+End');
    await paste(page, { 'text/plain': 'Deney\tSonuç\nA\t42' });
    assert.equal(await editor.locator('table').count(), 2);
    await editor.press('Control+End');
    await paste(page, { 'text/html': '<p onclick="evil()"><b>Word metni</b></p><table><tr><th>Başlık</th><td>Değer</td></tr></table><img src=x onerror="evil()"><script>evil()</script>' });
    assert.equal(await editor.locator('table').count(), 3);
    assert.equal(await editor.locator('script,img,[onclick]').count(), 0);
    const preview = page.frameLocator('#edit-live-preview-stage iframe');
    await preview.locator('h1').filter({ hasText: 'Text and table' }).waitFor();
    await preview.locator('td').filter({ hasText: '42' }).waitFor();
    // Switching slides commits the draft; an unchanged save must preserve every record.
    await page.evaluate(() => { commitCurrentSlideFormToDraft(); loadSlideIntoEditForm(0); loadSlideIntoEditForm(1); });
    assert.equal(await editor.locator('table').count(), 3);
    await page.locator('#btn-save-edit-lecture').click();
    await page.waitForFunction(() => editingLectureDraft === null, null, { timeout: 5000 }).catch(async error => { console.error(await page.locator('#edit-save-feedback').textContent(), errors); throw error; });
    assert.equal(await page.evaluate(() => {
      const before = JSON.parse(sessionStorage.getItem('qa-before'));
      return JSON.stringify(LECTURES[0].slides.filter((_, i) => i !== 1)) === JSON.stringify(before[0].slides) &&
        JSON.stringify(LECTURES[1]) === JSON.stringify(before[1]) && LECTURES[0].custom.keep;
    }), true);
    await page.evaluate(() => sessionStorage.setItem('qa-saved', JSON.stringify(LECTURES)));
    await page.reload();
    await page.waitForFunction(() => LECTURES[0]?.slides.length === 3);
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem('qa-saved')), true);
    await page.evaluate(() => { isAdminAuthenticated = true; openEditLectureModal('qa-text', 1); });
    assert.equal(await editor.locator('table').count(), 3);
    await page.locator('#btn-save-edit-lecture').click();
    await page.waitForFunction(() => editingLectureDraft === null);
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem('qa-saved')), true);
    await page.evaluate(() => { openLecture('qa-text', true); currentSlideIndex = 1; updateActiveSlide(); });
    const active = page.frameLocator('.active-slide iframe');
    await active.locator('h1').filter({ hasText: 'Text and table' }).waitFor();
    assert.equal(await active.locator('table').count(), 3);
    for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await active.locator('.page').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await active.locator('.page').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
      }), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.setViewportSize({ width: 1366, height: 900 });
    require('node:fs').mkdirSync('.jtmp', { recursive: true });
    await page.screenshot({ path: '.jtmp/text-table-slide.png' });
    await page.evaluate(() => { exitPresentationMode(); openEditLectureModal('qa-text', 1); });
    await page.screenshot({ path: '.jtmp/text-table-editor.png' });
    await editor.locator('td').first().click();
    await page.locator('[data-table="remove"]').click();
    assert.equal(await editor.locator('table').count(), 2);
    await page.locator('#btn-cancel-edit-lecture').click();
    assert.equal(await page.evaluate(() => JSON.stringify(LECTURES) === sessionStorage.getItem('qa-saved')), true);
    assert.deepEqual(errors, []);
    console.info('Passed: direct text, table insertion/editing, row/column growth, TSV/Word paste sanitation, exact insertion, cancel/save/reload/reopen parity, existing records, preview, presentation and three screen sizes.');
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
