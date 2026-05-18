# Configuration

All keys live in `config/chatbot.php`, published by `php artisan chatbot:install` (or `php artisan vendor:publish --tag=chatbot-config`). Environment-variable overrides are listed alongside each key.

## Provider connection

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `base_url` | `CHATBOT_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible chat-completions base URL. |
| `api_key` | `CHATBOT_API_KEY` | _(unset)_ | API key for the provider. Required outside demo mode. |
| `model` | `CHATBOT_MODEL` | `gpt-4o-mini` | Default model name. Overridable per channel. |
| `provider.supports_tools` | `CHATBOT_PROVIDER_SUPPORTS_TOOLS` | `true` | Set `false` for providers that do not implement OpenAI's `tools` field (some self-hosted Ollama configs). When `false`, the tool registry is not consulted. |

## Conversation lifecycle

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `conversation_ttl` | `CHATBOT_CONVERSATION_TTL` | `86400` | Seconds after which a conversation rolls over to a new id. |
| `retention_days` | `CHATBOT_RETENTION_DAYS` | `30` | Days after last activity before `chatbot:prune` hard-deletes a conversation. `null` = keep forever. `0` = delete once `conversation_ttl` expires. Per-channel override supported. |

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

## Tool-calling

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `tools.max_calls_per_turn` | `CHATBOT_TOOLS_MAX_CALLS_PER_TURN` | `5` | Total tool invocations per user message before the budget guard fires. |
| `tools.default_timeout` | `CHATBOT_TOOLS_DEFAULT_TIMEOUT` | `10` | Per-tool wall-clock timeout in seconds. |
| `tools.replay_freshness` | `CHATBOT_TOOLS_REPLAY_FRESHNESS` | `300` | Seconds an invocation remains valid for history replay. (Implemented; not yet wired into the request cycle.) |
| `tools.default_max_arg_length` | `CHATBOT_TOOLS_DEFAULT_MAX_ARG_LENGTH` | `10240` | Max byte length for any single tool string argument. |

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
| `allowed_extractors` | `[]` | List of client-extractor names allowed on this channel. |
| `extractor_timeout_ms` | `250` | Per-extractor timeout in milliseconds. |
| `extractor_size_cap_bytes` | `8192` | Per-extractor result size cap. |

Runtime overrides via [`ChannelScope`](./channel-scope) take precedence over config.

## Demo

| Key | Env | Default | Description |
| --- | --- | --- | --- |
| `demo.enabled` | `CHATBOT_DEMO` | `false` | When `true`, the `/chatbot/demo` route is active and `LLMClient` is bound to `FakeClient`. **Never enable in production.** |

## Internal keys

The following keys exist but are not part of the public contract — they may change in patch releases without notice. They are documented here for completeness but should not be relied upon:

| Key | Notes |
| --- | --- |
| `envelope_ttl` | Envelope expiry in seconds (fixed at 900 in v1). Not declared in the published config; overriding requires editing the file directly. |
| `stream_duration` | SSE wall-clock cap in seconds (default 60). |
