---
Status: done
---

# Rate limiting + TokenCounter + DailyUsageTracker + quota & authorize callbacks

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Three layered cost controls plus two host-extensible hooks.

**Per-IP / per-user request throttle** — default 20/min, 200/day, configurable per channel. Returns 429 with `retry_after`.

**Per-message input token cap** — default 32K. `TokenCounter` (tiktoken-compatible) measures the assembled prompt pre-call. If oversized, oldest history turns are pruned first; if still oversized after pruning, raise `ChatbotTokenCapExceededException` (typed in slice 07).

**Per-user daily token cap** — default 200K input + 50K output, tracked by `DailyUsageTracker` reading from `chatbot_messages`, scoped by user + channel. Consulted before stream start; updated post-call with authoritative usage from the upstream API. On exhaustion, raise `ChatbotQuotaExceededException`.

**Host callbacks:**
- `Chatbot::quota(callable $resolver)` — called per request, returns `{allow, reason}`. Denied → `ChatbotQuotaExceededException`.
- `Chatbot::authorize(callable $resolver)` — called per request beyond the web guard. Denied → standard 403.

`ChatbotMessageCompleted` event carries `input_tokens`, `output_tokens`, and `model` (hosts ledger costs themselves via this event).

## Acceptance criteria

- [ ] Throttle returns 429 after threshold; threshold configurable per channel
- [ ] Pre-call assembled prompt exceeding cap prunes oldest history turn and re-measures
- [ ] If one turn pair alone exceeds the cap, `ChatbotTokenCapExceededException` raised
- [ ] Daily cap test (frozen clock): 199K input recorded → next 2K passes; 201K → fails with `ChatbotQuotaExceededException`
- [ ] Day boundary resets at UTC midnight
- [ ] `Chatbot::quota()` denying callback raises `ChatbotQuotaExceededException`
- [ ] `Chatbot::authorize()` denying callback returns 403 (no LLM call made)
- [ ] `ChatbotMessageCompleted` event includes `input_tokens`, `output_tokens`, `model`

## Blocked by

- `.scratch/v1-core/issues/04-persistence-and-guest.md`
- `.scratch/v1-core/issues/05-streaming-sse.md`
