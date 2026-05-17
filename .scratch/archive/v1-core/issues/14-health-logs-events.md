---
Status: done
---

# Health endpoint + structured logs + lifecycle events

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Observability seams hosts wire into their existing pipelines. No package-bundled vendor integration (Sentry/Bugsnag/Datadog/etc.) — hosts wire through Laravel's standard event listeners.

**`GET /chatbot/health`** — JSON `{version, active_streams, status}`. Reads the active-stream counter from slice 05.

**Structured logs** prefixed `[chatbot]` with fields: `conversation_id`, `channel`, `model`, `duration_ms`, `input_tokens`, `output_tokens`, `error_code` (when applicable). One log line per turn.

**Lifecycle events** — emit any that aren't already fired by other slices and verify the ones that are:
- `ChatbotMessageStarted` — emit
- `ChatbotMessageCompleted` (carries usage) — verified (wired in slice 09)
- `ChatbotMessageFailed` (carries typed exception) — emit
- `ChatbotMessageRated` — verified (wired in slice 11)
- `ChatbotSuspiciousContextDetected` — verified (wired in slice 08)

## Acceptance criteria

- [x] `GET /chatbot/health` returns version + active stream count
- [x] One `[chatbot]` log line per completed turn with all documented fields populated
- [x] Failed turns log with `error_code` populated
- [x] All five lifecycle events fire at the documented stage in feature tests
- [x] No vendor SDK dependency added to the package

## Blocked by

- `.scratch/v1-core/issues/05-streaming-sse.md`
