# ToolInvocation

`Aanfarhan\Chatbot\Tools\ToolInvocation` is the value object passed to `ChatbotTool::authorize()` and `ChatbotTool::handle()`.

```php
namespace Aanfarhan\Chatbot\Tools;

final readonly class ToolInvocation
{
    /**
     * @param array<string, mixed> $args     LLM-supplied arguments (JSON-decoded)
     * @param array<string, mixed> $context  Verified static context from the envelope
     */
    public function __construct(
        public array $args,
        public string $channel,
        public array $context,
    ) {}
}
```

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `args` | `array<string, mixed>` | Arguments the LLM emitted for this tool call, decoded from JSON and validated against the tool's `parameters()` schema. |
| `channel` | `string` | The channel this invocation belongs to. Useful when one tool is allowlisted on multiple channels and needs to behave differently. |
| `context` | `array<string, mixed>` | The verified static context payload from the page envelope. Same data the LLM sees in the system prompt — already through `ContextSanitizer`. |

## What's not here

::: warning
There is **no** `actor` property. The threaded actor is delivered as the first parameter to `authorize()` and `handle()`, not on `$invocation`.
:::

This is intentional and structural — see [Threaded actor](/guide/threaded-actor) and [ADR-0003](/adr/0003-threaded-actor-is-a-contract-parameter). Reading identity from `$invocation->args` or attempting to recover an actor from `$invocation->context` defeats the package's identity-spoofing protection.

## Constructing for tests

The class is a plain readonly value object — instantiate it directly in unit tests:

```php
use Aanfarhan\Chatbot\Tools\ToolInvocation;

$invocation = new ToolInvocation(
    args:    ['order_id' => 1],
    channel: 'support',
    context: ['ticket' => ['id' => 99]],
);

$result = $tool->handle(actor: $authenticatedUser, invocation: $invocation);
```
