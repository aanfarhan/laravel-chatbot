# Contracts

Public interfaces under `Aanfarhan\Chatbot\Contracts`. Every signature here is part of the [public contract](/guide/semver).

## `ChatbotTool`

```php
namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

interface ChatbotTool
{
    public function name(): string;

    public function description(): string;

    /** @return array<string, mixed> Hand-written JSON-schema in OpenAI's `parameters` shape. */
    public function parameters(): array;

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool;

    /** @return array<string, mixed>|string */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array|string;
}
```

### `name(): string`

The tool name the LLM uses to invoke this tool. Must be `[a-z][a-z0-9_]*`. Two registered tools with the same name — the later registration wins (and overwrites silently).

### `description(): string`

A human-readable description forwarded to the LLM verbatim. The model uses this to decide *when* to call the tool — write it as a prompt, not as developer documentation.

### `parameters(): array`

A hand-written JSON-schema-shaped array passed to the provider verbatim under the OpenAI `parameters` key. Strict validation runs against this schema before `authorize()`:

- No coercion (`"42"` ≠ `42`).
- No extra fields.
- Per-string-field size cap (`chatbot.tools.default_max_arg_length`, default 10240 bytes).

Identity-shaped property names (`user_id`, `account_id`, `tenant_id`, `actor_id`, `on_behalf_of`, …) are rejected at registration time with `ForbiddenToolArgumentException`.

### `authorize(?Authenticatable $actor, ToolInvocation $invocation): bool`

Decide whether `$actor` may invoke this tool with these arguments. Runs **after** schema validation and **before** `handle()`. Returning `false` short-circuits the invocation with a `permission_denied` outcome.

- `$actor` is `null` for guest turns. Decide explicitly.
- Scope authorisation by `$actor` only — never by anything in `$invocation->args`.

### `handle(?Authenticatable $actor, ToolInvocation $invocation): array|string`

Execute the tool. Return value is serialised to JSON (or used verbatim if a string) and fed back to the LLM as a `role: tool` message.

The threaded actor is **not** on `$invocation`. Scope all data access by `$actor`. See [ADR-0003](/adr/0003-threaded-actor-is-a-contract-parameter).

## `PersistableTool`

Optional. Implement alongside `ChatbotTool` to control what gets stored in `chatbot_tool_invocations`.

```php
namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Tools\ToolInvocation;

interface PersistableTool
{
    /** @return array<string, mixed>|null Sanitised payload, or null to skip persistence. */
    public function persist(ToolInvocation $invocation, mixed $result): ?array;
}
```

If you don't implement this, the package stores the raw arguments and JSON-encoded result. Implement it when:

- The result is sensitive and should be redacted in the audit trail.
- The result is very large and would balloon the table.
- The invocation should not be persisted at all (return `null`).

## `LLMClient`

The protocol-level client interface. Implement this only if you're swapping the bundled OpenAI-compatible client for a custom one (rare).

```php
namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Responses\ChatResponse;

interface LLMClient
{
    /**
     * @param list<array<string,mixed>> $messages
     * @param list<array<string,mixed>> $tools
     */
    public function chat(array $messages, array $tools = [], ?string $model = null): ChatResponse;

    /**
     * @param list<array<string,mixed>> $messages
     * @param list<array<string,mixed>> $tools
     * @return iterable<int, mixed>
     */
    public function stream(array $messages, array $tools = [], ?string $model = null): iterable;
}
```

Bind your implementation in a service provider:

```php
$this->app->bind(\Aanfarhan\Chatbot\Contracts\LLMClient::class, MyClient::class);
```

## `ConversationStore` and `ToolInvocationStore`

The default Eloquent-backed implementations live under `Aanfarhan\Chatbot\Stores`. These interfaces exist so hosts can swap in alternative persistence (e.g., a different database, a queue-based writer). The interface shape is **internal** for v1 — relying on it pins you to a moving target.
