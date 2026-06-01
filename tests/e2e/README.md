# End-to-end tests

Playwright specs that drive the widget against a live Testbench app. These complement the in-process `vitest` suite by exercising real Shadow DOM rendering against a real SSE stream from the PHP backend.

## One-time setup

```bash
composer install
npm install
npx playwright install chromium
```

## Run

```bash
npm run test:e2e
```

That script rebuilds the widget bundle (`vite build` → `dist/chatbot-widget.js`, which `/chatbot/widget.js` serves), then runs Playwright. Playwright's `webServer` block boots `vendor/bin/testbench serve` on port `8765` (override with `CHATBOT_E2E_PORT`) with `CHATBOT_PLAYWRIGHT_FIXTURE=1`, and a global setup step migrates a file-backed SQLite database at `tests/e2e/e2e.sqlite` so per-request boots share state.

## Determinism

Specs that need to observe the pre-first-chunk window intercept `POST /chatbot/messages` via `page.route` and hold the response open until the assertion runs, so we don't race the FakeClient's instant chunks.
