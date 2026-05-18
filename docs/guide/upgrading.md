# Upgrading

This page is a high-level upgrade narrative. For machine-friendly per-release notes (breaking changes, migration recipes, deprecations), see the canonical [`UPGRADE.md`](https://github.com/aanfarhan/laravel-chatbot/blob/main/UPGRADE.md) in the repo and the [GitHub Releases](https://github.com/aanfarhan/laravel-chatbot/releases) page.

## Routine upgrade

```bash
composer update aanfarhan/laravel-chatbot
php artisan migrate
php artisan vendor:publish --tag=chatbot-config --force   # only if you've never customised
```

If you have customised `config/chatbot.php`, do **not** force-republish. Compare new keys against your file using:

```bash
diff config/chatbot.php vendor/aanfarhan/laravel-chatbot/config/chatbot.php
```

## Recent breaking changes

### Threaded actor → contract parameter

In an early release the `actor` lived on `ToolInvocation`. It has been promoted to a typed first parameter on `ChatbotTool::authorize()` and `ChatbotTool::handle()`. No backwards-compat shim is provided.

**Before:**

```php
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
```

**After:**

```php
use Illuminate\Contracts\Auth\Authenticatable;

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
```

See [Threaded actor](./threaded-actor) and [ADR-0003](/adr/0003-threaded-actor-is-a-contract-parameter) for the rationale.

## Upgrade workflow

1. Read the [release notes](https://github.com/aanfarhan/laravel-chatbot/releases) for every version between yours and the target.
2. Skim [`UPGRADE.md`](https://github.com/aanfarhan/laravel-chatbot/blob/main/UPGRADE.md) for breaking-change entries.
3. Run `composer update`.
4. Run `php artisan migrate`.
5. Run your test suite, paying attention to anything using `Chatbot::fake()` or implementing `ChatbotTool`.
6. Deploy.

## See also

- [SemVer commitments](./semver) — what is stable vs internal
- [UPGRADE.md](https://github.com/aanfarhan/laravel-chatbot/blob/main/UPGRADE.md) — per-release migration steps
