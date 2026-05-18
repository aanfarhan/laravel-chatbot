# Quick start

This page walks you from a fresh install to a working contextual chat in five minutes.

## 1. Provide context in a controller

```php
use Aanfarhan\Chatbot\Facades\Chatbot;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Support\Facades\Route;

Route::get('/orders/{order}', function (Order $order) {
    Chatbot::context([
        'order' => new OrderResource($order),
    ]);

    return view('orders.show', compact('order'));
})->name('orders.show');
```

Anything you pass into `Chatbot::context()` is signed into the page envelope when the widget renders, then injected verbatim into the system prompt server-side. The LLM sees `order.id`, `order.line_items[0].name`, etc.

::: tip Use resources, not models
`Chatbot::context()` accepts any array-shaped value. Pass through an API resource (or `->toArray()`) so the LLM sees the same projection your API exposes — never the raw Eloquent model with internal columns.
:::

## 2. Mount the widget

```blade
{{-- resources/views/layouts/app.blade.php --}}
<body>
    @yield('content')
    @chatbot
</body>
```

The `@chatbot` directive emits a `<chatbot-widget>` custom element bound to the signed envelope for the current request. The widget bundles the launcher button, the floating panel, the message list, and the input.

## 3. Visit the page

Navigate to `/orders/1`. A launcher button appears in the bottom-right. Open it, type *"Where is my order shipping to?"*, hit send.

You should see:

- A **streaming** assistant response (tokens arrive over SSE).
- A persistent conversation record under `chatbot_conversations` keyed to the authenticated user (or a guest token).

## 4. Test it without a real LLM

In a feature test:

```php
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;

class OrderChatTest extends TestCase
{
    use InteractsWithChatbot;

    public function test_chat_replies_about_order(): void
    {
        $fake = Chatbot::fake();
        $fake->addReply('Your order is on its way.');

        $page  = $this->get('/orders/1');
        $token = $this->extractSignedContext($page);

        $this->post('/chatbot/messages', [
            'signed_context' => $token,
            'message'        => 'Where is my order?',
        ])->assertOk();
    }
}
```

See [Testing](./testing) for the full helper surface.

## 5. Where to next

| If you want to… | Read |
| --- | --- |
| Run multiple bots in one app (admin vs customer, etc.) | [Channels](./channels) |
| Let the LLM call your PHP code mid-turn | [Tool calling](./tool-calling) |
| Forward live DOM/form state to the LLM | [Client extractors](./client-extractors) |
| Match the widget to your brand | [Theming](./theming) |
| Comply with data-deletion requests | [GDPR & user data](./gdpr) |
| Understand the threat model | [Security](./security) |
