# Live startup measurements — 2026-10-24

Site: https://aserdargl.github.io/ME101/
Application revision: `b3da512`.

Two consecutive series of five cold visits and five warm revisits, using actual
GitHub Pages, Google Fonts and Firebase SDK responses. Edge headless, 1280 × 900,
no simulated latency, independent unsigned browser context per cold/warm pair.
The warm revisit retains that context's normal HTTP cache. No seeded lectures,
accounts, clicks, imports, resets or writes to production records.

| Measurement | Cold visit | Warm revisit |
| --- | ---: | ---: |
| Catalog ready, median | 667.5 ms | 80.5 ms |
| Catalog ready, range | 365–776 ms | 72–86 ms |
| First contentful paint, median | 616 ms | 88 ms |
| First server response, median | 376.5 ms | 10 ms |
| Observed main-thread long-task time | 0 ms | 0 ms |

Catalog samples (ms):

- Cold: 399, 776, 768, 645, 690, 414, 365, 690, 710, 375.
- Warm: 72, 80, 86, 85, 83, 78, 86, 77, 79, 81.

No page errors, failed requests or attempted write requests occurred. The second
series additionally checked completion of the asynchronous font stylesheet,
loaded font faces and the access-service status. Inter, JetBrains Mono and
Source Serif 4 loaded successfully; the access service reached its normal
unsigned visitor state. No synthetic timing responses were used in either series.

This run found no further application stall requiring a production change.
Cold timing varied with real network/server response time. These visitor
measurements cover empty, unsigned browser contexts; they do not represent the
contents or performance of a particular person's existing browser profile.
All application files, presentation styles and published `data/` remain unchanged.

Reproduce with `PLAYWRIGHT_MODULE` set to Playwright's module location:
`node tests/live-startup.cjs`. The tool records navigation/paint/resource timings
and prevents non-read HTTP requests through CDP while preserving normal cache
behavior. It does not seed or modify production data.
