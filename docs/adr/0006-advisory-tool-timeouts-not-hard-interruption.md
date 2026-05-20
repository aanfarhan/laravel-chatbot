# Tool timeouts are advisory, not hard interruption

## Context

Tools run as host-owned PHP callables (`ChatbotTool::handle()`), invoked synchronously inside the `/messages` SSE request by the tool-call loop. The config exposes `chatbot.tools.default_timeout` (default 10s), commented as a "per-tool wall-clock timeout," and a global `chatbot.stream_duration` (default 60s) that caps the SSE response.

Neither did what its name implied:

- `default_timeout` computed a deadline, then called the **blocking** `handle()`, and only checked the clock *after* the handler returned. A handler that ran 5 minutes blocked the whole request for 5 minutes regardless of the 10s setting. Worse, on overrun the loop **discarded the result the handler had just produced** and substituted a `[timed out]` string — so the host paid the wall-clock cost and the data was thrown away.
- `stream_duration` was checked only between LLM chunks, never around tool execution. A long tool blew past it unnoticed; the cap then tripped on the *first chunk of the next* LLM round-trip, killing the turn with a bare `timeout` error after the user had already waited the full tool runtime — and before the model could respond to the (discarded) result.

The honest constraint behind both: under PHP-FPM (the SAPI serving an SSE endpoint) there is no safe way to interrupt a blocking synchronous call. `pcntl` signals are unavailable/unsafe under FPM and `set_time_limit` does not interrupt blocking I/O or `sleep`. True wall-clock interruption would require executing every tool in a sub-process — a significant architectural change and a new trust/serialization surface.

## Decision

Tool timeouts are **advisory and cooperative**, not enforced by the package.

- **The package does not interrupt tools.** `handle()` runs to completion. The "budget" (`default_timeout`) is a measurement: the loop records the duration and an `overran` flag on the [[tool-invocation-record]]. Bounding actual tool runtime is the **host's** responsibility — HTTP-client timeouts, query limits, and offloading long work to a queue rather than a tool.
- **A completed result is always used**, even if it overran. The package never discards data the host already paid to produce; overrun is a signal for tuning, not a control-flow branch.
- **`stream_duration` measures LLM-streaming wall-clock only**, excluding time blocked in synchronous tool handlers. It is checked between chunks (runaway model stream) and before starting each new LLM round-trip (runaway loop). It no longer trips merely because a tool was slow, so after a slow-but-completed tool the model gets its full budget to answer.
- **Connection lifetime under slow tools is bounded by `max_calls_per_turn` + host infrastructure limits** (`request_terminate_timeout`, proxy read timeouts), not by `stream_duration`. This is documented as the host's contract.
- **The UI cannot show mid-tool progress** (the process is blocked, no event loop). The widget instead renders the already-emitted `tool_started` state as an animated chip with a client-computed elapsed timer until `tool_finished`/`tool_failed`. No new server events.

## Considered alternatives

- **Hard wall-clock interruption via `pcntl` signals.** Rejected. Unavailable/unreliable under FPM, the normal SAPI for this endpoint; would make timeout behaviour silently SAPI-dependent.
- **Run each tool in a sub-process to enforce a hard kill.** Rejected for now. Large architectural change, new serialization and trust surface for the [[threaded-actor]] and arguments, and out of proportion to a feature whose tools are host-owned and expected to self-bound. Left open as a future opt-in if untrusted/runaway host tools become a real threat.
- **Keep discarding the result on overrun (prior behaviour, made "honest").** Rejected. Under advisory semantics the cost is already sunk; discarding a completed result wastes it and gives the user nothing after a long wait.
- **`stream_duration` as a hard total cap including tool time.** Rejected. It cannot actually stop a synchronous tool, so it can only punish *after* the time is spent — killing the turn with no budget left for the model to answer.
- **Per-tool `ChatbotTool::timeout()` override now.** Deferred. Under advisory semantics it only parameterizes the overrun measurement; it expands the deliberately lean contract for no bug-fixing benefit. Revisit as its own enhancement.

## Consequences

- `default_timeout` becomes an observability/tuning knob, not a guarantee. The config comment is rewritten to say so, and the unbuilt-`timeout()` promise is dropped.
- `stream_duration`, previously referenced in code but never published, is added to `config/chatbot.php` with its new "LLM-streaming only" meaning documented.
- Hosts carry real responsibility: a tool that hangs hangs the request up to infra limits. Docs must state plainly that tools run synchronously in the request and the widget freezes (chip shows elapsed time) for the tool's duration, so tools must be fast.
- Every future tightening here (e.g. an opt-in sub-process executor) starts from a clear, documented baseline rather than from code that quietly pretended to enforce a timeout.
