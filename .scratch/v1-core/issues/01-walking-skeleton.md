---
Status: ready-for-agent
---

# Walking skeleton: package scaffold + sync chat

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Stand up the Composer package skeleton so the rest of v1 has somewhere to land. End-to-end: a Pest feature test issues a POST against `/chatbot/messages`, the package routes it to a default `LLMClient`, and a fake reply comes back synchronously (no streaming yet).

Includes:
- Composer package targeting PHP 8.3+, Laravel 11 and 12, MIT license
- Testbench + Pest + PHPStan level 9 (Larastan) + Pint pre-wired so `composer install && vendor/bin/pest` is green on a fresh checkout
- `Chatbot` facade with `context()` and `fake()` working; other methods stubbed
- `LLMClient` interface with `chat()` (sync) and `stream()` (signature only — throws "not implemented" until slice 05). Interface accepts an optional `tools` parameter (always empty in v1) per PRD forward-compat note.
- `OpenAiCompatibleClient` synchronous implementation against the OpenAI wire format
- `FakeClient` with `respondWith()` and a benign canned default that logs a warning when called without a queued reply
- `POST /chatbot/messages` returning a synchronous JSON reply
- Package config (`base_url`, `api_key`, `model`) with defaults `https://api.openai.com/v1` and `gpt-4o-mini`
- GitHub Actions matrix on PHP × Laravel versions, running Pest + PHPStan + Pint

## Acceptance criteria

- [ ] `composer install && vendor/bin/pest` runs green on a fresh checkout
- [ ] Pest feature test: `Chatbot::fake()->respondWith('hi')`, POST to `/chatbot/messages`, response body contains `hi`
- [ ] Pest test exercises `OpenAiCompatibleClient` against a Guzzle MockHandler verifying URL, headers, model, and message-array shape
- [ ] PHPStan level 9 passes
- [ ] `FakeClient` with no queued reply returns a benign canned message and emits a warning log
- [ ] CI matrix runs Pest + PHPStan + Pint and is green

## Blocked by

None - can start immediately
