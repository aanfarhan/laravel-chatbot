# SSE tool status events + built-in widget chip

Status: done

## What to build

Give end users a "something is happening" signal during the tool-call loop without leaking arguments or results. See CONTEXT.md → `tool-status-event`.

- `StreamCoordinator` emits structured SSE events around each tool invocation: `tool_started`, `tool_finished`, `tool_failed`. Payload carries the tool `name` and lifecycle `phase` only — never args, never results. Sequential execution from #01 means the event order on the wire matches invocation order.
- Widget renders a transient status chip ("Looking up order…" / a generic phrasing keyed off `name`) that appears on `tool_started` and dismisses on the matching `tool_finished` / `tool_failed`. If a new tool starts before the previous finishes (shouldn't happen given sequential execution, but defensive), the chip updates.
- Chip is themable via a new CSS-part on `chatbot-widget` (e.g. `::part(tool-status)`) following the existing CSS-parts pattern documented in README.

## Acceptance criteria

- [ ] SSE event types `tool_started`, `tool_finished`, `tool_failed` documented and emitted by `StreamCoordinator`
- [ ] Event payloads contain `name` and `phase` only; no `arguments`, no `result`
- [ ] Widget displays chip from `tool_started` until the matching terminal event
- [ ] Chip is targetable via `::part(tool-status)`; CSS-parts table in README is updated
- [ ] Frontend test asserts chip visibility transitions on synthetic events
- [ ] Integration test: when a fake tool runs, SSE stream contains the expected `tool_started` / `tool_finished` events in order
- [ ] `vendor/bin/pint` clean, PHPStan level 9 clean

## Blocked by

- `.scratch/llm-tool-calling/issues/01-tool-call-loop-end-to-end.md`
