# Web component

The widget is a custom element with tag name `<chatbot-widget>`. The bundled script (`/chatbot/widget.js`) registers it on load. Both the tag name and the attribute/method surface listed here are part of the [public contract](/guide/semver).

## Mounting

The `@chatbot` Blade directive emits:

```html
<script type="module" src="/chatbot/widget.js"></script>
<chatbot-widget channel="default" signed-context="..."></chatbot-widget>
```

You can mount manually for advanced cases:

```html
<chatbot-widget
    channel="support"
    position="bottom-left"
    title="Need help?"
    signed-context="{{ $signedContext }}"
></chatbot-widget>
```

`signed-context` must come from `Chatbot::renderWidget()` (or equivalent server-side mint). Do not hand-craft it.

## Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `channel` | string | `default` | The channel name. Used for theming (`[channel="..."]` selectors) and for the server's envelope verification. |
| `position` | `bottom-right` \| `bottom-left` \| `inline` | `bottom-right` | Where the launcher sits. `inline` removes the floating positioning. |
| `title` | string | (localised default) | Title shown in the panel header. |
| `signed-context` | string | — | The signed envelope from the server. **Required.** |

## Methods

Call these on the element after it's in the DOM.

### `registerClientExtractor(name, fn, options)`

Register a [client extractor](/guide/client-extractors) that runs at user-message send-time.

```ts
chatbotWidget.registerClientExtractor(
  name: string,
  fn: () => string | Promise<string>,
  options?: { description?: string },
): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | string | Must match a name in the channel's signed `allowed_extractors` allowlist. |
| `fn` | `() => string \| Promise<string>` | The extractor body. Returns the string to forward (`''` to skip this turn). May be async; awaited up to `extractor_timeout_ms`. |
| `options.description` | string | Human-readable description shown in the transparency chip (e.g., *"Read from page: Checkout form fields"*). |

Calling `registerClientExtractor` with a `name` not in the envelope's allowlist throws synchronously — fail-loud at boot rather than failing silently at send time.

## CSS API

See [Theming](/guide/theming) for the full custom-property and CSS-part reference.

## Events

The widget does not currently dispatch custom DOM events on the host page. If you need observability, listen to the SSE response yourself (see [SSE events](./sse-events)) or subscribe to the PHP events fired server-side ([Events reference](./events)).
