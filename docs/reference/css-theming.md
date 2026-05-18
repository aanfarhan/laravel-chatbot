# CSS theming

The widget exposes a stable CSS API. Both custom properties and named parts are part of the [public contract](/guide/semver).

For worked examples and use cases, see the [Theming guide](/guide/theming).

## CSS custom properties

| Property | Default |
| --- | --- |
| `--chatbot-primary` | `#6366f1` |
| `--chatbot-on-primary` | `#ffffff` |
| `--chatbot-surface` | `#ffffff` |
| `--chatbot-on-surface` | `#1f2937` |
| `--chatbot-radius` | `12px` |
| `--chatbot-font` | `system-ui, sans-serif` |
| `--chatbot-shadow` | `0 8px 32px rgba(0,0,0,0.16)` |
| `--chatbot-z-index` | `9999` |

Set on `chatbot-widget`, `:root`, or any ancestor — they inherit through the shadow DOM.

## CSS parts

| Part | Element |
| --- | --- |
| `launcher` | Floating launcher button. |
| `panel` | The chat panel container. |
| `header` | Panel title bar. |
| `messages` | Scrollable message list. |
| `message-user` | A user message bubble. |
| `message-assistant` | An assistant message bubble. |
| `input` | The text input field. |
| `send-button` | The send button. |
| `tool-status` | Transient status chip shown during a tool call. |
| `extractor-chip` | Transparency chip listing extractors that ran on the current turn. |

Target with `::part(name)`:

```css
chatbot-widget::part(launcher) {
  width: 64px;
  height: 64px;
}
```

## Selector matrix

| Goal | Selector |
| --- | --- |
| Theme one channel | `chatbot-widget[channel="admin"] { --chatbot-primary: ...; }` |
| Theme inline-mounted widgets | `chatbot-widget[position="inline"]::part(panel) { ... }` |
| Dark mode | `html.dark chatbot-widget { --chatbot-surface: ...; ... }` |
| Always-visible panel | `chatbot-widget::part(panel) { display: block; }` |

## What is NOT in the API

- Internal element class names. Inspecting the shadow DOM and targeting `.chatbot__panel` (or similar) will break in any release.
- Animation/transition timings. Customise via `transition` overrides on a `::part(...)` selector instead.
- Z-index of the launcher relative to the panel. Use `--chatbot-z-index` to relocate the whole stack.
