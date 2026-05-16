# Laravel AI Chatbot Widget

A Composer package that drops a context-aware chatbox onto any Laravel page. Declare what data the chat should see in your controller; the package handles signing, streaming, persistence, and the frontend widget.

## Requirements

- PHP 8.3+
- Laravel 11 or 12
- An OpenAI-compatible LLM provider (OpenAI, Azure, OpenRouter, Groq, Ollama, etc.)

## Installation

```bash
composer require aanfarhan/chatbot
php artisan chatbot:install
```

The install wizard publishes config, runs migrations, prompts for your LLM settings, and injects the `@chatbot` Blade directive into your layout. Re-running it is safe — it is idempotent.

## Quick start

```php
// In your controller or route handler:
use Aanfarhan\Chatbot\Facades\Chatbot;

Route::get('/orders/{order}', function (Order $order) {
    Chatbot::context(['order' => new OrderResource($order)]);

    return view('orders.show', compact('order'));
})->name('orders.show');
```

Add `@chatbot` anywhere in your Blade layout (the install wizard does this for you):

```html
<body>
    @yield('content')
    @chatbot
</body>
```

---

## Theming

The widget exposes a stable CSS customization API via custom properties and named CSS parts. Both are guaranteed stable across minor and patch releases (see [SemVer commitments](#semver-commitments)).

### CSS custom properties

Override any of the following on the `chatbot-widget` element or at `:root`:

| Property | Default | Description |
|---|---|---|
| `--chatbot-primary` | `#6366f1` | Accent color — launcher button, send button, user bubble |
| `--chatbot-on-primary` | `#ffffff` | Text/icon color on primary surfaces |
| `--chatbot-surface` | `#ffffff` | Panel and message background |
| `--chatbot-on-surface` | `#1f2937` | Primary text color |
| `--chatbot-radius` | `12px` | Border radius for the panel and message bubbles |
| `--chatbot-font` | `system-ui, sans-serif` | Font family |
| `--chatbot-shadow` | `0 8px 32px rgba(0,0,0,0.16)` | Box shadow on the floating panel |
| `--chatbot-z-index` | `9999` | Stack order for the floating launcher and panel |

**Example — match your brand colors:**

```css
chatbot-widget {
  --chatbot-primary: #0f172a;
  --chatbot-on-primary: #f8fafc;
  --chatbot-surface: #f8fafc;
  --chatbot-on-surface: #0f172a;
  --chatbot-radius: 8px;
}
```

**Example — per-channel theming (admin vs customer):**

```css
/* Admin panel */
chatbot-widget[channel="admin"] {
  --chatbot-primary: #dc2626;
}

/* Customer widget (default) */
chatbot-widget[channel="default"] {
  --chatbot-primary: #2563eb;
}
```

### CSS parts

The widget exposes named parts targetable with `::part(...)` from your app's stylesheet. Use these when custom properties are not granular enough.

| Part | Element |
|---|---|
| `launcher` | Floating launcher button (bottom-right/bottom-left position) |
| `panel` | The chat panel container |
| `header` | Panel title bar |
| `messages` | Scrollable message list |
| `message-user` | Individual user message bubble |
| `message-assistant` | Individual assistant message bubble |
| `input` | Text input field |
| `send-button` | Send button |
| `tool-status` | Transient status chip shown during tool-call execution |

**Example — custom launcher icon size:**

```css
chatbot-widget::part(launcher) {
  width: 64px;
  height: 64px;
}
```

**Example — assistant message bubbles with a left border accent:**

```css
chatbot-widget::part(message-assistant) {
  border-left: 3px solid var(--chatbot-primary);
  padding-left: 12px;
  border-radius: 0;
}
```

**Example — full-width inline mode header:**

```css
chatbot-widget[position="inline"]::part(header) {
  border-radius: 0;
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
}
```

---

## Channels

Named channels let one app host multiple independent chatbots. Each channel has its own model, system prompt, throttle, and retention settings.

```php
// In a route handler:
Chatbot::channel('admin')
    ->context(['report' => $reportData])
    ->prompt('You assist admin users only. Do not discuss pricing.')
    ->greeting('Hello! What can I help you with today?');
```

```html
{{-- In your Blade view: --}}
@chatbot('admin')
```

Channel defaults live in `config/chatbot.php`:

```php
'channels' => [
    'admin' => [
        'model'         => 'gpt-4o',
        'system_prompt' => 'You assist internal admin users.',
        'throttle'      => ['per_minute' => 5, 'per_day' => 100],
        'retention_days' => 90,
    ],
],
```

---

## Shipping order (v1 four-week sketch)

| Week | Focus | End-of-week deliverable |
|---|---|---|
| 1 | **Skeleton** — package scaffolding, config, migrations, `LLMClient` interface + `OpenAiCompatibleClient` + `FakeClient`, facade with `context()` / `channel()` / `fake()`, signed envelope, layered prompt assembly, basic non-streaming `POST /chatbot/messages` | Integration test posts a message, gets a fake reply |
| 2 | **Streaming + persistence** — SSE response, DB writes per turn, conversation cookie + rehydrate endpoint, typed exceptions + SSE error events, throttle + token caps | Real OpenAI-compatible streaming verified end-to-end |
| 3 | **Frontend** — web component, markdown rendering, theming surface, mobile, regenerate/copy/rating UX, `chatbot:install`, demo seed | `chatbot:demo` works on a fresh Laravel app |
| 4 | **Hardening** — prompt-injection sanitization, GDPR commands + trait, health endpoint, `chatbot:prune`, error UX polish, docs | `1.0.0-rc.1` published |

---

## SemVer commitments

### Public contract (stable across minor and patch releases)

- `Chatbot` facade method signatures (`context`, `prompt`, `greeting`, `summary`, `channel`, `fake`, `quota`, `authorize`)
- Config keys in `chatbot.php`
- SSE event shape: `{type, ...}` with documented fields for `token`, `done`, `error`, `context_summary`, `tool_started`, `tool_finished`, `tool_failed`
- Signed envelope shape (public payload fields)
- Web component attributes: `channel`, `position`, `title`
- CSS custom properties: all eight `--chatbot-*` properties listed above
- CSS parts: all nine named parts listed above
- Event class names: `ChatbotMessageStarted`, `ChatbotMessageCompleted`, `ChatbotMessageFailed`, `ChatbotSuspiciousContextDetected`
- Typed exception class hierarchy under `ChatbotException`

### Internal (may change in any release, including patches)

- Database schema — managed via migrations; run `php artisan migrate` on upgrade
- Base system prompt content — it is prompt tuning, not a contract
- HMAC algorithm and envelope encoding — the public interface is `mint/verify`, not the wire format

---

## Security

See [SECURITY.md](SECURITY.md) for the full threat model, what v1 defends against, what it does not, and host responsibilities.

### Inspect assembled prompts

During pen-testing, use `chatbot:inspect-prompt` to see exactly what the LLM receives for any route without making a live request:

```bash
php artisan chatbot:inspect-prompt \
  --route=orders.show \
  --channel=default \
  --user=42 \
  --context-json=sample-order-context.json
```

---

## Console commands

| Command | Description |
|---|---|
| `chatbot:install` | Publish config, run migrations, write `.env`, inject Blade snippet (idempotent) |
| `chatbot:demo` | Scaffold a demo route with a fake LLM driver for evaluation |
| `chatbot:inspect-prompt` | Dump the assembled prompt for a route as the LLM would receive it |
| `chatbot:prune` | Hard-delete conversations past the configured retention window |
| `chatbot:delete-user {id}` | Soft- or hard-delete a user's conversations (`--hard`, `--channel`) |
| `chatbot:export-user {id}` | Export a user's conversations as JSON or CSV (`--format`) |
| `chatbot:anonymize-user {id}` | Scrub user identity while preserving token/cost aggregates |
| `chatbot:delete-guest {token}` | Delete a guest token's conversations |

---

## License

MIT
