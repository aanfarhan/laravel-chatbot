# Chatbot facade

`Aanfarhan\Chatbot\Facades\Chatbot` is the package's single entry point. Every method here is part of the [public contract](/guide/semver).

```php
use Aanfarhan\Chatbot\Facades\Chatbot;
```

Behind the facade is `Aanfarhan\Chatbot\Chatbot`, an application-singleton manager bound by `ChatbotServiceProvider`.

## Channel selection

### `context(array $context): self`

Set the static context for the **default** channel. Replaces any previously-set value.

```php
Chatbot::context(['order' => $order->toArray()]);
```

### `channel(string $name): ChannelScope`

Return a fluent [`ChannelScope`](./channel-scope) for the named channel. Use this for any channel other than `default`.

```php
Chatbot::channel('admin')->context(['report' => $report]);
```

### `prompt(string $prompt): self`

Override the **default** channel's system prompt for this request.

### `greeting(string $greeting): self`

Override the **default** channel's greeting for this request.

### `summary(callable|string $summary): self`

Override the **default** channel's summary for this request. A `callable` is evaluated at envelope-mint time.

### `tools(list<string> $tools): self`

Set the **default** channel's per-request tool allowlist. Overrides `chatbot.channels.default.allowed_tools`.

```php
Chatbot::tools(['lookup_order', 'get_shipping_status']);
```

## Tool registry

### `registerTool(string $class): void`

Register a class implementing [`ChatbotTool`](./contracts#chatbottool). Typically called from a service provider's `boot()`.

```php
Chatbot::registerTool(\App\Chatbot\Tools\LookupOrderTool::class);
```

Registering the same `name()` twice replaces the earlier entry. Identity-shaped parameter names (`user_id`, `account_id`, …) are rejected at this call with `ForbiddenToolArgumentException`. See [Threaded actor](/guide/threaded-actor).

### `clearTools(): void`

Empty the registry. Useful in tests.

## Request authorisation & quota

### `authorize(callable $resolver): self`

Register a per-request authorisation callback. `$resolver` receives an `Illuminate\Http\Request` and returns truthy/falsy.

```php
Chatbot::authorize(fn ($req) => $req->user()?->can('use-chatbot'));
```

If not set, all requests passing the envelope check are authorised.

### `quota(callable $resolver): self`

Register a per-request quota callback. Resolver returns either a boolean or `['allow' => bool, 'reason' => string]`.

```php
Chatbot::quota(fn ($req) => [
    'allow'  => $req->user()->dailyTokensRemaining() > 0,
    'reason' => 'Daily quota reached',
]);
```

A `false` result surfaces as an SSE `error` event with `code: quota_exceeded`.

## Rendering

### `renderWidget(string $channel = 'default'): string`

Return the HTML snippet for `<chatbot-widget>` plus its loader script. The `@chatbot` Blade directive is a thin wrapper around this method.

```php
echo Chatbot::renderWidget();          // default channel
echo Chatbot::renderWidget('admin');   // admin channel
```

## Testing

### `fake(): FakeClient`

Bind a `FakeClient` into the container as `LLMClient` and return it for queueing.

```php
$fake = Chatbot::fake();
$fake->addReply('Your order is on its way.');
```

See [Testing helpers](./testing-helpers).

## Method-resolution table

| Facade method | Backing implementation |
| --- | --- |
| `context(array)` | `Chatbot::context()` |
| `channel(string)` | `Chatbot::channel()` |
| `prompt(string)` | `Chatbot::prompt()` |
| `greeting(string)` | `Chatbot::greeting()` |
| `summary(callable\|string)` | `Chatbot::summary()` |
| `tools(list<string>)` | `Chatbot::tools()` |
| `registerTool(string)` | `Chatbot::registerTool()` |
| `clearTools()` | `Chatbot::clearTools()` |
| `authorize(callable)` | `Chatbot::authorize()` |
| `quota(callable)` | `Chatbot::quota()` |
| `renderWidget(string)` | `Chatbot::renderWidget()` |
| `fake()` | `Chatbot::fake()` |
