---
Status: done
---

# SECURITY.md + threat model + inspect-prompt command + host-responsibility docs

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Two deliverables — one CLI tool, one set of docs — that together document and operationalize the v1 security posture.

**1. `chatbot:inspect-prompt --route=...`** — dumps the assembled prompt for a route, so a security engineer can review what's actually being sent to the LLM during pen-testing.
- Flags: `--route=<name>` (required), `--user=<id>` (optional), `--channel=<name>` (optional), `--context-json=<path>` (optional — injects sample context)
- Output: the full message array as the LLM would receive it, with the XML context block expanded

**2. Docs:**

`SECURITY.md` at repo root:
- **Defended**: forgery/replay (envelope), basic tag-shape injection (sanitizer), bot-output XSS (DOMPurify allowlist), worker exhaustion (timeouts/abort)
- **NOT defended**: sophisticated prompt injection, post-render content drift, base64-encoded payloads, two-pass content classification, automatic retry / model fallback
- **Host responsibilities**: privacy policy, subprocessor disclosure, retention decisions, dollar-cost governance, vendor integrations

README sections:
- Theming surface: CSS custom properties (with examples) and CSS parts (with examples) — the v1 stable customization API
- Four-week shipping order summary (mirroring the PRD)
- SemVer commitments: what's contract (facade signatures, config keys, SSE event shape, envelope shape, web component attributes, CSS API, event class names, exception hierarchy) vs internal (DB schema via migrations, base prompt content, HMAC encoding)

## Acceptance criteria

- [ ] `chatbot:inspect-prompt --route=orders.show` produces a readable dump of the assembled prompt
- [ ] Sample context injected via `--context-json` is reflected in the dump
- [ ] `--user=<id>` and `--channel=<name>` modify the dump accordingly
- [ ] `SECURITY.md` exists at repo root and covers defended / not-defended / host-responsibility sections
- [ ] README documents every CSS custom property with usage example
- [ ] README documents CSS parts with `::part(...)` usage example
- [ ] README documents the SemVer contract / internal split

## Blocked by

- `.scratch/v1-core/issues/03-prompt-assembler.md`
