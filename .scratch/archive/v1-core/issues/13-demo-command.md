---
Status: done
---

# Demo command + seed

## Parent

`.scratch/v1-core/PRD.md`

## What to build

`php artisan chatbot:demo` — scaffolds a working demo route + seed data using `FakeClient`, so a developer can see the widget animation and flow without burning an API key.

- Scaffolds `GET /chatbot/demo` showing a fake "order" page with `Chatbot::context(['order' => ...])`
- Seeds a small fixture for the demo
- Binds `LLMClient` to `FakeClient` programmed with a few canned streamed replies
- All demo artifacts (routes, seed, binding) gated behind `chatbot.demo.enabled` config flag, **off by default**
- Command prints the demo URL and a reminder to disable in production
- Warns when production env is detected

## Acceptance criteria

- [ ] `chatbot:demo` runs on a fresh Testbench app and the demo URL renders the widget
- [ ] Sending a message in the demo widget produces a streamed canned reply
- [ ] With `chatbot.demo.enabled = false`, the demo route returns 404 (no leaks to production)
- [ ] Command emits a warning when `APP_ENV=production`
- [ ] Demo command is re-runnable without error (idempotent seed)

## Blocked by

- `.scratch/v1-core/issues/01-walking-skeleton.md`
- `.scratch/v1-core/issues/11-web-component-widget.md`
