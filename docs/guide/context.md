# Context

**Context** is the static, host-supplied data block that gets injected into the system prompt at conversation start. It's the package's primary mechanism for telling the LLM *what page the user is looking at*.

Contrast with [tools](./tool-calling), which fetch data dynamically during a turn, and [client extractors](./client-extractors), which forward live page state at user-message-send time.

## Setting context

From a controller or route handler:

```php
use Aanfarhan\Chatbot\Facades\Chatbot;

Chatbot::context([
    'order'    => new OrderResource($order),
    'customer' => $order->customer->only(['id', 'name', 'email']),
]);
```

`Chatbot::context($array)` accepts any associative array. Values may be scalars, nested arrays, or anything that implements `Arrayable` / `JsonSerializable` (most Laravel resources do).

For a named [channel](./channels), use the fluent builder:

```php
Chatbot::channel('admin')->context([
    'report' => $reportData,
]);
```

## What happens to your context

When the Blade view renders `@chatbot`, the package:

1. Reads the per-channel context you set.
2. Mints an HMAC-SHA256–signed envelope (`ContextEnvelope`) carrying the payload plus the user id, route name, channel, allowlists, and an expiry.
3. Emits a `<chatbot-widget>` element with the signed token as an attribute.

When the widget POSTs a message to `/chatbot/messages`, the server:

1. Verifies the envelope signature, expiry, route binding, and channel binding (`InvalidEnvelopeException` on any failure).
2. Runs the verified payload through `ContextSanitizer`, which HTML-entity-escapes any tags listed in `chatbot.sanitizer_tags` (default: `context`, `system`, `instructions`, `assistant`, `user`).
3. Hands the sanitized payload to `PromptAssembler`, which serialises it as a JSON block inside the system prompt.

## Security properties

| Property | Mechanism |
| --- | --- |
| Tamper detection | HMAC-SHA256 using `app.key`. Any modification to the envelope payload invalidates the signature. |
| Replay window | Fixed 900s TTL (`chatbot.envelope_ttl`, internal — see [SemVer](./semver)). |
| Cross-route confusion | Envelope is bound to the route name where it was minted; submitting it from another route raises `MismatchedEnvelopeException`. |
| Cross-user impersonation | Envelope is bound to the `userId` resolved from the configured auth guard at mint time. |
| Tag-shape injection | The sanitizer strips XML-style tags that would otherwise let context values appear as system instructions. |

The `ChatbotSuspiciousContextDetected` [event](/reference/events) fires when the sanitizer rewrites at least one key, giving you an observation hook.

## What does NOT belong in context

- **Identity for authorization.** Never put `user_id`, `account_id`, etc. into context expecting your tools to read them. Tools receive the verified actor via a dedicated [threaded-actor](./threaded-actor) parameter. The package will refuse to register tools whose JSON schema declares identity-shaped argument names.
- **Live state.** If the data changes between page render and user send, you want a [tool](./tool-calling) or [client extractor](./client-extractors), not context.
- **Secrets.** Treat the envelope as readable by the user — they hold the rendered HTML. Don't put API keys or other server-only secrets in there.
- **Large blobs.** The envelope is base64-encoded into an HTML attribute; budget on a few KB of compact JSON. For larger data, expose it via a tool.

## Inspecting what the LLM will see

```bash
php artisan chatbot:inspect-prompt \
  --route=orders.show \
  --channel=default \
  --user=42 \
  --context-json=sample-order.json
```

This dumps the exact `messages` array (system prompt included) that would be sent to the provider for the given route + context, without making a live call. Use it during pen-testing or to debug surprising assistant behaviour.

## See also

- [Channels](./channels) — partitioning context by audience
- [Tool calling](./tool-calling) — dynamic data fetched during a turn
- [Client extractors](./client-extractors) — live page snapshots forwarded per turn
- [Security](./security) — full threat model
