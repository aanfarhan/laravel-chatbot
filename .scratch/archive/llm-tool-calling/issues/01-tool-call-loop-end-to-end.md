# Tool-call loop end-to-end with required auth contract

Status: done

## What to build

Land the foundational tool-calling path through the existing streaming flow. The LLM emits `tool_calls`, the server resolves them against a process-wide registry of host-registered tools, runs each handler, feeds results back, and the model continues until it produces final prose.

Surface to build:

- `ChatbotTool` contract with required `name()`, `description()`, `parameters()` (hand-written JSON-schema array literal per OpenAI's `parameters` shape), `authorize(ToolInvocation): bool`, and `handle(ToolInvocation): array|string`. `authorize()` is **required** — no default — so omitting auth on a tool is a compile-time mistake, not a runtime one.
- `ToolInvocation` value object carrying `args` (LLM-supplied), `actor` (authenticated user or null), `channel`, and the verified static context payload. Handlers must scope by the threaded actor, never by LLM-supplied identity args (see CONTEXT.md → `tool-invocation`).
- Global registry on the `Chatbot` facade (e.g. `Chatbot::registerTool(MyTool::class)`), typically populated in a service provider.
- `StreamCoordinator` extended to run the tool-call loop: detect `tool_calls` in stream output, call `authorize()` then `handle()` sequentially in emit order, append a `role: tool` message per call, and re-invoke the provider. Repeat until the model emits final prose or the iteration cap is hit.
- Loop bounds: max 5 tool calls per user message (config `chatbot.tools.max_calls_per_turn`, per-channel override), 10s per-tool wall-clock timeout (config `chatbot.tools.default_timeout`, per-tool override via `ChatbotTool::timeout()`), 4096-byte result-size cap with `[truncated]` suffix matching `PromptAssembler::DEFAULT_SECTION_SIZE_CAP`.
- Failure handling: any error (authorize denial, timeout, handler exception, oversized result) becomes a `role: tool` error message fed back to the model. The stream itself never dies from tool failures. Hitting the max-calls cap also feeds back a synthetic "budget exhausted" tool message so the model still emits final prose.
- `OpenAiCompatibleClient`: send the `tools` array (currently accepted but unused) and parse `tool_calls` deltas from streamed chunks.
- `FakeClient`: recording-style API à la Laravel's `Bus::fake()` — `assertToolCalled('name', fn($args) => ...)`, `assertToolNotCalled('name')` — plus a scripted-response builder so tests can stage "model calls tool X, then on the result emits prose Y".

All allowlist/envelope work is **out of scope** for this slice — every registered tool is callable by every channel until #02 lands.

## Acceptance criteria

- [ ] `ChatbotTool` contract published with all five methods required; missing `authorize()` is a type error
- [ ] `ToolInvocation` exposes immutable `args`, `actor`, `channel`, `context`
- [ ] `Chatbot::registerTool()` adds to a process-wide registry; duplicate name throws
- [ ] `OpenAiCompatibleClient::stream()` sends `tools` and yields `tool_calls` chunks
- [ ] `StreamCoordinator` runs the loop sequentially, respects iteration cap and per-tool timeout
- [ ] Errors (authorize false, timeout, exception, oversize) feed back as tool messages; stream completes normally
- [ ] Budget-exhausted synthetic message lets the model produce final prose
- [ ] Result over 4096 bytes is truncated with `[truncated]` suffix
- [ ] `FakeClient` records invocations and exposes `assertToolCalled` / `assertToolNotCalled`
- [ ] Integration test: host registers a tool, fake LLM emits one tool_call, handler runs, result fed back, model emits prose — full path covered
- [ ] `vendor/bin/pint` clean, PHPStan level 9 clean

## Blocked by

None - can start immediately
