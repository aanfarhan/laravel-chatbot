# Per-channel allowlist signed in envelope

Status: done

## What to build

Gate which tools each channel may call. The global registry from #01 is the universe of available tools; the controller declares the subset the current page exposes, signed into the context envelope, enforced server-side. See ADR 0001 for why this is two layers instead of one.

- `Chatbot::tools(['name', ...])` and `ChannelScope::tools([...])` mirror the existing `context()` / `prompt()` surface.
- `ContextEnvelope` mints with an additional `allowed_tools` field (names only, per ADR 0001 — schemas are read live from the registry at message-time). Envelope verification surfaces the allowlist alongside payload/prompt/etc.
- `MessagesController` intersects the verified allowlist with the current registry before assembling tool schemas for the provider call. Anything in the allowlist that no longer resolves is silently omitted from the provider tools list **and**, if the model somehow invokes the missing name, an error tool message is fed back (matches the failure pattern from #01).
- Anything not in the allowlist is invisible to the provider and rejected at invocation with the same error-feedback pattern.

## Acceptance criteria

- [x] `Chatbot::tools([...])` and `ChannelScope::tools([...])` set the per-channel allowlist
- [x] Envelope payload carries `allowed_tools` (names only) and is signature-protected
- [x] `MessagesController` passes only `registry ∩ allowlist` to the LLM client
- [x] Tool call for a name outside the verified allowlist → error tool message fed back, loop continues
- [x] Tool call for an allowed name that no longer resolves in the registry → error tool message fed back
- [x] Tampering with `allowed_tools` in the signed envelope fails verification
- [x] Integration test: two channels with different allowlists see disjoint tool surfaces
- [x] `vendor/bin/pint` clean, PHPStan level 9 clean

## Blocked by

- `.scratch/llm-tool-calling/issues/01-tool-call-loop-end-to-end.md`
