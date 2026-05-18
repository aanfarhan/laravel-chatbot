# ChannelScope

`Aanfarhan\Chatbot\ChannelScope` is the fluent builder returned by `Chatbot::channel($name)`. Every setter targets the named channel only — the default channel is unaffected.

```php
use Aanfarhan\Chatbot\Facades\Chatbot;

Chatbot::channel('admin')
    ->context(['report' => $reportData])
    ->prompt('You assist admin users only. Do not discuss pricing.')
    ->greeting('Hello, admin — what would you like to know?')
    ->summary('Admin assistant for the reporting console.')
    ->tools(['lookup_user', 'reset_password']);
```

All methods are part of the [public contract](/guide/semver).

## Methods

### `context(array $context): self`

Set the static context payload for this channel. Replaces any previously-set value.

### `prompt(string $prompt): self`

Override the channel's system prompt for this request. Falls back to `chatbot.channels.{name}.prompt` when not set at runtime.

### `greeting(string $greeting): self`

Override the channel's greeting (first assistant message shown when a new conversation opens). Falls back to `chatbot.channels.{name}.greeting`.

### `summary(callable|string $summary): self`

Override the channel's short summary used in the system prompt. A `callable` is evaluated at envelope-mint time. Falls back to `chatbot.channels.{name}.summary`.

### `tools(list<string> $tools): self`

Set the per-channel tool allowlist for this request. Overrides `chatbot.channels.{name}.allowed_tools`. A tool not in the allowlist is invisible to the LLM on this channel.

### `renderWidget(): string`

Render the `<chatbot-widget>` snippet bound to this channel. Equivalent to `Chatbot::renderWidget($name)` but reads more naturally in chained code.

```php
echo Chatbot::channel('admin')
    ->context(['report' => $report])
    ->renderWidget();
```

## Precedence

For each per-channel setting, the lookup order is:

1. Value set via this `ChannelScope` during the current request.
2. Value in `config/chatbot.php` under `channels.{name}`.
3. Top-level default (where one exists).

The render-time `Chatbot::renderWidget($channel)` (and `ChannelScope::renderWidget()`) signs the resolved values into the envelope — runtime overrides therefore reach the server intact.
