# Tool calling

Tools let the LLM call your application code during a conversation turn — to fetch live data, look up a record, or perform a read-only side effect. They are the dynamic complement to the static [context](./context).

::: info Trust boundary
The package never defines tools. The host defines them in PHP and registers them in a service provider. The package orchestrates discovery, allowlisting, schema validation, authorisation, invocation, persistence, and replay.
:::

## Scaffold a tool

```bash
php artisan chatbot:make-tool GetWeather
```

This writes a worked-example class to `app/Chatbot/Tools/GetWeatherTool.php` implementing `ChatbotTool` with a realistic `parameters()` schema, an `authorize()` body that requires an authenticated `$actor`, and `// TODO` markers for the bits you fill in. The command also prints the exact `Chatbot::registerTool(...)` line for your service provider.

Re-running against an existing file fails fast with `Use --force to overwrite`. Pass `--force` to regenerate.

To customise the template across your app, publish the stub:

```bash
php artisan vendor:publish --tag=chatbot-stubs
```

Edit `stubs/chatbot-tool.stub` — the command prefers the published copy when present.

## Implement a tool by hand

```php
use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class LookupOrderTool implements ChatbotTool
{
    public function name(): string
    {
        return 'lookup_order';
    }

    public function description(): string
    {
        return 'Retrieve a single order by its ID for the authenticated user.';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order_id' => [
                    'type' => 'integer',
                    'description' => 'The order ID to fetch',
                ],
            ],
            'required' => ['order_id'],
        ];
    }

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

See the [`ChatbotTool` contract reference](/reference/contracts#chatbottool) for full signatures.

## Register a tool

In `AppServiceProvider::boot()` (or any service provider):

```php
use Aanfarhan\Chatbot\Facades\Chatbot;

Chatbot::registerTool(LookupOrderTool::class);
```

Registration is a process-wide map (`name` → tool definition). Registering the same name twice replaces the earlier entry. `Chatbot::clearTools()` empties the registry (mainly useful for tests).

## Per-channel allowlists

A registered tool is invisible on a channel unless that channel's allowlist names it:

```php
Chatbot::channel('support')
    ->context(['ticket' => $ticket->toArray()])
    ->tools(['lookup_order', 'get_shipping_status']);
```

Allowlist behaviour:

- The list is signed into the [context envelope](./context) at page render.
- The server enforces it at invocation time — a tool not on the allowlist is rejected even if the model is somehow induced to call it.
- A channel with no allowlist exposes **no** tools. Exposure is opt-in.
- Tool definitions can also be declared statically in config:

  ```php
  'channels' => [
      'support' => [
          'allowed_tools' => ['lookup_order', 'get_shipping_status'],
      ],
  ],
  ```

  Runtime `->tools([...])` overrides the config value when set.

## The tool-call loop

For a single user message, the model may invoke multiple tools in sequence:

```
model emits tool_calls → server resolves each → schema-validate →
authorize() → handle() → append results as `role: tool` →
re-invoke provider → repeat until final prose or budget exhausted
```

Knobs (`chatbot.tools.*`):

| Key | Default | Purpose |
| --- | --- | --- |
| `max_calls_per_turn` | `5` | Total invocations across the loop. Hitting the cap injects a synthetic budget-exhausted result so the model still produces prose. |
| `default_timeout` | `10` | Per-tool wall-clock timeout in seconds. |
| `default_max_arg_length` | `10240` | Max byte length for any single string argument value. |
| `replay_freshness` | `300` | How long a stored invocation remains valid for replay into history (currently not wired in — see [Security](./security)). |

## Provider compatibility

For providers that don't implement OpenAI's `tools` field (some self-hosted Ollama configs), disable the registry:

```php
// config/chatbot.php
'provider' => [
    'supports_tools' => false,
],
```

This skips the registry entirely and omits the `tools` field from all requests. The runtime client also detects a `400` "tools not supported" rejection and retries once without `tools` as a defensive fallback.

## Optional result persistence

Tools that implement `PersistableTool` get control over what is stored in `chatbot_tool_invocations`:

```php
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;

final class LookupOrderTool implements ChatbotTool, PersistableTool
{
    // ... name/description/parameters/authorize/handle as above ...

    public function persist(ToolInvocation $invocation, mixed $result): ?array
    {
        return [
            'order_id' => $invocation->args['order_id'],
            'status'   => $result['status'],
        ];
    }
}
```

Return `null` to skip persistence entirely.

## Argument schema validation

Every invocation is validated against the tool's `parameters()` JSON schema before `authorize()` runs:

- No coercion. `"42"` will not satisfy `{type: integer}`.
- No extra fields. Properties not declared in the schema are rejected.
- String values are capped at `chatbot.tools.default_max_arg_length` (default 10 KiB).

Failures:

- Count against the `max_calls_per_turn` budget.
- Are persisted as a tool-invocation record with status `rejected_schema`.
- Surface to the widget as a `tool_failed` SSE event.

This is what keeps the trust model honest: the model's emitted JSON cannot include arguments your handler wasn't prepared for, and identity-shaped arguments (`user_id`, `account_id`, etc.) are blocked at registration time. See the next page on the [threaded actor](./threaded-actor) for the full rule.

## See also

- [Threaded actor](./threaded-actor) — why `?Authenticatable $actor` is a method parameter, not on `ToolInvocation`
- [ADR-0001](/adr/0001-global-tool-registry-with-per-channel-allowlist) — registry + allowlist architecture
- [ADR-0002](/adr/0002-persist-tool-invocations-with-freshness-window) — invocation persistence and replay
- [Contracts reference](/reference/contracts)
- [SSE events](/reference/sse-events) — `tool_started`, `tool_finished`, `tool_failed`
