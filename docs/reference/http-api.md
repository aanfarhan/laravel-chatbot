# HTTP endpoints

All routes are registered under `routes/chatbot*.php` and prefixed with `/chatbot`. Routes marked **public contract** are governed by the [semver policy](/guide/semver).

| Method | Path | Name | Controller | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/chatbot/messages` | `chatbot.messages` | `MessagesController` | public contract; under `route_middleware` |
| `GET` | `/chatbot/conversations/{id}/messages` | `chatbot.conversations.messages` | `HistoryController` | public contract; under `route_middleware` |
| `GET` | `/chatbot/health` | `chatbot.health` | `HealthController` | public contract; no middleware |
| `GET` | `/chatbot/widget.js` | `chatbot.widget-js` | _(inline closure)_ | public contract; no middleware |
| `GET` | `/chatbot/demo` | `chatbot.demo` | `DemoController` | active only when `demo.enabled = true`; under `route_middleware` |
| `GET` | `/chatbot/test-fixture` | `chatbot.playwright-fixture` | `PlaywrightFixtureController` | **internal** — active only when `playwright_fixture.enabled = true`; for the package's own e2e suite |

The `POST /chatbot/messages` and `GET /chatbot/conversations/{id}/messages` routes, plus the conditional render routes (`/chatbot/demo`, `/chatbot/test-fixture`), are wrapped in the [`route_middleware`](./configuration#route-middleware) group (default: `['web']`). `GET /chatbot/health` and `GET /chatbot/widget.js` are always outside that group.

## `POST /chatbot/messages`

Send a user message and stream the assistant reply.

### Request body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `signed_context` | string | ✓ | The signed envelope minted by `@chatbot` at page render. |
| `message` | string | ✓ | The user's message. |
| `conversation_id` | int | – | Continue an existing conversation. Omit to start a new one. |
| `client_extractors` | object | – | Map of `name → string` blocks produced by [client extractors](/guide/client-extractors). Each name must be in the envelope's allowlist. |

### Response

`Content-Type: text/event-stream`. See [SSE events](./sse-events) for the event shape.

### Errors

| Status | Cause |
| --- | --- |
| `403` | `InvalidEnvelopeException` family — tampered, expired, route/channel mismatched. |
| `422` | Validation failure (missing field, disallowed extractor name). |
| `429` | Throttle exceeded (`chatbot.throttle.per_minute` or `per_day`). |
| `500` | Internal error. Detail in logs. |

Provider/quota/timeout errors arrive on the open stream as `error` SSE events, not HTTP status codes.

## `GET /chatbot/conversations/{id}/messages`

Fetch the persisted message history for a conversation. `{id}` is the conversation's public UUID (string).

### Query parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `signed_context` | ✓ | The signed envelope minted by `@chatbot` at page render. The envelope's identity is used to verify ownership. |

### Response

```json
{
  "messages": [
    { "role": "user",      "content": "Where is my order?", "route_name": "orders.show", "context_hash": "abc123", "created_at": "2024-01-01T00:00:00+00:00" },
    { "role": "assistant", "content": "It ships tomorrow.", "route_name": "orders.show", "context_hash": "abc123", "created_at": "2024-01-01T00:00:01+00:00" }
  ]
}
```

If the channel has a `greeting` configured it is prepended as the first message (`role: assistant`) and is not stored in the database.

### Errors

| Status | Cause |
| --- | --- |
| `403` | Missing or invalid `signed_context`, or the conversation belongs to a different identity. |
| `404` | No conversation with that UUID. |

Access control uses the verified envelope identity — the conversation must be owned by that user (or matching guest token).

## `GET /chatbot/health`

Lightweight health probe.

### Response

```json
{
  "version": "1.0.0",
  "active_streams": 3,
  "status": "ok"
}
```

Use for liveness checks. Returns `200` with `status: ok` when the package is bootable and migrations are present; otherwise `503`.

## `GET /chatbot/widget.js`

Serves the bundled web component (`dist/chatbot-widget.js`) as `application/javascript`. The `@chatbot` Blade directive emits a `<script type="module" src="/chatbot/widget.js">` referencing this route.
