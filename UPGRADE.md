# Upgrade guide

## 1.3.0 — Tool timeouts are advisory

No code changes required. Tool timeouts became advisory rather than enforced
(the package never actually interrupted a synchronous tool); see
[ADR-0006](docs/adr/0006-advisory-tool-timeouts-not-hard-interruption.md).

- Defaults are unchanged and no config key was renamed: `stream_duration`
  stays 60s, `tools.default_timeout` stays 10s.
- `chatbot.stream_duration` is now a published config key
  (`CHATBOT_STREAM_DURATION`). It was already read by the runtime; publishing it
  only makes it discoverable. It measures **LLM-streaming wall-clock only** and
  excludes time blocked in synchronous tool handlers.
- A tool that overruns `tools.default_timeout` is no longer interrupted and its
  result is no longer discarded — the completed result is always used and the
  invocation is flagged `overran`. If you relied on `default_timeout` to stop a
  runaway tool, it never did: add real timeouts inside your handlers
  (HTTP-client timeouts, query limits) and offload long work to a queue.

## 1.2.2 — Reserved [[client-extractor]] name: `blade-snapshot`

The extractor name `blade-snapshot` is now reserved by the package for the
`@chatbotSnapshot` Blade directive. Registering an extractor under that name
(PHP-side or JS-side) throws. See
[ADR-0005](docs/adr/0005-blade-snapshot-rides-the-client-extractor-pipeline.md).

## 1.1.4 — `ChatbotTool` contract: threaded actor is a parameter

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
