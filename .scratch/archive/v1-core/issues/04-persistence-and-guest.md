---
Status: done
---

# Persistence: conversations, messages, cookie, rehydrate, guest flow

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Two tables, a domain store, conversation cookie wiring, history rehydrate endpoint, and the guest-conversation flow.

**`chatbot_conversations`**: id, optional `user_id`, optional `guest_token`, `channel`, lifecycle timestamps, aggregate input/output token counts, aggregate cost cents, soft-delete column.

**`chatbot_messages`**: id, FK to conversation, role (`user`/`assistant`), content, input/output tokens, cost cents, created_at, optional error JSON, **`route_name` and `context_hash` per message** (not on the conversation — context changes mid-conversation as the user navigates).

`ConversationStore` interface with domain methods (`find`, `start`, `append`, `forUser`, `delete`, `anonymize`, `export`) and an Eloquent implementation. All other slices depend on this interface, not on Eloquent.

Conversation cookie `chatbot_conversation_{channel}` scoped to package route prefix. Idle reset after configurable window (default 24h since last message).

Guest flow: signed HTTP-only `chatbot_guest_id` cookie scoped to the package route prefix, used to stitch guest conversations across requests. `ConversationStore::start()` accepts either user_id or guest_token.

`GET /chatbot/conversations/{id}/messages` rehydrates history. Authorization: the conversation row must match the requester's user_id OR guest_token.

Context payload is NOT persisted — only the hash, route, and per-message text content.

## Acceptance criteria

- [x] Migrations create the two tables matching the contract above
- [x] `ConversationStore` round-trip: start, append (user + assistant), find
- [x] Per-message `route_name` and `context_hash` populated on append
- [x] Conversation cookie set on first turn and reused on second turn (same channel)
- [x] Idle reset starts a new conversation after the configured idle window
- [x] Guest cookie signed and HTTP-only; rehydrate denies a different guest token
- [x] Rehydrate denies cross-user access (user A token → conversation owned by user B)
- [x] Soft-deleted conversations excluded from `find`

## Blocked by

- `.scratch/v1-core/issues/01-walking-skeleton.md`
- `.scratch/v1-core/issues/02-signed-context-envelope.md`
