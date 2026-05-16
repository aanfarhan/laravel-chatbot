# Provider `supports_tools` capability flag + runtime fallback

Status: ready-for-agent

## What to build

Make tool support explicit per host deployment so the package degrades cleanly against providers (Ollama, some self-hosted setups) that don't support OpenAI's tool-call protocol.

- Config flag `chatbot.provider.supports_tools` (default `true`). When `false`, the entire tool surface is suppressed: registry is not consulted at message-time, allowlist intersection produces an empty tool list, no `tools` field is sent to the provider, `tool_calls` parsing in the client is skipped.
- Runtime fallback: if the provider responds with an error that maps to "tools not supported" (heuristic by status + message body — at minimum 400-class with strings like "tool", "function", "not supported"), the client strips `tools` from the request and retries once. Warning logged via the existing `LoggerInterface` injection on `StreamCoordinator` / client.
- This is a safety net, not the primary mechanism — hosts are expected to set the flag correctly.

## Acceptance criteria

- [ ] `chatbot.provider.supports_tools` config key documented in README provider section, default `true`
- [ ] When flag is `false`: no `tools` sent to provider, no `tool_calls` parsing attempted, allowlist effectively empty
- [ ] When flag is `true` and provider rejects with a tools-related error: client retries once without `tools`, logs a warning
- [ ] After a runtime fallback, the conversation completes normally (no tool-call loop, model answers from static context only)
- [ ] Unit test: flag-off path skips registry and envelope tool encoding
- [ ] Unit test: simulated "tools unsupported" response from provider triggers exactly one retry without tools
- [ ] `vendor/bin/pint` clean, PHPStan level 9 clean

## Blocked by

- `.scratch/llm-tool-calling/issues/01-tool-call-loop-end-to-end.md`
