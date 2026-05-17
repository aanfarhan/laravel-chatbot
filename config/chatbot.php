<?php

declare(strict_types=1);

return [
    'base_url' => env('CHATBOT_BASE_URL', 'https://api.openai.com/v1'),
    'api_key' => env('CHATBOT_API_KEY'),
    'model' => env('CHATBOT_MODEL', 'gpt-4o-mini'),
    'conversation_ttl' => (int) env('CHATBOT_CONVERSATION_TTL', 86400),

    /*
    |--------------------------------------------------------------------------
    | Retention policy
    |--------------------------------------------------------------------------
    | Days after last activity before chatbot:prune hard-deletes a conversation.
    | null = keep forever. 0 = delete once the conversation TTL has expired.
    | Override per channel inside 'channels' => [...].
    */
    'retention_days' => (int) env('CHATBOT_RETENTION_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Rate limiting
    |--------------------------------------------------------------------------
    | Per-IP request throttle applied to all chatbot endpoints.
    | Both limits can be overridden per channel inside 'channels' => [...].
    */
    'throttle' => [
        'per_minute' => (int) env('CHATBOT_THROTTLE_PER_MINUTE', 20),
        'per_day' => (int) env('CHATBOT_THROTTLE_PER_DAY', 200),
    ],

    /*
    |--------------------------------------------------------------------------
    | Input token cap
    |--------------------------------------------------------------------------
    | Maximum number of input tokens per assembled prompt. Oldest history turns
    | are pruned first to fit. If the current user message alone exceeds the cap
    | a ChatbotTokenCapExceededException is raised.
    */
    'token_cap' => (int) env('CHATBOT_TOKEN_CAP', 32768),

    /*
    |--------------------------------------------------------------------------
    | Daily token quota
    |--------------------------------------------------------------------------
    | Per-user daily budget tracked by DailyUsageTracker reading from
    | chatbot_messages. Resets at UTC midnight. On exhaustion, raises
    | ChatbotQuotaExceededException (surfaced as an SSE error event).
    */
    'daily_quota' => [
        'input' => (int) env('CHATBOT_DAILY_QUOTA_INPUT', 200000),
        'output' => (int) env('CHATBOT_DAILY_QUOTA_OUTPUT', 50000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Named channels
    |--------------------------------------------------------------------------
    | Each channel can override model, system_prompt, conversation_ttl, and
    | throttle settings. Keys absent from a channel fall back to top-level.
    |
    | Example:
    |
    | 'channels' => [
    |     'default' => [],
    |     'admin' => [
    |         'model'         => 'gpt-4o',
    |         'system_prompt' => 'You are an admin assistant with full access.',
    |         'throttle'      => ['per_minute' => 5, 'per_day' => 50],
    |     ],
    | ],
    */
    'channels' => [],

    /*
    |--------------------------------------------------------------------------
    | Provider capabilities
    |--------------------------------------------------------------------------
    | supports_tools: set to false for providers (e.g. Ollama, some self-hosted
    |   setups) that do not implement the OpenAI tool-call protocol. When false,
    |   the tool registry is not consulted, no `tools` field is sent to the
    |   provider, and tool_calls parsing is skipped. The runtime fallback in
    |   OpenAiCompatibleClient also detects a 400 tools-rejection and retries
    |   once without tools, but hosts are expected to set this flag explicitly.
    */
    'provider' => [
        'supports_tools' => (bool) env('CHATBOT_PROVIDER_SUPPORTS_TOOLS', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tool-calling
    |--------------------------------------------------------------------------
    | max_calls_per_turn: total tool invocations allowed across all loop
    |   iterations for a single user message. Hitting the cap injects a
    |   synthetic budget-exhausted tool result so the model still produces prose.
    | default_timeout: per-tool wall-clock timeout in seconds. Individual tools
    |   may override via ChatbotTool::timeout() once that method is added.
    */
    'tools' => [
        'max_calls_per_turn' => (int) env('CHATBOT_TOOLS_MAX_CALLS_PER_TURN', 5),
        'default_timeout' => (int) env('CHATBOT_TOOLS_DEFAULT_TIMEOUT', 10),
        'replay_freshness' => (int) env('CHATBOT_TOOLS_REPLAY_FRESHNESS', 300),
        'default_max_arg_length' => (int) env('CHATBOT_TOOLS_DEFAULT_MAX_ARG_LENGTH', 10240),
    ],

    /*
    |--------------------------------------------------------------------------
    | Context sanitizer forbidden tags
    |--------------------------------------------------------------------------
    | Tag names (without angle brackets) whose open/close forms will be
    | HTML-entity-escaped before context is assembled into the prompt.
    | Extend this list to neutralize additional injection vectors.
    */
    'sanitizer_tags' => ['context', 'system', 'instructions', 'assistant', 'user'],

    /*
    |--------------------------------------------------------------------------
    | Demo mode
    |--------------------------------------------------------------------------
    | When enabled, the /chatbot/demo route is active and LLMClient is bound
    | to FakeClient with canned replies. NEVER enable in production.
    */
    'demo' => [
        'enabled' => (bool) env('CHATBOT_DEMO', false),
    ],
];
