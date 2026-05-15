---
Status: ready-for-agent
---

# Streaming SSE + StreamCoordinator + abort + timeouts

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Convert `POST /chatbot/messages` from synchronous JSON to `text/event-stream`. `StreamCoordinator` is the single server-side entry point for streaming flows.

Responsibilities:
- Pull chunks from `LLMClient::stream()`
- Emit normalized SSE events: `token`, `done` (with usage), `error` (with code), `context_summary` (provenance)
- Persist the final message row via `ConversationStore::append`
- Poll `connection_aborted()` between chunks; tear down upstream call on abort so output-token billing stops
- Enforce stream-duration cap (default 60s, configurable)
- Best-effort active-stream counter on cache/Redis (no-op if backing unconfigured) — increments on stream start, decrements on stream end including abort paths

`LLMClient::stream()` now implemented:
- `OpenAiCompatibleClient` — consume upstream `text/event-stream`, normalize chunks
- `FakeClient` — `respondWithStream([chunks])` programs a streamed reply

Timeouts: connection 5s, read 60s without a byte, stream-duration 60s. All configurable.

## Acceptance criteria

- [ ] Feature test: POST a message, consume the SSE stream as event chunks, assert `token` chunks + final `done` with usage
- [ ] Final message row written with assembled content and authoritative usage from upstream
- [ ] Abort test: simulated client disconnect tears down upstream stream (verified via FakeClient)
- [ ] Stream-duration timeout enforced (frozen clock or fast cap)
- [ ] `FakeClient::respondWithStream(['Hel', 'lo', '!'])` produces three `token` events then `done`
- [ ] Active-stream counter increments on start and decrements on every termination path (success, abort, error, timeout)

## Blocked by

- `.scratch/v1-core/issues/01-walking-skeleton.md`
- `.scratch/v1-core/issues/03-prompt-assembler.md`
- `.scratch/v1-core/issues/04-persistence-and-guest.md`
