---
Status: done
---

# Per-route greeting, prompt, summary

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Three facade methods that flow through the envelope and the assembled prompt, and that the widget will render in slice 11.

- `Chatbot::prompt(string $prompt)` — per-route system-prompt addition. Inserted at the per-route layer of `PromptAssembler`.
- `Chatbot::greeting(string $greeting)` — per-route opening greeting. Carried in the envelope; widget renders as the first assistant bubble before the user types.
- `Chatbot::summary(callable|string $summary)` — per-route provenance summary (e.g. "Answering about order #1234"). Emitted as the SSE `context_summary` event preceding each assistant reply.

Each is chainable on `Chatbot` and on `Chatbot::channel(...)` scopes. Per-channel defaults exist in config; per-route declarations win.

## Acceptance criteria

- [x] `Chatbot::prompt(...)` text appears in the assembled prompt at the per-route layer (snapshot test)
- [x] `Chatbot::greeting(...)` is carried in the envelope; rehydrate endpoint returns it before any persisted messages
- [x] `Chatbot::summary(...)` callable is evaluated per request; string passed through unchanged
- [x] SSE flow emits `context_summary` event before the first `token` event
- [x] Channel default greeting used when per-route greeting not declared
- [x] Channel default summary callable used when per-route summary not declared

## Blocked by

- `.scratch/v1-core/issues/03-prompt-assembler.md`
- `.scratch/v1-core/issues/06-channels.md`
