Status: done

# Type Eloquent models and fix downstream property/cookie/request errors

## What to build

PHPStan reports ~25 errors stemming from untyped Eloquent models: `Illuminate\Database\Eloquent\Model` has no declared `$role`, `$content`, `$created_at`, `$route_name`, `$context_hash`, so every site that reads these properties fails. Cascading from this, several controller sites also fail on request/cookie input typing.

Fix at the source: add `@property` (and `@property-read` where appropriate) PHPDoc blocks to `Message` and `Conversation` models so larastan can resolve column types. Then sweep the downstream controller/store sites that still need explicit casts for request input and cookies.

## Acceptance criteria

- [ ] `Message` and `Conversation` models carry `@property` docblocks for every column (incl. `id`, `role`, `content`, `created_at`, `updated_at`, `route_name`, `context_hash`, plus FK columns)
- [ ] `EloquentConversationStore::*` (line ~100 `Collection::map()` variance) resolves cleanly
- [ ] `MessagesController::resolveConversation()` `$guestToken` signature accepts the union actually passed in, or callers narrow before the call; `cookie()` call no longer passes `int` where `string|null` expected
- [ ] `HistoryController` no longer has the `$store` write-only error and mixed-cast errors are resolved
- [ ] `HealthController` mixed-cast resolved
- [ ] `vendor/bin/phpstan analyse` reports 0 errors in: `Models/Message.php`, `Models/Conversation.php`, `Stores/EloquentConversationStore.php`, `Http/Controllers/MessagesController.php`, `Http/Controllers/HistoryController.php`, `Http/Controllers/HealthController.php`
- [ ] `vendor/bin/pint` is clean

## Blocked by

None - can start immediately
