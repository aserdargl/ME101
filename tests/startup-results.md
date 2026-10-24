# Startup verification — 2026-10-24

Baseline: `b66ec45` (including the latest roster changes).

Matched local Edge headless runs on an isolated HTTP origin, empty browser cache,
100 ms delay per local asset, 700 ms for external bootstrap requests, 80 synthetic
slides containing about 3.2 MB of notes and embedded images. Five independent
browser contexts per version; values below are medians.

| Measurement | Before | After |
| --- | ---: | ---: |
| Catalog ready after two animation frames | 947 ms | 346 ms |
| First contentful paint | 924 ms | 316 ms |
| DOMContentLoaded | 902 ms | 298 ms |

These are controlled comparison measurements, not production-user timing claims.
External font CSS is stubbed during timing to keep network conditions identical.

Verification passed:

- 38 application tests and generated-bundle consistency check.
- Opening/cancelling/saving/reloading retains the complete synthetic lecture JSON,
  embedded images, custom fields, stored roster, ratings and personal settings.
- ZIP is absent at startup; the locally hosted JSZip 3.10.1 successfully imports
  the existing synthetic PPTX fixture when requested.
- Catalog screenshots match exactly before/after, including a separate check
  with the real Google Fonts styles and fonts loaded.
- `data/` and all presentation stylesheets are unchanged.

Run `STARTUP_BEFORE=1 node tests/startup-performance.cjs` for the baseline and
`STARTUP_VERIFY=1 node tests/startup-performance.cjs` for the current version.
Set `PLAYWRIGHT_MODULE` and install the existing development dependencies first.
Use `STARTUP_REAL_FONTS=1` for the additional font-loaded screenshot check.
