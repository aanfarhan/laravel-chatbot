---
Status: ready-for-agent
---

# Signed context envelope

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Add the `ContextEnvelope` deep module so context can travel from server to client and back without being forgeable. The widget POSTs the envelope alongside each message; the server verifies before using it.

Public surface:
- `ContextEnvelope::mint(payload, user_id_or_null, route, channel = 'default', expires_at): string`
- `ContextEnvelope::verify(token): Envelope` — throws on tamper / expiry / mismatch
- Blade directive `@chatbot` that renders the signed envelope into the page (and a placeholder web component tag — actual widget arrives in slice 11)

Envelope binds `(user_id_or_null, channel, route, context_payload, expires_at, version)`. HMAC with the Laravel app key. Internal encoding may change in minor releases; the public surface is the two methods above.

Wire `POST /chatbot/messages` to require a `signed_context` field and verify it before using the payload.

Provide a test helper that extracts the envelope from a rendered response so feature tests don't have to re-implement the plumbing.

## Acceptance criteria

- [ ] Round-trip mint/verify works
- [ ] Tampered token rejected
- [ ] Expired token rejected
- [ ] Token minted for user A rejected when posted as user B
- [ ] Token minted for route X rejected when posted from route Y
- [ ] Token minted for channel A rejected when posted to channel B (verifier supports channel even though channels aren't fully wired until slice 06)
- [ ] Mismatched envelope `version` rejected
- [ ] Blade directive renders a token tied to current route + auth state
- [ ] Test helper exposes the envelope from a rendered Blade response

## Blocked by

- `.scratch/v1-core/issues/01-walking-skeleton.md`
