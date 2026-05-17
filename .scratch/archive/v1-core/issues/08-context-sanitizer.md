---
Status: done
---

# ContextSanitizer + ChatbotSuspiciousContextDetected event

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Recursively walk the context array/object and HTML-entity-escape a documented fail-list of tag-shaped strings:

- `</context>`, `<context>`
- `<system>`, `</system>`
- `<instructions>`, `</instructions>`
- `<assistant>`, `</assistant>`
- `<user>`, `</user>`

The list is configurable via package config so hosts can extend it. Sanitizer runs *before* `PromptAssembler` builds the XML block.

Emits `ChatbotSuspiciousContextDetected` event when any rewrite happens, carrying the offending key path(s) and the rewritten payload — hosts can wire it to a SIEM or review pipeline.

## Acceptance criteria

- [x] Every tag-shape on the documented list is neutralized in test fixtures
- [x] Recursive walk handles nested arrays, nested objects, arrays of objects
- [x] Scalars untouched (numbers, booleans, nulls pass through unchanged)
- [x] Strings with no tag-shapes pass through byte-for-byte
- [x] `ChatbotSuspiciousContextDetected` fires exactly once per request with at least one rewrite, with payload identifying the key path(s)
- [x] End-to-end test: a request whose context contains `</context>` produces sanitized output in the assembled prompt AND fires the event

## Blocked by

- `.scratch/v1-core/issues/03-prompt-assembler.md`
