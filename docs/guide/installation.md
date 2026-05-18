# Installation

## Requirements

- PHP **8.3** or later
- Laravel **11** or **12**
- An OpenAI-compatible chat-completions endpoint and an API key

## Install via Composer

```bash
composer require aanfarhan/laravel-chatbot
```

The package's `ChatbotServiceProvider` is auto-discovered via Laravel's package discovery. The `Chatbot` facade alias is registered automatically.

## Run the install wizard

```bash
php artisan chatbot:install
```

The wizard is idempotent — it is safe to re-run after upgrades. It performs the following:

1. Publishes `config/chatbot.php`.
2. Runs the package migrations (`chatbot_conversations`, `chatbot_messages`, `chatbot_tool_invocations`).
3. Prompts you for your LLM provider's `base_url`, `api_key`, and default `model`, and writes them to `.env`.
4. Injects the `@chatbot` Blade directive into your application's primary layout, immediately before `</body>`. If you decline or no suitable layout is detected, the wizard prints the snippet so you can place it manually.

::: tip
You can re-run the wizard non-interactively in CI by piping answers. To skip the `.env` step, set the env vars beforehand:

```bash
CHATBOT_BASE_URL=https://api.openai.com/v1 \
CHATBOT_API_KEY=sk-... \
CHATBOT_MODEL=gpt-4o-mini \
php artisan chatbot:install
```
:::

## Verify the install

```bash
php artisan chatbot:demo
```

This scaffolds a `/chatbot/demo` route bound to an in-memory fake LLM driver so you can confirm the widget renders end-to-end without spending tokens.

::: warning
Never enable `chatbot.demo.enabled` in production. It binds `LLMClient` to a fake driver and exposes the demo route publicly.
:::

## Manual installation (if you skipped the wizard)

If you prefer to set things up by hand, the wizard is equivalent to running:

```bash
php artisan vendor:publish --tag=chatbot-config
php artisan migrate
```

Then add the following to `.env`:

```dotenv
CHATBOT_BASE_URL=https://api.openai.com/v1
CHATBOT_API_KEY=sk-...
CHATBOT_MODEL=gpt-4o-mini
```

And add `@chatbot` to your Blade layout, typically just before `</body>`:

```blade
<body>
    @yield('content')
    @chatbot
</body>
```

## Optional: publish stubs

If you intend to customise the scaffolded tool template emitted by `php artisan chatbot:make-tool`, publish the stub:

```bash
php artisan vendor:publish --tag=chatbot-stubs
```

The published copy at `stubs/chatbot-tool.stub` takes precedence over the package's bundled stub.

## Optional: GDPR trait

Add the [`HasChatbotData`](./gdpr) trait to your `User` model to enable per-user data access, export, and deletion methods.

```php
use Aanfarhan\Chatbot\Concerns\HasChatbotData;

class User extends Authenticatable
{
    use HasChatbotData;
}
```

## Next steps

- [Quick start](./quickstart) — write your first context binding and see the widget in action
- [Channels](./channels) — host multiple chatbots in one app
- [Configuration reference](/reference/configuration) — every `chatbot.php` key
