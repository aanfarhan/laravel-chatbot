# Testing helpers

Two pieces ship for tests: a fake LLM client and a trait for extracting signed envelopes from rendered views.

For narrative usage, see the [Testing guide](/guide/testing).

## `Chatbot::fake(): FakeClient`

Bind `Aanfarhan\Chatbot\Clients\FakeClient` into the container as the active `LLMClient` and return it.

```php
$fake = Chatbot::fake();
```

### `FakeClient` methods

| Method | Description |
| --- | --- |
| `addReply(string $content): void` | Queue a single assistant reply. Consumed in FIFO order. |
| `queueToolCall(string $name, array $args): void` | Queue an assistant turn that emits a `tool_calls` payload with the given tool. The real tool handler runs against your real implementation. |
| `assertCalledTimes(int $n): void` | Assert how many `chat()`/`stream()` invocations occurred. |
| `assertLastPromptContains(string $needle): void` | Assert the last prompt sent to the fake contains `$needle`. Useful for verifying context made it into the system prompt. |
| `flush(): void` | Empty queued replies. |

::: tip
The fake honours the full tool-call loop: if you `queueToolCall()` followed by `addReply()`, your tool's `authorize()` and `handle()` run for real, the result is appended, and the queued reply closes the turn. This makes it a true end-to-end fake, not a mock.
:::

## `InteractsWithChatbot` trait

```php
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
```

### `extractSignedContext(TestResponse $response): string`

Parses `<chatbot-widget signed-context="...">` from the response HTML, decodes HTML entities, and returns the token. Throws `RuntimeException` if no widget is rendered.

```php
$page  = $this->get('/orders/1');
$token = $this->extractSignedContext($page);

$this->post('/chatbot/messages', [
    'signed_context' => $token,
    'message'        => 'Where is my order?',
])->assertOk();
```

## Patterns

### Asserting a tool was offered

```php
$fake = Chatbot::fake();
Chatbot::registerTool(\App\Chatbot\Tools\LookupOrderTool::class);

$this->get('/orders/1');
$this->post('/chatbot/messages', [...]);

$fake->assertLastPromptContains('"name": "lookup_order"');
```

### Asserting a tool actually ran

```php
$fake = Chatbot::fake();
$fake->queueToolCall('lookup_order', ['order_id' => 1]);
$fake->addReply('Your order ships tomorrow.');

$this->post('/chatbot/messages', [...]);

$this->assertDatabaseHas('chatbot_tool_invocations', [
    'tool_name' => 'lookup_order',
    'status'    => 'success',
]);
```

### Unit-testing a tool in isolation

```php
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use App\Chatbot\Tools\LookupOrderTool;

it('rejects guests', function () {
    $tool = new LookupOrderTool;

    expect($tool->authorize(
        actor: null,
        invocation: new ToolInvocation(args: ['order_id' => 1], channel: 'default', context: []),
    ))->toBeFalse();
});
```
