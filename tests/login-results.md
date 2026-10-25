# Login verification — 2026-10-25

Baseline: `c9f455c`. The previous startup benchmark covered unsigned visitors,
not completion of an instructor login.

The real adapter and service previously read the same administrator document
three times and started the same roster/application subscriptions twice. The
SDK auth callback and explicit sign-in now share one verification. The service
still checks verified email and a fresh server administrator document, and the
publishing service independently authorizes its session and every write.
Firebase modules preload from the document head instead of waiting for the
application bundle to execute.

Matched localhost Edge headless runs with synthetic accounts and SDK responses:
500 ms SDK delivery, 250 ms bundle delivery, 100 ms password exchange, 250 ms
role reads and 150 ms publishing verification. External production services are
blocked; no real account credentials or student data are used.

| Measurement | Before | After |
| --- | ---: | ---: |
| Instructor UI ready from navigation | 1656 ms | 1073 ms |
| Submit to completed login UI | 1233 ms | 684 ms |
| Server role reads per login | 3 | 1 |
| Roster/application subscriptions started | 6 | 3 |

These are controlled comparison measurements, not real-account login timings.
Run `node tests/login-browser.cjs` with `PLAYWRIGHT_MODULE` configured. The
adapter/service tests also cover missing roles, unverified email and logout
during verification. Synthetic notes and personal settings remain unchanged.
No storage keys, saved documents, published `data/`, layouts or hosting change.
