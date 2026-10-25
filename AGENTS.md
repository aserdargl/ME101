# Working agreements

- Preserve all existing lecture notes, slides, uploaded assets, student data, ratings, and user settings during every change.
- For visual changes, modify presentation files only. Do not replace course content, change storage keys, clear browser storage, migrate data, or reset lectures.
- Run browser tests on a separate local origin with synthetic data. Never create, edit, delete, import, or reset data on the live site for testing.
- Verify that existing data survives opening, cancelling, saving, and reloading the editor when changing editing behavior. Use isolated test data only.
- Keep the existing GitHub Pages address and preserve the compact vertical lecture list.
- Host the site and shared lecture content on GitHub only. Do not introduce Netlify or another hosting/storage service without an explicit user request.
- Published notes live under `data/`. Fetch the latest remote before source edits; retain these files and never force-push over published content.

- Always publish completed website updates: run appropriate checks, commit and push to the existing GitHub Pages publication branch, and verify the live deployment before reporting completion. Do not leave completed changes unpublished. Preserve remote changes and published data; report any real publication blocker explicitly.
