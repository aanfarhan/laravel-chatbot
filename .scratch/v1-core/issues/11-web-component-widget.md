---
Status: done
---

# Web component widget (core UX + theming + markdown + polish)

## Parent

`.scratch/v1-core/PRD.md`

## What to build

The user-facing widget, distributed as a pre-built ESM bundle plus a CSS file in `dist/`. Vite library mode for the JS bundle, Vitest for unit tests. Built artifacts committed; CI verifies `dist/` is fresh on each release.

**Web Component**: `<chatbot-widget>` with attributes `channel`, `position` (`bottom-right` | `bottom-left` | `inline`), `title`.

**Core UX**:
- Launcher button + panel with header, scrolling messages, input, send, "New chat"
- Token streaming from the SSE endpoint into the active assistant bubble
- Markdown rendering on every streamed chunk (not only final)
- Per-message affordances: copy, regenerate, thumbs-up / thumbs-down. Rating POSTs to a new package endpoint that fires `ChatbotMessageRated` server-side.
- Mobile: full-screen panel under a configurable breakpoint
- Open/closed state persisted in cookie/localStorage; survives reload
- Greeting from slice 10 rendered as first assistant message
- `context_summary` rendered above each assistant reply

**Internal modules (Vitest-unit-tested):**
- `SSEClient` — pure state machine consuming SSE bytes; emits `chunk` / `error` / `done` / `context_summary`. No DOM dependency.
- `MarkdownRenderer` — `marked` + `DOMPurify` with the documented allowlist: blocks `<script>`, inline event handlers, `javascript:` URLs, images by default; rewrites external links with `rel="noopener noreferrer" target="_blank"`. Incremental sanitize per chunk.

**Customization surface** (the v1 stable API):
- CSS custom properties: `--chatbot-primary`, `--chatbot-on-primary`, `--chatbot-surface`, `--chatbot-on-surface`, `--chatbot-radius`, `--chatbot-font`, `--chatbot-shadow`, `--chatbot-z-index`
- CSS parts: `launcher`, `header`, `messages`, `message-user`, `message-assistant`, `input`, `send-button`, (and others as needed by the implementation)

**Error rendering**: each SSE error code from slice 07 maps to a UI affordance — retry button for retryable=true, quota message for caps, refusal message for content blocks. Mid-stream disconnect preserves partial reply with a retry option.

Slot-based / full-template-override customization is out of scope for v1.

## Acceptance criteria

- [ ] `dist/` contains pre-built ESM bundle + CSS file
- [ ] CI step verifies `dist/` is up-to-date with source
- [ ] Vitest: SSEClient state machine — connect, chunks, error, done, abort, malformed-chunk recovery
- [ ] Vitest: MarkdownRenderer — every blocked construct rejected, every allowed one rendered, link rewrite verified, incremental render output matches final-only render
- [ ] Launcher renders; click opens panel
- [ ] Sending a message issues a POST with the envelope from the rendered page
- [ ] Tokens stream into the message bubble
- [ ] Copy / regenerate / thumbs-up / thumbs-down all functional
- [ ] Rating fires `ChatbotMessageRated` server-side with correct message id + value
- [ ] Mobile breakpoint: full-screen panel
- [ ] Open/closed state survives reload
- [ ] Greeting renders as first message before any user input
- [ ] `context_summary` rendered above each assistant reply
- [ ] Each error code from slice 07 produces the correct UI affordance
- [ ] CSS custom properties documented with examples; theming verified on a fixture page

## Blocked by

- `.scratch/v1-core/issues/05-streaming-sse.md`
- `.scratch/v1-core/issues/07-typed-exceptions.md`
- `.scratch/v1-core/issues/10-per-route-overrides.md`
