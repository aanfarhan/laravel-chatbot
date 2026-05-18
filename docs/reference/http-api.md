# HTTP endpoints

All routes are registered in `routes/chatbot.php` and prefixed with `/chatbot`. They are part of the [public contract](/guide/semver).

| Method | Path | Name | Controller |
| --- | --- | --- | --- |
| `POST` | `/chatbot/messages` | `chatbot.messages` | `MessagesController` |
| `GET` | `/chatbot/conversations/{id}/messages` | `chatbot.conversations.messages` | `HistoryController` |
| `GET` | `/chatbot/health` | `chatbot.health` | `HealthController` |
| `GET` | `/chatbot/widget.js` | `chatbot.widget-js` | _(inline closure)_ |

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

Fetch the persisted message history for a conversation.

### Response

```json
{
  "conversation_id": 123,
  "channel": "default",
  "messages": [
    { "role": "user",      "content": "Where is my order?",       "created_at": "..." },
    { "role": "assistant", "content": "It ships tomorrow.",       "created_at": "..." }
  ]
}
```

Access control: the controller resolves the conversation and 404s for any caller other than its owning user (or guest token).

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
