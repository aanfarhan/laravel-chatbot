# Testing helpers

Two pieces ship for tests: a fake LLM client and a trait for extracting signed envelopes from rendered views.

For narrative usage, see the [Testing guide](/guide/testing).

## `Chatbot::fake(): FakeClient`

Bind `Aanfarhan\Chatbot\Clients\FakeClient` into the container as the active `LLMClient` and return it.

```php
$fake = Chatbot::fake();
```

### `FakeClient` methods

**Queueing responses** (consumed in FIFO order):

| Method | Description |
| --- | --- |
| `respondWith(string $reply): self` | Queue a single text reply for the next `chat()` or `stream()` call. |
| `respondWithStream(array $chunks): self` | Queue a sequence of string chunks as the next stream response. |
| `respondWithToolCall(string $name, array $arguments, string $callId = 'call_1'): self` | Stage a single tool call as the next stream response. The real tool handler runs for real. |
| `respondWithToolCalls(array $calls): self` | Stage multiple tool calls as the next stream response. Each entry is `['name' => ..., 'arguments' => ..., 'id' => ...]`. |
| `throwDuringStream(\Throwable $exception, array $chunksBefore = []): self` | Queue an exception thrown mid-stream, optionally after some chunks. |

**Assertions:**

| Method | Description |
| --- | --- |
| `assertSentPrompt(callable $callback): void` | Assert that at least one recorded prompt satisfied `$callback(array $messages): bool`. |
| `assertSentWithModel(string $model): void` | Assert a call was made with the given model string. |
| `assertNothingSent(): void` | Assert no `chat()` or `stream()` calls occurred. |
| `assertToolCalled(string $name, ?callable $argsCallback = null): void` | Assert a tool result message for `$name` appears in the recorded prompts. Pass `$argsCallback(array $args): bool` to also assert on arguments. |
| `assertToolNotCalled(string $name): void` | Assert no tool result message for `$name` was recorded. |

**Inspection:**

| Method | Description |
| --- | --- |
| `recordedPrompts(): array` | Return all recorded message arrays, in call order. |
| `lastSentTools(): array` | Return the tool definitions passed on the last `stream()` call. |
| `wasStreamAborted(): bool` | Return whether the last stream generator was abandoned before exhaustion. |

::: tip
The fake honours the full tool-call loop: if you `respondWithToolCall()` followed by `respondWith()`, your tool's `authorize()` and `handle()` run for real, the result is appended, and the queued reply closes the turn. This makes it a true end-to-end fake, not a mock.
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

$fake->assertSentPrompt(fn ($messages) => collect($messages)->contains(
    fn ($m) => str_contains(json_encode($m), '"name":"lookup_order"')
));
```

### Asserting a tool actually ran

```php
$fake = Chatbot::fake();
$fake->respondWithToolCall('lookup_order', ['order_id' => 1]);
$fake->respondWith('Your order ships tomorrow.');

$this->post('/chatbot/messages', [...]);

$this->assertDatabaseHas('chatbot_tool_invocations', [
    'tool_name' => 'lookup_order',
    'status'    => 'ok',
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
