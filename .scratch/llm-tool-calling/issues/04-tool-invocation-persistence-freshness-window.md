# Tool-invocation persistence with freshness-window replay

Status: done

## What to build

Persist every tool invocation in a dedicated table and replay results into the LLM's history on subsequent turns within a configurable freshness window. See ADR 0002 for the reasoning and rejected alternatives, and CONTEXT.md → `tool-invocation-record` / `freshness-window`.

- Migration: `chatbot_tool_invocations` table with at least `id`, `message_id` (FK to the assistant message that issued the call), `conversation_id`, `tool_name`, `arguments` (json), `result` (json/text), `status` (`ok` | `failed`), `error` (nullable), `started_at`, `finished_at`. Indexed on `(conversation_id, finished_at)` for the freshness-window replay query.
- `StreamCoordinator` writes a record after each invocation (success or failure). The record references the message row representing the assistant's tool-call announcement, so a single assistant message can have multiple invocations linked to it.
- History replay (in `MessagesController` / `PromptAssembler` or wherever conversation replay is centralized): include the `assistant` tool-call announcements and their corresponding `tool` result messages from invocations whose `finished_at` is within the freshness window. Older invocations are retained in the table for audit but omitted from replay.
- Freshness window: config `chatbot.tools.replay_freshness` (default 300 seconds), per-channel override.
- Optional contract method `ChatbotTool::persist(ToolInvocation $invocation, mixed $result): array|null` — returning a sanitized payload to store, or `null` to skip persistence entirely. Default behavior (no override) stores arguments and result as-is.

## Acceptance criteria

- [ ] Migration adds `chatbot_tool_invocations` with the columns and index above
- [ ] Coordinator persists a record for every invocation including failures
- [ ] Default replay window is 300s; per-channel override via `chatbot.channels.<name>.tools.replay_freshness`
- [ ] Invocations younger than the window are replayed verbatim as `assistant` + `tool` message pairs on the next user turn
- [ ] Invocations older than the window are absent from replay but present in the table
- [ ] `ChatbotTool::persist()` is optional; default impl persists everything
- [ ] Returning `null` from `persist()` skips DB write entirely (no audit row)
- [ ] Returning a sanitized payload writes that payload, not the original
- [ ] Integration test: two-turn conversation where the second turn's prompt builds on a fresh tool result without re-invocation
- [ ] Integration test: same shape but with stale invocation — model re-calls the tool
- [ ] `vendor/bin/pint` clean, PHPStan level 9 clean

## Blocked by

- `.scratch/llm-tool-calling/issues/01-tool-call-loop-end-to-end.md`
