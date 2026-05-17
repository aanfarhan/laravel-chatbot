# Security

## Threat model

This package mediates between a host Laravel application and a third-party LLM. The attack surface is:

1. **Context forgery / replay** — a client that forges or replays a signed context envelope to impersonate another user or escalate privileges.
2. **Prompt injection via context data** — user-controlled data reaching the system prompt as instructions rather than data.
3. **Bot-output XSS** — the LLM returns content that the web component renders as HTML, enabling script injection.
4. **Worker / budget exhaustion** — an adversary sending messages that cause runaway LLM calls, consuming server threads and API budget.
5. **Tool-call abuse** — a model coerced into invoking registered tools repeatedly or recursively, fanning out cost and side effects.

---

## What v1 defends against

| Threat | Mitigation |
|---|---|
| Context forgery / replay | HMAC-SHA256 signed `ContextEnvelope` (key = `app.key`) with a configurable TTL (`chatbot.envelope_ttl`, default 900 s). Verify also binds user, route, channel, and version; tampered, expired, or mismatched tokens are rejected with HTTP 403 (`InvalidEnvelopeException`). |
| Basic tag-shape injection | `ContextSanitizer` strips the tags configured in `chatbot.sanitizer_tags` (default: `context`, `system`, `instructions`, `assistant`, `user`) from context values before they enter the prompt. |
| Bot-output XSS | The web component passes LLM output through a DOMPurify allowlist before inserting it into the DOM. Only a curated set of formatting tags is permitted. |
| Per-IP flooding | `MessagesController` enforces a per-IP+channel throttle via Laravel's `RateLimiter`: `chatbot.throttle.per_minute` (default 20) and `chatbot.throttle.per_day` (default 200). Both are overrideable per channel. |
| Worker exhaustion | Each SSE stream runs with an abort signal tied to the client disconnect (`connection_aborted()`). A wall-clock cap (`chatbot.stream_duration`, default 60 s) raises `ChatbotTimeoutException` if exceeded. Individual tool calls are bounded by `chatbot.tools.default_timeout` (default 10 s). |
| Prompt-size blowup | `chatbot.token_cap` (default 32768) bounds assembled input tokens; oldest history turns are pruned first. A user message that alone exceeds the cap raises `ChatbotTokenCapExceededException`. |
| API budget exhaustion | `DailyUsageTracker` enforces per-user/per-day token quotas (`chatbot.daily_quota.input` / `.output`, defaults 200k / 50k, UTC-reset). Exhaustion raises `ChatbotQuotaExceededException`, surfaced as an SSE `error` event. |
| Tool-call abuse | `chatbot.tools.max_calls_per_turn` (default 5) caps total tool invocations per user message across all loop iterations; the cap injects a synthetic budget-exhausted tool result instead of looping. `chatbot.tools.replay_freshness` (default 300 s) re-uses recent tool results from `ToolInvocationStore` rather than re-invoking. |
| Identity spoofing via tool arguments | `ChatbotTool::handle()` and `authorize()` receive the verified threaded actor as a typed first parameter (`?Authenticatable $actor`); the argument is injected by the framework, not supplied by the LLM. `ToolRegistry` rejects at boot any tool whose parameter schema declares an identity-shaped name (`user_id`, `userId`, `account_id`, `tenant_id`, `on_behalf_of`, and variants). See ADR-0003. |
| Malformed / oversize tool arguments | Strict JSON-schema validation runs before `authorize()`; a mismatch short-circuits the call, counts against `max_calls_per_turn`, is persisted as `rejected_schema`, and surfaces to the widget as a `failed` tool-status event. Per-string-field size is capped at `chatbot.tools.default_max_arg_length` (default 10240 bytes). |

---

## What v1 does NOT defend against

| Gap | Notes |
|---|---|
| Sophisticated prompt injection | Multi-turn, encoded, or indirect injection (e.g. instructions embedded in a user's order notes) is not detected or blocked. |
| Post-render content drift | The DOMPurify pass runs at insertion time; dynamic DOM mutations after render are outside the component's control. |
| Base64-encoded or obfuscated payloads | The sanitizer operates on plaintext strings; it does not decode or classify encoded content. |
| Two-pass content classification | No secondary classifier runs on LLM output to detect policy violations before display. |
| Automatic retry / model fallback | If the LLM returns an error or an empty response, the package surfaces the failure; it does not retry or switch models. (`OpenAiCompatibleClient` does retry once without `tools` on a 400 tools-rejection, but that is a compatibility fallback, not a general retry policy.) |
| Outbound tool side effects | Argument-level sandboxing (identity-arg blocking, schema validation, size cap) is in scope and covered above. Network egress and filesystem/capability isolation remain out of scope — these are host/infrastructure concerns. |
| Demo-mode exposure in production | If `chatbot.demo.enabled=true` (env `CHATBOT_DEMO`) is left on in production, `/chatbot/demo` is reachable and `LLMClient` is bound to `FakeClient`. Hosts must keep this off outside development. |

---

## Host responsibilities

Deploying this package does not absolve the host application of broader security and compliance obligations. The host is responsible for:

- **Privacy policy and user disclosure** — informing end-users that their messages are forwarded to a third-party LLM provider.
- **Subprocessor disclosure** — listing the LLM vendor as a subprocessor in your data processing agreement and privacy notices.
- **Retention decisions** — configuring `chatbot.retention_days` (per channel) to match your data-retention policy. The default is 30 days. Set to `null` to retain indefinitely.
- **Dollar-cost governance** — the package tracks token usage and supports per-channel `daily_quota` caps, but budget alerts and hard stops at the provider level are the host's responsibility.
- **Vendor integrations** — the package uses the OpenAI-compatible API format. Switching providers, setting rate limits at the API gateway level, and monitoring for vendor outages are outside this package's scope.

---

## Pen-testing aid

Use the `chatbot:inspect-prompt` Artisan command to review the exact message array sent to the LLM for any route without making a live request:

```
php artisan chatbot:inspect-prompt --route=orders.show --channel=default --context-json=sample.json
```

Flags:

| Flag | Required | Description |
|---|---|---|
| `--route` | yes | Named route being simulated (used for labelling) |
| `--channel` | no | Channel name (default: `default`) |
| `--user` | no | User ID to include in the inspection header |
| `--context-json` | no | Path to a JSON file with sample context payload |

The command outputs the full message array as pretty-printed JSON, with a header showing the inspection parameters. It uses the same `PromptAssembler` and `ContextSanitizer` as the live request path, so the output is authoritative.
