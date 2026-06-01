# Security

This page summarises the package's threat model: what v1 defends against, what it does not, and what stays the host's responsibility.

::: tip Pen-testing aid
Use `php artisan chatbot:inspect-prompt` to view the exact message array the LLM would receive for any route, without making a live request. See [Console commands](/reference/console-commands#inspect-prompt).
:::

## Attack surface

The package mediates between a host Laravel app and a third-party LLM. The attack surface is:

1. **Context forgery / replay** — forging or replaying a signed envelope to impersonate another user or escalate privilege.
2. **Prompt injection via context data** — user-controlled data reaching the system prompt as instructions rather than data.
3. **Bot-output XSS** — the LLM returns content the widget renders as HTML, enabling script injection.
4. **Worker / budget exhaustion** — runaway streams, recursive tool loops, oversize prompts.
5. **Tool-call abuse** — a model coerced into invoking tools repeatedly or with attacker-chosen arguments.

## What v1 defends against

| Threat | Mitigation |
| --- | --- |
| Context forgery / replay | HMAC-SHA256 `ContextEnvelope` keyed on `app.key`. Verify also binds user id, route, channel, and version. TTL 900s. Tampered, expired, or mismatched tokens raise `InvalidEnvelopeException` (HTTP 403). |
| Tag-shape injection | `ContextSanitizer` strips tags listed in `chatbot.sanitizer_tags` from context values before assembly. |
| Bot-output XSS | The widget passes LLM output through a DOMPurify allowlist before insertion. |
| Per-IP flooding | `RateLimiter` enforces `chatbot.throttle.per_minute` / `per_day` per IP+channel. |
| Worker exhaustion | SSE streams abort on client disconnect; wall-clock cap `chatbot.stream_duration` (default 60 s). Tool calls bounded by `chatbot.tools.default_timeout`. |
| Prompt-size blowup | `chatbot.token_cap` (default 32768) bounds assembled input tokens. A user message that alone exceeds the cap raises `ChatbotTokenCapExceededException`. |
| API budget exhaustion | `DailyUsageTracker` enforces `chatbot.daily_quota.input` / `.output` per user per day (UTC-reset). Exhaustion raises `ChatbotQuotaExceededException`. |
| Tool-call abuse | `chatbot.tools.max_calls_per_turn` caps total invocations per user message. |
| Identity spoofing via tool arguments | `ChatbotTool::handle()` and `authorize()` receive the threaded actor as a typed first parameter — injected by the framework, never by the LLM. `ToolRegistry` rejects identity-shaped parameter names at boot. See [ADR-0003](/adr/0003-threaded-actor-is-a-contract-parameter). |
| Malformed / oversize tool arguments | Strict JSON-schema validation pre-`authorize()`. Failures count against `max_calls_per_turn` and persist as `rejected_schema`. Per-string-field cap `chatbot.tools.default_max_arg_length` (default 10240 bytes). |

## What v1 does NOT defend against

| Gap | Notes |
| --- | --- |
| Sophisticated prompt injection | Multi-turn, encoded, or indirect injection (e.g. instructions hidden in a user's order notes) is not detected or blocked. |
| Indirect prompt injection via client extractors | When a channel allowlists [extractors](./client-extractors), untrusted page content reaches the LLM every turn. The package wraps each block in `<client-extractor name="…" trust="untrusted-page-content">` tags and prepends a system-prompt rule treating contents as data — a **soft** defence. Combined with mutating tools on the same channel, a determined indirect injection can still succeed. Keep mutating tools and extractors on disjoint channels where possible. See [ADR-0004](/adr/0004-client-extractors-untrusted-by-construction). |
| Post-render content drift | DOMPurify runs at insertion time. Dynamic DOM mutations after render are outside the widget's control. |
| Base64 / obfuscated payloads | The sanitizer operates on plaintext. It does not decode or classify encoded content. |
| Two-pass content classification | No secondary classifier runs on LLM output before display. |
| Automatic retry / model fallback | The package surfaces provider errors; it does not retry or switch models. (`OpenAiCompatibleClient` does retry once without `tools` on a 400 tools-rejection — a compatibility fallback, not a general policy.) |
| Tool result replay / dedup | Cross-turn replay is wired in: invocations within `chatbot.tools.replay_freshness` (default 300 s) are replayed into the prompt on later turns. Within a *single* turn, re-invoking the same tool is not deduplicated. |
| Outbound tool side effects | Argument-level sandboxing is in scope. Network egress, filesystem isolation, capability boxing remain host/infrastructure concerns. |

## Host responsibilities

The package does not absolve the host of broader security and compliance work:

- **Privacy disclosure** — tell users their messages go to a third-party LLM.
- **Subprocessor list** — include the LLM vendor in your DPA and privacy notice.
- **Retention** — configure `chatbot.retention_days` (per channel) to match your policy.
- **Cost governance** — track token spend, set vendor-side hard caps. The package's `daily_quota` is a per-user soft cap, not a billing safety net.
- **Vendor outages** — choose your provider; the package speaks the OpenAI protocol but doesn't probe vendor health.
- **Auth & sessions** — `ContextEnvelope` carries `userId` from Laravel's configured auth guard. If that guard is mis-scoped, the envelope inherits the problem.

## See also

- [GDPR & user data](./gdpr) — data-subject rights and retention
- [Threaded actor](./threaded-actor) — identity guarantees for tools
- [Client extractors](./client-extractors) — untrusted-by-construction model
- [ADR-0003](/adr/0003-threaded-actor-is-a-contract-parameter) and [ADR-0004](/adr/0004-client-extractors-untrusted-by-construction)
- [Exceptions reference](/reference/exceptions) — code → meaning → retryability
