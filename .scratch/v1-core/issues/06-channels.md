---
Status: done
---

# Named channels

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Mirror the Laravel mail/cache driver idiom. A `default` channel is required. Additional channels (e.g. `admin`) layer on the defaults with per-channel overrides for model, system prompt, throttle, token caps, retention, greeting, and quota callback.

API:
- `Chatbot::channel('admin')->context([...])` — returns a per-channel facade scope, chainable with `context()` / `prompt()` / `greeting()` / `summary()`
- Single-channel apps never mention channels — everything defaults to `default`
- Config: nested per-channel array under `chatbot.channels.{name}`, falling back to top-level keys for unset values

Envelope binding: the signed envelope records which channel it was minted for. Envelope/widget channel mismatch is rejected by the verifier (the verify call already accepts channel from slice 02 — this slice wires channel into mint calls from the right scope).

Conversation cookie is already per-channel (`chatbot_conversation_{channel}` from slice 04). Verify it stays scoped here.

Web component reads a `channel` attribute from the placeholder tag rendered by the Blade directive; full widget consumption arrives in slice 11.

## Acceptance criteria

- [x] Two channels configured with different models; each routed to the correct upstream model
- [x] Two channels' conversations don't bleed across (separate cookies, separate rehydrate)
- [x] Channel-A envelope rejected when posted to channel B
- [x] `Chatbot::channel('admin')->context([...])` and `Chatbot::context([...])` produce different envelopes when both are declared on the same request
- [x] Per-channel system prompt appears in the assembled prompt at the channel-default layer
- [x] Apps that never call `channel(...)` continue to work unchanged (no regressions)

## Blocked by

- `.scratch/v1-core/issues/02-signed-context-envelope.md`
- `.scratch/v1-core/issues/03-prompt-assembler.md`
- `.scratch/v1-core/issues/04-persistence-and-guest.md`
