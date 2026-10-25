/* Measures editing and durable saves with synthetic data on a disposable origin. */
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');
const origin = 'http://127.0.0.1:4194';

(async () => {
  const server = fork(path.join(__dirname, 'preview-server.cjs'), { env: { ...process.env, MEE101_QA_PORT: '4194' }, silent: true });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin);
    await page.waitForFunction(() => typeof openEditLectureModal === 'function');
    const metrics = await page.evaluate(async () => {
      isAdminAuthenticated = true;
      const slides = Array.from({ length: 60 }, (_, i) => {
        const image = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#397c64"/><!--${'x'.repeat(400000)}-${i}--></svg>`);
        return { title: `Slide ${i}`, kicker: 'QA', html: `<p class="lead">Original explanation ${i}</p><img src="${image}"/>`,
          sourceSlideVisual: image, sourceSlideRatio: '16/9', extractedImages: [image], pptSummaryBullets: ['Saved bullet'], custom: { keep: i } };
      });
      LECTURES.splice(0, LECTURES.length, { id: 'qa-editor-speed', title: 'Synthetic large lesson', week: 'QA', description: 'Keep', slides });
      window.qaEditorOriginal = LectureDocument.snapshot(LECTURES);
      const start = performance.now();
      openEditLectureModal('qa-editor-speed');
      const openMs = performance.now() - start;
      const switchStart = performance.now();
      commitCurrentSlideFormToDraft();
      loadSlideIntoEditForm(59, false);
      const switchMs = performance.now() - switchStart;
      closeEditLectureModal();
      if (LECTURES[0].slides[0].html !== qaEditorOriginal[0].slides[0].html) throw Error('Cancel changed original');
      openEditLectureModal('qa-editor-speed');
      const typingStart = performance.now();
      const field = document.getElementById('edit-slide-title');
      for (let i = 0; i < 15; i++) { field.value = `Edited title ${i}`; field.dispatchEvent(new Event('input')); }
      const typingMs = performance.now() - typingStart;
      const saveStart = performance.now();
      document.getElementById('btn-save-edit-lecture').click();
      while (editingLectureDraft && performance.now() - saveStart < 30000) await new Promise(resolve => setTimeout(resolve, 10));
      if (editingLectureDraft) throw Error('Save did not finish within 30 seconds');
      const saveMs = performance.now() - saveStart;
      const stored = await LectureStorage.load();
      if (stored[0].slides[0].title !== 'Edited title 14' || stored[0].slides.length !== 60) throw Error('Saved edit lost');
      for (let i = 0; i < 60; i++) {
        if (stored[0].slides[i].html !== qaEditorOriginal[0].slides[i].html || stored[0].slides[i].sourceSlideVisual !== qaEditorOriginal[0].slides[i].sourceSlideVisual || stored[0].slides[i].custom.keep !== i) throw Error('Assets or metadata lost');
      }
      return { slides: 60, embeddedMediaMb: 24, openMs, switchMs, typingMs, saveMs };
    });
    const nativeMetrics = await page.evaluate(async () => {
      const file = new File([await (await fetch('/fixture.pptx')).arrayBuffer()], 'fixture.pptx');
      const slides = await PptxImport.parse(file, 'QA', 'Native');
      LECTURES.splice(0, LECTURES.length, { id: 'qa-native-editor', title: 'Native', week: 'QA', slides });
      openEditLectureModal('qa-native-editor');
      await new Promise(resolve => setTimeout(resolve, 150));
      const stage = document.getElementById('edit-live-preview-stage');
      const original = stage.firstElementChild;
      let replacements = 0;
      const observer = new MutationObserver(records => { replacements += records.filter(item => item.target === stage).length; });
      observer.observe(stage, { childList: true });
      const start = performance.now();
      for (let i = 0; i < 12; i++) {
        document.getElementById('edit-slide-title').value = 'New ' + i;
        document.getElementById('edit-slide-title').dispatchEvent(new Event('input'));
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      observer.disconnect();
      const result = { nativeTypingMs: performance.now() - start, replacements, previewRetained: original === stage.firstElementChild };
      const originalToken = PptxDisplay.visualFor(slides[0]).token;
      const replacement = new File([await (await fetch('/math-fixture.pptx')).arrayBuffer()], 'replacement.pptx');
      editingLectureDraft.pptxUrl = URL.createObjectURL(replacement);
      if (!await PptxDisplay.prepareLecture(editingLectureDraft)) throw Error('Changed PPTX was not refreshed');
      updateEditLivePreview();
      if (PptxDisplay.visualFor(editingLectureDraft.slides[0]).token === originalToken) throw Error('New source reused a stale image binding');
      if (PptxDisplay.visualFor(slides[0]).token !== originalToken) throw Error('Draft source change altered original display');
      if (stage.firstElementChild === original) throw Error('New source did not refresh its preview');
      closeEditLectureModal();
      return result;
    });
    assert.equal(nativeMetrics.previewRetained, true);
    assert.equal(nativeMetrics.replacements, 0);
    console.info(JSON.stringify(nativeMetrics));
    await page.reload();
    await page.waitForFunction(() => typeof LECTURES !== 'undefined' && LECTURES[0]?.slides[0]?.title === 'Edited title 14');
    assert.deepEqual(errors, []);
    console.info(JSON.stringify({ ...metrics, reloadPreserved: true }));
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
