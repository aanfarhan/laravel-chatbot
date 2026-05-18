# Channels

A **channel** is a named widget mount point. It carries its own model, system prompt, throttle, tool allowlist, extractor allowlist, and retention policy. Channels let one Laravel application host multiple independent chatbots (for example, a customer-facing widget and an internal admin assistant) without entangling their configuration.

The default channel is always `default`. You only need named channels when you want to deviate from defaults.

## Selecting a channel from a controller

```php
use Aanfarhan\Chatbot\Facades\Chatbot;

Chatbot::channel('admin')
    ->context(['report' => $reportData])
    ->prompt('You assist admin users only. Do not discuss pricing.')
    ->greeting('Hello, admin — what would you like to know?')
    ->tools(['lookup_user', 'reset_password']);
```

`Chatbot::channel($name)` returns a [`ChannelScope`](/reference/channel-scope) fluent builder. Every setter is chainable and scoped to the named channel only — `Chatbot::context(...)` on the bare facade always targets `default`.

## Mounting a named channel

```blade
@chatbot('admin')
```

The widget element's `channel` attribute determines which signed envelope is minted and which configuration block is consulted. Multiple `<chatbot-widget>` elements can coexist on the same page if you want.

## Channel-scoped configuration

Defaults for each channel live under `chatbot.channels` in `config/chatbot.php`:

```php
'channels' => [
    'default' => [],

    'admin' => [
        'model'                    => 'gpt-4o',
        'prompt'                   => 'You assist internal admin users.',
        'greeting'                 => 'Hello! Need a hand?',
        'throttle'                 => ['per_minute' => 5, 'per_day' => 100],
        'retention_days'           => 90,
        'allowed_extractors'       => ['form_state'],
        'extractor_timeout_ms'     => 500,
        'extractor_size_cap_bytes' => 16384,
    ],
],
```

Any key absent from a channel block falls back to the top-level `chatbot.*` default.

Per-channel overrides supported in v1:

| Key | Falls back to |
| --- | --- |
| `model` | `chatbot.model` |
| `prompt` | (no top-level default) |
| `greeting` | (no top-level default) |
| `summary` | (no top-level default) |
| `throttle.per_minute` / `throttle.per_day` | `chatbot.throttle.*` |
| `retention_days` | `chatbot.retention_days` |
| `allowed_extractors` | `[]` |
| `extractor_timeout_ms` | `250` |
| `extractor_size_cap_bytes` | `8192` |

## Runtime overrides win

Values set via the fluent builder at request time take precedence over `config/chatbot.php` defaults. This lets you supply per-request prompts and contexts without hard-coding them in config.

```php
Chatbot::channel('support')
    ->context(['ticket' => $ticket->toArray()])
    ->prompt("You are a support agent for ticket #{$ticket->id}.");
```

## Channels and tool allowlists

A tool is registered globally (in a service provider) but only callable on channels whose allowlist names it. See [Tool calling — Per-channel allowlists](./tool-calling#per-channel-allowlists) for the full rules.

```php
Chatbot::channel('support')
    ->tools(['lookup_order', 'get_shipping_status']);
```

If a channel does not set an allowlist, **no** tools are callable on that channel. This is intentional: tool exposure is opt-in per channel.

## Theming per channel

The widget exposes its `channel` attribute, which you can target in CSS:

```css
chatbot-widget[channel="admin"]    { --chatbot-primary: #dc2626; }
chatbot-widget[channel="default"]  { --chatbot-primary: #2563eb; }
```

See [Theming](./theming) for the full CSS API.
