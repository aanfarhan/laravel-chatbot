# Laravel AI Chatbot Widget

A Composer package that drops a context-aware chatbox onto any Laravel page. Declare what data the chat should see in your controller; the package handles signing, streaming, persistence, and the frontend widget.

## Requirements

- PHP 8.3+
- Laravel 11 or 12
- An OpenAI-compatible LLM provider (OpenAI, Azure, OpenRouter, Groq, Ollama, etc.)

## Installation

```bash
composer require aanfarhan/laravel-chatbot
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
        'model'          => 'gpt-4o',
        'system_prompt'  => 'You assist internal admin users.',
        'throttle'       => ['per_minute' => 5, 'per_day' => 100],
        'retention_days' => 90,
    ],
],
```

---

## Tool calling

Register tools in a service provider to let the LLM call your application code during a conversation turn.

### Implementing a tool

The fastest way to start is the scaffolder, which writes a worked-example class into `app/Chatbot/Tools/`:

```bash
php artisan chatbot:make-tool GetWeather
```

The generated class implements `ChatbotTool` with a realistic `parameters()` schema, an `authorize()` body that requires an authenticated `$actor` (see ADR-0003), and `// TODO` markers for the bits you fill in. The command prints the exact `Chatbot::registerTool(...)` line to paste into a service provider. Re-running against an existing file fails fast with a `Use --force to overwrite` message; pass `--force` to regenerate. To customize the template across your app, publish the stub with `php artisan vendor:publish --tag=chatbot-stubs` and edit `stubs/chatbot-tool.stub` — the command prefers the published copy when present.

The hand-written form below is still fully supported:

```php
use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class LookupOrderTool implements ChatbotTool
{
    public function name(): string { return 'lookup_order'; }

    public function description(): string
    {
        return 'Retrieve a single order by its ID for the authenticated user.';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order_id' => ['type' => 'integer', 'description' => 'The order ID to fetch'],
            ],
            'required' => ['order_id'],
        ];
    }

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        return $actor !== null; // deny guest turns
    }

    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        return Order::where('user_id', $actor->getAuthIdentifier())
            ->findOrFail($invocation->args['order_id'])
            ->toArray();
    }
}
```

**Security invariant:** the authenticated user identity is threaded via the typed `$actor` parameter, not via `$invocation->args`. Tool argument names that look like identity handles (`user_id`, `actor_id`, `account_id`, `tenant_id`, etc.) are blocked at registration time. See [ADR-0003](docs/adr/0003-threaded-actor-is-a-contract-parameter.md).

### Registering tools

```php
// AppServiceProvider::boot()
use Aanfarhan\Chatbot\Facades\Chatbot;

Chatbot::registerTool(LookupOrderTool::class);
```

### Per-channel tool allowlists

Restrict which tools are callable on a given channel via `Chatbot::tools()` (or `ChannelScope::tools()`):

```php
Chatbot::channel('support')
    ->context(['ticket' => $ticket])
    ->tools(['lookup_order', 'get_shipping_status']);
```

Any tool not in the allowlist is silently blocked for that channel even if it is registered globally.

### Controlling tool behavior

Config keys under `chatbot.tools`:

| Key | Default | Description |
|---|---|---|
| `max_calls_per_turn` | `5` | Total tool invocations per user message before the budget-exhausted guard fires |
| `default_timeout` | `10` | Per-tool wall-clock timeout in seconds |
| `replay_freshness` | `300` | How many seconds a cached tool replay remains valid |
| `default_max_arg_length` | `10240` | Max byte length for any single tool argument value |

Set `chatbot.provider.supports_tools` to `false` for providers that do not implement the OpenAI tool-call protocol; this skips the registry entirely and omits the `tools` field from all requests.

### Optional result persistence

Implement `PersistableTool` to control what gets stored in the `chatbot_tool_invocations` table:

```php
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;

final class LookupOrderTool implements ChatbotTool, PersistableTool
{
    // ... name/description/parameters/authorize/handle as above ...

    public function persist(ToolInvocation $invocation, mixed $result): ?array
    {
        // return null to skip persistence entirely
        return ['order_id' => $invocation->args['order_id'], 'status' => $result['status']];
    }
}
```

---

## GDPR and user data

Add the `HasChatbotData` trait to your `User` model to get built-in data access, deletion, and export:

```php
use Aanfarhan\Chatbot\Concerns\HasChatbotData;

class User extends Authenticatable
{
    use HasChatbotData;
}
```

The trait adds:

- `$user->chatbotConversations()` — Eloquent relation to all conversations
- `$user->deleteChatbotData(hard: false)` — soft-delete (or force-delete) all conversations
- `$user->exportChatbotData()` — returns a `chatbot-export@1` array with all messages

Console commands are also available for scripted operations (see [Console commands](#console-commands)).

---

## HTTP endpoints

| Route | Description |
|---|---|
| `POST /chatbot/messages` | Send a message; returns an SSE stream |
| `GET /chatbot/conversations/{id}/messages` | Fetch message history for a conversation |
| `GET /chatbot/health` | Health probe; returns `{version, active_streams, status}` |
| `GET /chatbot/widget.js` | Serves the bundled web component |

### SSE event shape

Every event sent on the `POST /chatbot/messages` stream has the form `{type, ...}`:

| Event | Payload fields |
|---|---|
| `token` | `content` |
| `done` | `conversation_id`, `usage: {input_tokens, output_tokens}` |
| `error` | `code`, `message`, `retryable` |
| `context_summary` | `summary` |
| `tool_started` | `name`, `phase` |
| `tool_finished` | `name`, `phase` |
| `tool_failed` | `name`, `phase` |

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

## Testing

Use the `InteractsWithChatbot` trait in your feature tests to extract the signed context token from a rendered response and post it to the messages endpoint:

```php
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;

class OrderChatTest extends TestCase
{
    use InteractsWithChatbot;

    public function test_chat_replies_about_order(): void
    {
        $fake = Chatbot::fake();
        $fake->addReply('Your order is on its way.');

        $page = $this->get('/orders/1');
        $token = $this->extractSignedContext($page);

        $this->post('/chatbot/messages', [
            'signed_context' => $token,
            'message' => 'Where is my order?',
        ])->assertOk();
    }
}
```

---

## SemVer commitments

### Public contract (stable across minor and patch releases)

- `Chatbot` facade method signatures (`context`, `prompt`, `greeting`, `summary`, `channel`, `tools`, `registerTool`, `clearTools`, `fake`, `quota`, `authorize`)
- Config keys in `chatbot.php`
- SSE event shape: `{type, ...}` with documented fields for `token`, `done`, `error`, `context_summary`, `tool_started`, `tool_finished`, `tool_failed`
- Signed envelope shape (public payload fields)
- Web component attributes: `channel`, `position`, `title`
- CSS custom properties: all eight `--chatbot-*` properties listed above
- CSS parts: all nine named parts listed above
- Event class names: `ChatbotMessageStarted`, `ChatbotMessageCompleted`, `ChatbotMessageFailed`, `ChatbotSuspiciousContextDetected`
- Typed exception class hierarchy under `ChatbotException`
- `ChatbotTool` and `PersistableTool` interface signatures
- `ToolInvocation` public constructor and properties

### Internal (may change in any release, including patches)

- Database schema — managed via migrations; run `php artisan migrate` on upgrade
- Base system prompt content — it is prompt tuning, not a contract
- HMAC algorithm and envelope encoding — the public interface is `mint/verify`, not the wire format

---

## Security

See [SECURITY.md](SECURITY.md) for the full threat model, what v1 defends against, what it does not, and host responsibilities.

---

## License

MIT
