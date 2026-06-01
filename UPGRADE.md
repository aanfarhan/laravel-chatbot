# Upgrade guide

## v1.5.0 — Demo mode removed

**Breaking.** The demo trio is gone: the `chatbot:demo` command, the
`GET /chatbot/demo` route and its `DemoController`, the demo Blade view, and the
`chatbot.demo` config block (`CHATBOT_DEMO` env). The service provider no longer
binds `LLMClient` to a `FakeClient` based on `chatbot.demo.enabled`.

Effects after upgrade:

- `/chatbot/demo` returns **404**.
- `chatbot.demo` / `CHATBOT_DEMO` are **inert** — setting them does nothing.
- A dev who relied on `CHATBOT_DEMO=true` for a no-API-key fake driver now falls
  through to the real `OpenAiCompatibleClient` (with whatever `CHATBOT_API_KEY`
  is set, possibly empty).

### What you must do

- Remove `CHATBOT_DEMO` from any `.env` and drop the `demo` block when you next
  reconcile `config/chatbot.php`.
- To confirm the widget works without spending tokens, bind the fake client in a
  feature test instead — `Chatbot::fake()` is unchanged and still public:

```php
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;

$fake = Chatbot::fake();        // binds LLMClient to an in-memory fake
$fake->addReply('Hello from the fake client.');
```

See the [Testing guide](docs/guide/testing.md) and
[ADR-0010](docs/adr/0010-demo-lives-in-a-separate-showcase-project.md) for the
rationale. Feature showcases now live in a separate project, not the package.

## Next major — Package routes ship under `web` middleware by default

**Breaking.** Package routes now load under a host-configurable middleware
group, `chatbot.route_middleware`, defaulting to `['web']`. Previously routes
loaded bare (no `VerifyCsrfToken`, `StartSession`, or `EncryptCookies`). The
`web` default makes Laravel's CSRF check a real, independent second barrier on
top of the signed envelope. See
[ADR-0009](docs/adr/0009-routes-under-configurable-web-middleware-with-envelope-identity.md)
for the full rationale.

The version bump itself is a maintainer release decision; this note describes
the migration regardless of the number it ships under.

### What you must do

- **Render `<meta name="csrf-token">` on any host page that mounts the widget.**
  With `web` active, `POST /chatbot/messages` is now CSRF-protected. The bundled
  widget reads the token from that meta tag and sends it as `X-CSRF-TOKEN`. A
  page that omits the tag gets its `POST` rejected with `419 Page Expired`.

  ```blade
  <meta name="csrf-token" content="{{ csrf_token() }}">
  ```

### Opt-out

- Set `chatbot.route_middleware => []` to restore the previous middleware-free
  behavior (no CSRF check, no session, no cookie encryption on package routes).
  Identity rides the signed envelope on both the read and write paths, so the
  feature works correctly under any `route_middleware` value, including `[]`.

### One-time cookie reset

- `web` includes `EncryptCookies`. Existing **plaintext** `chatbot_guest_id` and
  `chatbot_conversation_{channel}` cookies set under the old regime fail to
  decrypt once the group is active, so Laravel drops them once — a single loss
  of guest/conversation continuity on upgrade. Set and read are symmetric
  afterward. This is transparent to the JS client: the conversation id lives in
  `localStorage` and the guest cookie is `httpOnly` (never read in JS).

### No action required

- **History now scopes by the signed envelope, not the session.**
  `HistoryController` takes ownership identity from the verified envelope's
  `userId` (matching `MessagesController`), so a missing or invalid envelope is
  rejected `403` on both the authenticated and guest branches. This removes a
  latent coupling on session middleware; no host change is needed. Noted for
  completeness.

## Next — Tool-invocation rejection paths now persist audit records

Previously, allowlist rejections (`tool not permitted on this channel`) and
not-found rejections (`tool not found in registry`) silently returned an error
message to the model without writing a `chatbot_tool_invocations` row. Starting
with this release every invocation path persists a record.

### New `InvocationStatus` values

`ToolInvocationStore::record()` now receives one of six status strings:

| Status | When written |
|---|---|
| `ok` | Handler ran to completion (unchanged) |
| `rejected_schema` | Arguments failed JSON-schema validation (unchanged) |
| `handler_error` | Handler threw an exception (unchanged) |
| `rejected_allowlist` | Tool name not in the verified channel allowlist — **new, previously un-persisted** |
| `rejected_not_found` | Tool name not registered — **new, previously un-persisted** |
| `rejected_unauthorized` | `authorize()` returned `false` — **new status string; was `handler_error` in prior releases** |

### Migration

If your application queries `chatbot_tool_invocations` and filters by
`status = 'handler_error'` expecting to catch unauthorized calls, update that
query to also include `status = 'rejected_unauthorized'`.

If your application asserts **no row** is written when a tool call is rejected
by the allowlist or registry, those assertions must be updated — a record is
now written for every invocation path.

No schema migration is required: the `status` column already stores an
arbitrary string.

## 1.4.0 — Minimum PHP lowered to 8.2

No action required. The minimum PHP version dropped from 8.3 to 8.2 to widen
compatibility — apps still on PHP 8.2 (with Laravel 11 or 12) can now install
the package. Existing 8.3/8.4 consumers are unaffected.

- This is a strictly more-permissive change, so it ships as a minor release.
- The package floor is now pinned by the toolchain: `phpstan.neon` sets
  `phpVersion: 80200`, so any 8.3+ syntax or function (e.g. `json_validate()`,
  typed class constants) is flagged at analysis time, and CI runs the test
  suite against 8.2.
- Raising the floor again later would drop a supported platform and therefore
  require a major release.

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
