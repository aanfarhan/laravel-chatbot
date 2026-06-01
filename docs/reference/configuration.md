# Configuration

All keys live in `config/chatbot.php`, published by `php artisan chatbot:install` (or `php artisan vendor:publish --tag=chatbot-config`). Environment-variable overrides are listed alongside each key.

## Provider connection

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `base_url` | `CHATBOT_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible chat-completions base URL. |
| `api_key` | `CHATBOT_API_KEY` | _(unset)_ | API key for the provider. Required in normal operation; in tests `Chatbot::fake()` binds an in-memory client instead. |
| `model` | `CHATBOT_MODEL` | `gpt-4o-mini` | Default model name. Overridable per channel. |
| `provider.supports_tools` | `CHATBOT_PROVIDER_SUPPORTS_TOOLS` | `true` | Set `false` for providers that do not implement OpenAI's `tools` field (some self-hosted Ollama configs). When `false`, the tool registry is not consulted. |

## Route middleware

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `route_middleware` | `CHATBOT_ROUTE_MIDDLEWARE` | `['web']` | Middleware applied to the stateful routes (`POST /chatbot/messages`, `GET /chatbot/conversations/{id}/messages`) and the optional `test-fixture` render route. `GET /chatbot/health` and `GET /chatbot/widget.js` are always outside this group. Set the env var to a comma-separated list to override (e.g. `web,throttle:api`); set it to an empty string to opt out entirely. Identity always rides the signed envelope, so both the write and history paths function correctly under any value, including `[]`. See [ADR-0009](/adr/0009-routes-under-configurable-web-middleware-with-envelope-identity). |

## Conversation lifecycle

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `conversation_ttl` | `CHATBOT_CONVERSATION_TTL` | `86400` | Seconds after which a conversation rolls over to a new id. |
| `retention_days` | `CHATBOT_RETENTION_DAYS` | `30` | Days after last activity before `chatbot:prune` hard-deletes a conversation. `null` = keep forever. `0` = delete once `conversation_ttl` expires. Per-channel override supported. |
| `stream_duration` | `CHATBOT_STREAM_DURATION` | `60` | Wall-clock budget (seconds) for **LLM token streaming** within one SSE response, measured _excluding_ time blocked in synchronous tool handlers. Checked between model chunks and before each new LLM round-trip; it does not bound time spent inside a tool. Connection lifetime under slow tools is bounded by `tools.max_calls_per_turn` + host infra limits (`request_terminate_timeout`, proxy read timeouts). See [ADR-0006](/adr/0006-advisory-tool-timeouts-not-hard-interruption). |

## Rate limiting

Per-IP+channel throttle applied to all chatbot endpoints. Per-channel override supported.

| Key | Env | Default |
| --- | --- | --- |
| `throttle.per_minute` | `CHATBOT_THROTTLE_PER_MINUTE` | `20` |
| `throttle.per_day` | `CHATBOT_THROTTLE_PER_DAY` | `200` |

## Token caps

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `token_cap` | `CHATBOT_TOKEN_CAP` | `32768` | Max input tokens per assembled prompt. Oldest history is pruned to fit. A single user message exceeding the cap raises `ChatbotTokenCapExceededException`. |
| `daily_quota.input` | `CHATBOT_DAILY_QUOTA_INPUT` | `200000` | Per-user input-token budget; resets at UTC midnight. Exhaustion raises `ChatbotQuotaExceededException`. |
| `daily_quota.output` | `CHATBOT_DAILY_QUOTA_OUTPUT` | `50000` | Per-user output-token budget; resets at UTC midnight. |
| `context.section_size_cap` | `CHATBOT_CONTEXT_SECTION_SIZE_CAP` | `4096` | Max byte length of each individual context section in the system prompt. Oversized sections are truncated on a UTF-8-safe boundary and marked `[truncated]` (the marker counts toward the cap). |

## Tool-calling

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `tools.max_calls_per_turn` | `CHATBOT_TOOLS_MAX_CALLS_PER_TURN` | `5` | Total tool invocations per user message before the budget guard fires. |
| `tools.default_timeout` | `CHATBOT_TOOLS_DEFAULT_TIMEOUT` | `10` | **Advisory** per-tool budget in seconds — measured and recorded (the invocation is flagged `overran`), _not_ enforced. The package runs `handle()` synchronously and cannot interrupt a blocking call; a completed result is always used even if it overran. Bound real tool runtime yourself (HTTP-client timeouts, query limits, queue offload). See [ADR-0006](/adr/0006-advisory-tool-timeouts-not-hard-interruption). |
| `tools.replay_freshness` | `CHATBOT_TOOLS_REPLAY_FRESHNESS` | `300` | Seconds an invocation remains valid for history replay. (Implemented; not yet wired into the request cycle.) |
| `tools.default_max_arg_length` | `CHATBOT_TOOLS_DEFAULT_MAX_ARG_LENGTH` | `10240` | Max byte length for any single tool string argument. |
| `tools.result_size_cap` | `CHATBOT_TOOLS_RESULT_SIZE_CAP` | `4096` | Max byte length of a single tool result fed back to the model. Oversized results are truncated on a UTF-8-safe boundary and marked `[truncated]` (the marker counts toward the cap). |

## Context sanitizer

| Key | Default | Description |
| --- | --- | --- |
| `sanitizer_tags` | `['context', 'system', 'instructions', 'assistant', 'user']` | Tag names (without angle brackets) whose open/close forms are HTML-entity-escaped before context is assembled into the prompt. Extend to neutralise additional injection vectors. |

## Channels

Named channels override any top-level key. Keys absent from a channel block fall back to the top-level value.

```php
'channels' => [
    'default' => [],

    'admin' => [
        'model'                    => 'gpt-4o',
        'prompt'                   => 'You assist internal admin users.',
        'greeting'                 => 'Hello! Need a hand?',
        'summary'                  => fn () => 'You assist admins.',
        'throttle'                 => ['per_minute' => 5, 'per_day' => 100],
        'retention_days'           => 90,
        'allowed_tools'            => ['lookup_user', 'reset_password'],
        'allowed_extractors'       => ['form_state'],
        'extractor_timeout_ms'     => 500,
        'extractor_size_cap_bytes' => 16384,
    ],
],
```

### Per-channel keys

| Key | Falls back to | Description |
| --- | --- | --- |
| `model` | `chatbot.model` | Model name for this channel. |
| `prompt` | _(no default)_ | Channel system prompt (concatenated with the base prompt). |
| `greeting` | _(no default)_ | First assistant message shown when the conversation opens. |
| `summary` | _(no default)_ | `string` or `callable(): string` — short channel summary used in the system prompt. |
| `throttle.per_minute` | `chatbot.throttle.per_minute` | |
| `throttle.per_day` | `chatbot.throttle.per_day` | |
| `retention_days` | `chatbot.retention_days` | |
| `allowed_tools` | `[]` | List of tool names callable on this channel. |
| `allowed_extractors` | `[]` | List of client-extractor names allowed on this channel. The name `blade-snapshot` is reserved by the package — listing it enables the [`@chatbotSnapshot`](/guide/client-extractors#blade-snapshot-directive) Blade directive for this channel. |
| `extractor_timeout_ms` | `250` | Per-extractor timeout in milliseconds. |
| `extractor_size_cap_bytes` | `8192` | Per-extractor result size cap. |

Runtime overrides via [`ChannelScope`](./channel-scope) take precedence over config.

## Internal keys

The following keys exist but are not part of the public contract — they may change in patch releases without notice. They are documented here for completeness but should not be relied upon:

| Key | Notes |
| --- | --- |
| `envelope_ttl` | Envelope expiry in seconds (fixed at 900 in v1). Not declared in the published config; overriding requires editing the file directly. |
| `playwright_fixture.enabled` | `CHATBOT_PLAYWRIGHT_FIXTURE`. When `true`, registers the `/chatbot/test-fixture` route and a deterministic `FakeClient` for the package's own Playwright e2e suite. **Never enable in production.** |
