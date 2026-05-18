# Console commands

All commands live under the `chatbot:` namespace.

| Command | Purpose |
| --- | --- |
| [`chatbot:install`](#install) | Publish config, run migrations, write `.env`, inject Blade snippet. Idempotent. |
| [`chatbot:demo`](#demo) | Scaffold a demo route + fake LLM driver for evaluation. |
| [`chatbot:make-tool`](#make-tool) | Scaffold a new `ChatbotTool` class. |
| [`chatbot:inspect-prompt`](#inspect-prompt) | Dump the assembled prompt for a route as the LLM would receive it. |
| [`chatbot:prune`](#prune) | Hard-delete conversations past the retention window. |
| [`chatbot:delete-user`](#delete-user) | Soft- or hard-delete a user's conversations. |
| [`chatbot:export-user`](#export-user) | Export a user's conversations as JSON or CSV. |
| [`chatbot:anonymize-user`](#anonymize-user) | Scrub user identity while preserving token/cost aggregates. |
| [`chatbot:delete-guest`](#delete-guest) | Delete a guest token's conversations. |

## `chatbot:install` {#install}

```bash
php artisan chatbot:install
```

Publishes `config/chatbot.php`, runs the package migrations, prompts for `base_url` / `api_key` / `model` and writes them to `.env`, then injects `@chatbot` into your primary layout immediately before `</body>`.

Safe to re-run. Skips steps already done.

## `chatbot:demo` {#demo}

```bash
php artisan chatbot:demo
```

Scaffolds a `/chatbot/demo` route. Setting `CHATBOT_DEMO=true` (or `chatbot.demo.enabled=true`) binds `LLMClient` to `FakeClient` so the page works without an API key. Never enable in production.

## `chatbot:make-tool` {#make-tool}

```bash
php artisan chatbot:make-tool GetWeather
php artisan chatbot:make-tool GetWeather --force
```

Writes a worked-example class to `app/Chatbot/Tools/GetWeatherTool.php`. Prints the exact `Chatbot::registerTool(...)` line to paste into a service provider.

| Argument / flag | Description |
| --- | --- |
| `name` | Bare class name (e.g. `GetWeather` → `GetWeatherTool`). |
| `--force` | Overwrite existing file. Without it, the command fails fast if the destination exists. |

Publish `stubs/chatbot-tool.stub` via `php artisan vendor:publish --tag=chatbot-stubs` to customise the template.

## `chatbot:inspect-prompt` {#inspect-prompt}

```bash
php artisan chatbot:inspect-prompt \
  --route=orders.show \
  --channel=default \
  --user=42 \
  --context-json=sample-order-context.json
```

Dumps the full `messages` array as pretty-printed JSON, with a header showing the inspection parameters. Uses the same `PromptAssembler` and `ContextSanitizer` as live requests, so output is authoritative.

| Flag | Required | Description |
| --- | --- | --- |
| `--route` | ✓ | Named route being simulated (used for labelling). |
| `--channel` | – | Channel name. Defaults to `default`. |
| `--user` | – | User ID to include in the inspection header. |
| `--context-json` | – | Path to a JSON file with sample context payload. |

## `chatbot:prune` {#prune}

```bash
php artisan chatbot:prune
```

Hard-deletes conversations whose last activity is older than `chatbot.retention_days` (per-channel overrides honoured). `retention_days = null` disables pruning for that channel.

Schedule it in `routes/console.php`:

```php
Schedule::command('chatbot:prune')->daily();
```

## `chatbot:delete-user` {#delete-user}

```bash
php artisan chatbot:delete-user 42
php artisan chatbot:delete-user 42 --hard
php artisan chatbot:delete-user 42 --channel=admin
```

| Argument / flag | Description |
| --- | --- |
| `id` | User id (matched against `chatbot_conversations.user_id`). |
| `--hard` | Force-delete instead of soft-delete. |
| `--channel` | Restrict to a single channel. |

## `chatbot:export-user` {#export-user}

```bash
php artisan chatbot:export-user 42 --format=json
php artisan chatbot:export-user 42 --format=csv > export.csv
```

| Argument / flag | Description |
| --- | --- |
| `id` | User id. |
| `--format` | `json` (default) or `csv`. |

JSON output matches the `chatbot-export@1` shape returned by `HasChatbotData::exportChatbotData()`.

## `chatbot:anonymize-user` {#anonymize-user}

```bash
php artisan chatbot:anonymize-user 42
```

Nullifies `user_id` on the user's conversations and scrubs personally-identifying content from message bodies, while preserving aggregate token / cost rows for billing or analytics continuity.

## `chatbot:delete-guest` {#delete-guest}

```bash
php artisan chatbot:delete-guest abc123token
```

Deletes conversations keyed to the given guest token.
