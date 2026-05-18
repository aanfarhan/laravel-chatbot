# SSE events

`POST /chatbot/messages` returns a `text/event-stream` response. Each event is a JSON object with a `type` field plus type-specific fields. The shape is part of the [public contract](/guide/semver).

## Event types

| `type` | Fields | When |
| --- | --- | --- |
| `token` | `content: string` | Each chunk of streamed assistant prose. Concatenate `content` across all `token` events to assemble the message. |
| `context_summary` | `summary: string` | Once per turn, before the first `token`, if a channel `summary` is configured. |
| `tool_started` | `name: string`, `phase: "started"` | A tool invocation has begun. |
| `tool_finished` | `name: string`, `phase: "finished"` | A tool invocation completed successfully. |
| `tool_failed` | `name: string`, `phase: "failed"` | A tool invocation failed (schema rejection, `authorize()` returned false, handler exception, timeout, budget exhausted). |
| `done` | `conversation_id: int`, `usage: { input_tokens: int, output_tokens: int }` | Final event in a successful stream. Sent exactly once. |
| `error` | `code: string`, `message: string`, `retryable: bool` | Terminal error. The stream closes immediately after. |

::: warning
`tool_started` / `tool_finished` / `tool_failed` carry **only** the tool `name` and `phase`. Arguments and results are never sent to the client — clients only learn that a tool ran, not what was passed or returned.
:::

## Error codes

`error.code` is stable across releases. Match on this, never on `error.message`.

| Code | Source exception | Retryable |
| --- | --- | --- |
| `configuration_error` | `ChatbotConfigurationException` | `false` |
| `content_blocked` | `ChatbotContentBlockedException` | `false` |
| `forbidden_tool_argument` | `ForbiddenToolArgumentException` | `false` |
| `invalid_envelope` | `InvalidEnvelopeException` (incl. `Expired`, `Tampered`, `Mismatched`) | `false` |
| `provider_error` | `ChatbotProviderException` | per-instance |
| `quota_exceeded` | `ChatbotQuotaExceededException` | `false` |
| `timeout` | `ChatbotTimeoutException` | `true` |
| `token_cap_exceeded` | `ChatbotTokenCapExceededException` | `false` |

See [Exceptions](./exceptions) for the full hierarchy.

## Consuming the stream

### JavaScript (browser)

The bundled web component handles this for you. If you're writing a custom frontend:

```js
const res = await fetch('/chatbot/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ signed_context: token, message: 'hello' }),
})

const reader = res.body.getReader()
const decoder = new TextDecoder()
let buf = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buf += decoder.decode(value, { stream: true })
  for (const line of buf.split('\n\n')) {
    if (!line.startsWith('data: ')) continue
    const evt = JSON.parse(line.slice(6))
    switch (evt.type) {
      case 'token':         appendToken(evt.content); break
      case 'tool_started':  showToolChip(evt.name); break
      case 'tool_finished': clearToolChip(evt.name); break
      case 'tool_failed':   markToolFailed(evt.name); break
      case 'done':          finalize(evt.conversation_id, evt.usage); break
      case 'error':         showError(evt.code, evt.message); break
    }
  }
  buf = buf.endsWith('\n\n') ? '' : buf.slice(buf.lastIndexOf('\n\n') + 2)
}
```

### Example wire output

```
data: {"type":"context_summary","summary":"You assist customers on the order details page."}

data: {"type":"tool_started","name":"lookup_order","phase":"started"}

data: {"type":"tool_finished","name":"lookup_order","phase":"finished"}

data: {"type":"token","content":"Your "}

data: {"type":"token","content":"order "}

data: {"type":"token","content":"ships tomorrow."}

data: {"type":"done","conversation_id":123,"usage":{"input_tokens":412,"output_tokens":18}}
```
