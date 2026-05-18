# Threaded actor

The **threaded actor** is the verified, host-side identity that owns a conversation turn. It is the only place a tool may read identity from — never from LLM-supplied arguments, and never from static context.

This page explains why the contract is shaped the way it is, what guarantees the package enforces, and how to write tools that honour the rule.

## The rule

Inside `ChatbotTool::authorize()` and `ChatbotTool::handle()`, you receive `?Authenticatable $actor` as the **first parameter**. This is the actor reconstituted server-side from the verified envelope's `userId` via the configured auth guard's user provider.

```php
public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool;
public function handle(?Authenticatable $actor, ToolInvocation $invocation): array|string;
```

- `$actor` is **non-null** for authenticated turns.
- `$actor` is **null** for guest turns — handle this explicitly.
- `$actor` is **not** carried on `$invocation` (no `$invocation->actor` property exists).

## Why it's a parameter, not a property

If `actor` lived on `$invocation` alongside `args` and `context`, a careless tool could read identity from the wrong place — for example by doing `$invocation->args['user_id'] ?? $invocation->actor->id`. Putting `$actor` on the method signature makes that mistake structurally harder: there is no actor-shaped value in `$invocation` to fall back to.

See [ADR-0003](/adr/0003-threaded-actor-is-a-contract-parameter) for the full rationale.

## What the package enforces

### Identity-shaped argument blocking

At tool registration time, the package inspects the JSON schema returned by `parameters()`. If any property name matches an identity-shaped pattern, registration fails loudly with `ForbiddenToolArgumentException`.

Blocked names (case-insensitive):

- `user_id`, `userId`
- `account_id`, `accountId`
- `tenant_id`, `tenantId`
- `actor_id`, `actorId`
- `on_behalf_of`, `onBehalfOf`
- Common variants of the above

::: tip
If your tool genuinely needs an entity ID that happens to look like an identity (e.g., `customer_id` for a B2B admin tool that looks up *other* customers' data), choose a name that doesn't trigger the pattern (e.g., `customer_reference`) and document the authorisation rule in the description.
:::

### Actor reconstitution

On every tool invocation, the runtime:

1. Reads `userId` from the verified envelope.
2. Resolves it through the configured auth guard's user provider (`config('auth.defaults.guard')` by default).
3. Passes the result as `$actor`.

This means your handler always receives a fully-hydrated `Authenticatable` (typically your `App\Models\User`), not a bare ID.

## Scoping data access by `$actor`

```php
public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
{
    abort_if($actor === null, 401);

    return Order::query()
        ->where('user_id', $actor->getAuthIdentifier())
        ->findOrFail($invocation->args['order_id'])
        ->toArray();
}
```

The `findOrFail` scopes by `$actor->getAuthIdentifier()`, so even if the LLM passes someone else's `order_id`, the query returns no rows and 404s.

## Guest turns

If your application allows unauthenticated users to chat, your tool must decide explicitly what to do:

```php
public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
{
    return $actor !== null;
}
```

Returning `false` from `authorize()` causes the invocation to short-circuit with a `permission_denied` outcome, persisted and surfaced as a `tool_failed` SSE event. The model is told the tool refused; it produces prose as if the data is unavailable.

## See also

- [Tool calling](./tool-calling)
- [`ChatbotTool` contract](/reference/contracts#chatbottool)
- [`ToolInvocation` reference](/reference/tool-invocation)
- [ADR-0003](/adr/0003-threaded-actor-is-a-contract-parameter)
