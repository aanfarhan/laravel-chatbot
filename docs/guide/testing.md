# Testing

The package ships a small testing surface: a fake LLM client and a trait for extracting signed envelopes from rendered views. Together they let you write end-to-end feature tests that exercise the full request path without hitting a real provider.

## The fake LLM client

```php
use Aanfarhan\Chatbot\Facades\Chatbot;

$fake = Chatbot::fake();
$fake->addReply('Your order is on its way.');
$fake->addReply('Shipping to 123 Example St.');
```

`Chatbot::fake()` binds `LLMClient` in the container to a `FakeClient` and returns it. Queued replies are consumed in order as your test triggers chats.

The fake client also lets you assert what was sent:

```php
$fake->assertCalledTimes(1);
$fake->assertLastPromptContains('order #1');
```

## Extracting a signed envelope

Use the `InteractsWithChatbot` trait to pull the signed context token out of a rendered Blade response:

```php
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

`extractSignedContext()` parses the `<chatbot-widget signed-context="...">` attribute from the response HTML and returns the decoded token. It throws a `RuntimeException` if no widget is rendered — useful for catching mis-wired layouts.

## Pest example

```php
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;

uses(InteractsWithChatbot::class);

it('answers questions about the order', function () {
    Chatbot::fake()->addReply('It ships tomorrow.');

    $page = $this->get('/orders/1');

    $this->post('/chatbot/messages', [
        'signed_context' => $this->extractSignedContext($page),
        'message'        => 'When does my order ship?',
    ])->assertOk();
});
```

## Testing tools without a real LLM

For tool-level testing, instantiate your tool class directly and pass a `ToolInvocation`:

```php
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use App\Chatbot\Tools\LookupOrderTool;

it('refuses guest callers', function () {
    $tool = new LookupOrderTool;

    $invocation = new ToolInvocation(
        args:    ['order_id' => 1],
        channel: 'default',
        context: [],
    );

    expect($tool->authorize(actor: null, invocation: $invocation))->toBeFalse();
});
```

For end-to-end tool tests, queue an assistant turn that emits a `tool_calls` payload on the fake client:

```php
$fake = Chatbot::fake();
$fake->queueToolCall('lookup_order', ['order_id' => 1]);
$fake->addReply('Your order total is $42.00.');
```

The streaming pipeline will resolve the tool, run `authorize()` and `handle()` against your real implementation, append the result, and continue with the queued reply.

## Inspecting the assembled prompt

```bash
php artisan chatbot:inspect-prompt \
  --route=orders.show \
  --channel=default \
  --user=42 \
  --context-json=tests/fixtures/order.json
```

Useful when a test fails because the LLM "isn't seeing" expected context — the inspector shows the exact `messages` array the provider would receive.

## See also

- [Testing helpers reference](/reference/testing-helpers)
