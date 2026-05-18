# Theming

The widget ships with a stable CSS customisation API made up of two surfaces:

- **CSS custom properties** for colours, radius, font, shadow, and z-index — for quick rebranding.
- **Named CSS parts** for targeting specific structural elements — for layout tweaks and bespoke styling.

Both are part of the package's [public SemVer contract](./semver) and won't break in minor or patch releases.

## CSS custom properties

Override any of the following on the `chatbot-widget` element, on `:root`, or anywhere the widget inherits style from.

| Property | Default | Description |
| --- | --- | --- |
| `--chatbot-primary` | `#6366f1` | Accent colour — launcher button, send button, user bubble |
| `--chatbot-on-primary` | `#ffffff` | Text/icon colour on primary surfaces |
| `--chatbot-surface` | `#ffffff` | Panel and message background |
| `--chatbot-on-surface` | `#1f2937` | Primary text colour |
| `--chatbot-radius` | `12px` | Border radius for the panel and message bubbles |
| `--chatbot-font` | `system-ui, sans-serif` | Font family |
| `--chatbot-shadow` | `0 8px 32px rgba(0,0,0,0.16)` | Box shadow on the floating panel |
| `--chatbot-z-index` | `9999` | Stack order for the launcher and panel |

### Example — brand colours

```css
chatbot-widget {
  --chatbot-primary: #0f172a;
  --chatbot-on-primary: #f8fafc;
  --chatbot-surface: #f8fafc;
  --chatbot-on-surface: #0f172a;
  --chatbot-radius: 8px;
}
```

### Example — per-channel theming

```css
chatbot-widget[channel="admin"]   { --chatbot-primary: #dc2626; }
chatbot-widget[channel="default"] { --chatbot-primary: #2563eb; }
```

## CSS parts

The widget exposes named parts targetable with `::part()` from your app's stylesheet. Use these when custom properties aren't granular enough.

| Part | Element |
| --- | --- |
| `launcher` | Floating launcher button |
| `panel` | The chat panel container |
| `header` | Panel title bar |
| `messages` | Scrollable message list |
| `message-user` | Individual user message bubble |
| `message-assistant` | Individual assistant message bubble |
| `input` | Text input field |
| `send-button` | Send button |
| `tool-status` | Transient status chip during tool-call execution |
| `extractor-chip` | Transparency chip listing extractors that ran on the current turn |

### Example — custom launcher size

```css
chatbot-widget::part(launcher) {
  width: 64px;
  height: 64px;
}
```

### Example — accent border on assistant bubbles

```css
chatbot-widget::part(message-assistant) {
  border-left: 3px solid var(--chatbot-primary);
  padding-left: 12px;
  border-radius: 0;
}
```

### Example — full-width inline header

```css
chatbot-widget[position="inline"]::part(header) {
  border-radius: 0;
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
}
```

## Web component attributes

The widget also accepts a small set of HTML attributes you can target in CSS or set at mount time:

| Attribute | Values | Default |
| --- | --- | --- |
| `channel` | Any string matching a configured channel | `default` |
| `position` | `bottom-right`, `bottom-left`, `inline` | `bottom-right` |
| `title` | Any string | (translated default) |

See the [Web component reference](/reference/web-component) for the complete attribute and method surface.

## Dark mode

Because the widget styles everything via custom properties on a single element, dark mode is as simple as toggling a class on `<html>` and swapping the variables:

```css
html.dark chatbot-widget {
  --chatbot-surface: #0f172a;
  --chatbot-on-surface: #e2e8f0;
  --chatbot-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
```
