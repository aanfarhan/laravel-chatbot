# Persist tool invocations with a freshness window for replay

## Context

When the LLM calls a tool mid-turn, the call and result are part of the provider's message protocol (`role: assistant` with `tool_calls`, then `role: tool` with the result). On subsequent user turns, message history is replayed to the LLM. We had to decide whether to persist these tool messages and, if so, whether to replay them.

Two failure modes pulled in opposite directions: replaying old tool results indefinitely risks the model answering from stale data ("your order is shipped" when it has since been returned); never persisting means every follow-up question re-pays the round-trip latency and tool budget, and the model often answers "I don't know" because the data isn't in its history.

## Decision

Persist every tool invocation (name, arguments, result, timestamp) in a dedicated `chatbot_tool_invocations` table keyed by message id — not inlined into the existing `messages` table. On replay, include tool results from invocations younger than a configurable **freshness window** (default 5 minutes, per-channel override); older invocations are kept for audit but omitted from replay, forcing the model to re-call the tool if it still needs that data.

Hosts may implement an optional `persist(ToolInvocation, mixed): array|null` method on the `ChatbotTool` contract to redact arguments/results before storage, or return `null` to skip persistence entirely.

## Considered alternatives

- **Persist nothing.** Rejected: degrades multi-turn coherence and wastes tool budget on every follow-up.
- **Persist and always replay.** Rejected: stale data leaks into answers with no automatic correction path.
- **Persist for audit only, never replay.** Rejected: same multi-turn coherence problem as "persist nothing"; the audit benefit alone didn't justify the schema.

## Consequences

- A separate table keeps the `messages` schema clean and lets tool usage be queried independently for analytics, debugging, and billing.
- The 5-minute default is a deliberate trade-off between coherence and staleness; channels with intrinsically fresh data (live dashboards) should shorten it, those with stable data (catalog lookups) can lengthen it.
- Redaction is opt-in per tool because most tool data is already gated by `authorize()`; tools touching PII or payment data are expected to override `persist()`.
