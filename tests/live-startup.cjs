/** Passive live measurements in disposable, unsigned browser contexts. No test data or clicks. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const target = process.env.LIVE_STARTUP_URL || 'https://aserdargl.github.io/ME101/';
const runs = Number(process.env.LIVE_STARTUP_RUNS || 5);

async function measure(page, label) {
  await page.goto(target, { waitUntil: 'load' });
  await page.waitForFunction(() => /^\d+$/.test(document.getElementById('catalog-lecture-count')?.textContent || '') &&
    !/loading|yükleniyor/i.test(document.getElementById('cloud-status-text')?.textContent || 'loading'));
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.querySelector('link[href^="https://fonts.googleapis.com/css2"]')?.rel === 'stylesheet');
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate(label => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      label, ttfbMs: Math.round(navigation.responseStart),
      fcpMs: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0),
      catalogMs: Math.round(window.startupMeasurement.catalogMs),
      lcpMs: Math.round(window.startupMeasurement.lcpMs || 0),
      domReadyMs: Math.round(navigation.domContentLoadedEventEnd), loadMs: Math.round(navigation.loadEventEnd),
      longTasksMs: Math.round(window.startupMeasurement.longTasksMs),
      fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
      accessStatus: document.getElementById('roster-sync-status')?.textContent,
      resources: performance.getEntriesByType('resource').map(entry => ({
        url: entry.name.replace(/\?.*/, ''), startMs: Math.round(entry.startTime),
        ms: Math.round(entry.duration), bytes: entry.transferSize, protocol: entry.nextHopProtocol
      })).sort((a, b) => b.ms - a.ms)
    };
  }, label);
  return result;
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const samples = [];
  try {
    for (let run = 0; run < runs; run++) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = [], blockedWrites = [], failedRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => failedRequests.push({ url: request.url().replace(/\?.*/, ''), error: request.failure()?.errorText }));
      // CDP interception preserves the normal HTTP cache for the warm reload.
      const session = await context.newCDPSession(page);
      await session.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
      session.on('Fetch.requestPaused', async event => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(event.request.method)) {
          blockedWrites.push({ method: event.request.method, url: event.request.url.replace(/\?.*/, '') });
          await session.send('Fetch.failRequest', { requestId: event.requestId, errorReason: 'BlockedByClient' });
        } else await session.send('Fetch.continueRequest', { requestId: event.requestId });
      });
      await page.addInitScript(() => {
        window.startupMeasurement = { catalogMs: 0, lcpMs: 0, longTasksMs: 0 };
        new PerformanceObserver(list => list.getEntries().forEach(entry => { window.startupMeasurement.lcpMs = entry.startTime; }))
          .observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => list.getEntries().forEach(entry => { window.startupMeasurement.longTasksMs += entry.duration; }))
          .observe({ type: 'longtask', buffered: true });
        new MutationObserver(() => {
          if (!window.startupMeasurement.catalogMs && /^\d+$/.test(document.getElementById('catalog-lecture-count')?.textContent || '')) {
            requestAnimationFrame(() => requestAnimationFrame(() => { window.startupMeasurement.catalogMs ||= performance.now(); }));
          }
        }).observe(document, { childList: true, subtree: true });
      });
      samples.push(await measure(page, 'cold'));
      samples.push(await measure(page, 'warm'));
      console.info(JSON.stringify({ run: run + 1, samples: samples.slice(-2), errors, failedRequests, blockedWrites }));
      await context.close();
    }
    console.info(JSON.stringify({ summary: ['cold', 'warm'].map(label => ({ label,
      ...Object.fromEntries(['ttfbMs', 'fcpMs', 'catalogMs', 'lcpMs', 'domReadyMs', 'loadMs', 'longTasksMs'].map(key =>
        [key, median(samples.filter(sample => sample.label === label).map(sample => sample[key]))]))
    })) }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
