---
Status: done
---

# Typed exceptions + SSE error events + partial-message persistence

## Parent

`.scratch/v1-core/PRD.md`

## What to build

A typed exception hierarchy under a base `ChatbotException`:
- `ChatbotProviderException` — upstream provider error
- `ChatbotTimeoutException` — read or stream-duration timeout
- `ChatbotContentBlockedException` — provider content filter
- `ChatbotTokenCapExceededException` — per-message input cap (raised in slice 09)
- `ChatbotQuotaExceededException` — per-user daily cap or host quota-callback denial (raised in slice 09)
- `ChatbotConfigurationException` — misconfigured channel / missing API key

SSE endpoint boundary catches each and emits `{type: 'error', code, message, retryable}` events. The widget will render code-appropriate UI in slice 11; the server-side contract lands here.

Every failure writes an assistant `chatbot_messages` row with `content = partial-or-empty` and `error = {code, message}` JSON, preserving audit trail and any partial reply.

Hosts can catch typed exceptions from their normal Laravel exception handler for non-SSE code paths (CLI commands, queue jobs).

No server-side automatic retry. Regenerate is a client-driven affordance (slice 11).

## Acceptance criteria

- [ ] Each exception type maps to a distinct `code` in the SSE error event
- [ ] Partial-stream interruption writes an assistant row with `content` = chunks-so-far and `error` set
- [ ] Provider returning 429 raises `ChatbotProviderException` with `retryable=true`
- [ ] Read timeout raises `ChatbotTimeoutException`
- [ ] Missing api_key raises `ChatbotConfigurationException` on first call
- [ ] Each exception bubbles to the host's Laravel exception handler when no SSE response is in flight

## Blocked by

- `.scratch/v1-core/issues/05-streaming-sse.md`
