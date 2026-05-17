# Upgrade guide

## Unreleased — `ChatbotTool` contract: threaded actor is a parameter

The threaded actor has been promoted from a property on `ToolInvocation` to a
typed first parameter on `ChatbotTool::authorize()` and `ChatbotTool::handle()`.
This is a breaking change with no backward-compat shim. See
[ADR-0003](docs/adr/0003-threaded-actor-is-a-contract-parameter.md) for the
rationale.

### What changed

- `ChatbotTool::authorize()` and `ChatbotTool::handle()` now take
  `?Authenticatable $actor` as their first argument.
- The `actor` property has been removed from `ToolInvocation`. There is now
  exactly one place to read it: the `$actor` parameter.
- The tool-call loop reconstitutes `$actor` from the verified envelope's
  `userId` via the configured auth guard's user provider on every invocation.
- Guest turns receive `null`. The contract docblock spells this out; handlers
  must not treat `null` as an oversight.

### Migrating a tool

Before:

```php
use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;

final class LookupOrderTool implements ChatbotTool
{
    public function authorize(ToolInvocation $invocation): bool
    {
        return $invocation->actor !== null;
    }

    public function handle(ToolInvocation $invocation): array
    {
        return Order::where('user_id', $invocation->actor->getAuthIdentifier())
            ->findOrFail($invocation->args['order_id'])
            ->toArray();
    }
}
```

After:

```php
use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class LookupOrderTool implements ChatbotTool
{
    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        return $actor !== null;
    }

    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        return Order::where('user_id', $actor->getAuthIdentifier())
            ->findOrFail($invocation->args['order_id'])
            ->toArray();
    }
}
```

Mechanical migration:

1. Add `?Authenticatable $actor` as the first parameter to both `authorize()`
   and `handle()`.
2. Replace any `$invocation->actor` read with `$actor`.
3. Handle the `null` case explicitly: either deny in `authorize()`, or branch
   in `handle()`. Do not assume `$actor` is non-null.
