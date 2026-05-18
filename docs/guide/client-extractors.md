# Client extractors

Client extractors let the widget pull live data from the host page — form state, selected text, DOM values, route state — and forward it with each user message turn. The LLM receives the extracted content as explicitly delimited, untrusted context, never as instructions.

Extractors are the client-side mirror image of [tools](./tool-calling):

| Aspect | Tools | Client extractors |
| --- | --- | --- |
| Where they run | Host PHP, server-side | Host JS, in the browser |
| When | Mid-turn, when LLM emits a `tool_call` | At user-message-send time, every turn |
| Trust | Output is host-vetted (you wrote the handler) | Output is **untrusted page material** |
| Authorization | `authorize()` + threaded actor | Never used for auth — output is data only |
| History | Replayed back into the prompt within freshness window | Stripped from history on subsequent turns |

## Register an extractor (JavaScript)

After the widget mounts, call `registerClientExtractor(name, fn, options)` on the widget element:

```js
document.querySelector('chatbot-widget').registerClientExtractor(
  'form_state',
  () => {
    const form = document.getElementById('checkout-form')
    return form ? new URLSearchParams(new FormData(form)).toString() : ''
  },
  { description: 'Checkout form fields' },
)
```

The extractor function:

- Receives no arguments. Pull whatever you need from the live DOM / app state.
- Must return a **string**. Return `''` to skip on this turn.
- May be `async`; the widget awaits it up to `extractor_timeout_ms`.

The widget displays a transparency chip after each send — *"Read from page: Checkout form fields"* — so end-users see what page data was forwarded.

## Allowlist per channel (PHP config)

The widget will not run an extractor whose name is not listed in the channel's allowlist. The allowlist is signed into the page envelope at render time, so the server can reject any inbound block whose name is not allowed:

```php
// config/chatbot.php
'channels' => [
    'support' => [
        'allowed_extractors'       => ['form_state', 'selected_text'],
        'extractor_timeout_ms'     => 500,    // default: 250 ms
        'extractor_size_cap_bytes' => 16384,  // default: 8192 bytes
    ],
],
```

If the widget reports an extractor name that the envelope did not allow, the server rejects the request with HTTP 422.

## Where extracted content lands in the prompt

Each allowed extractor's output is attached to **that turn's user message** (not the system prompt) as a clearly-delimited, name-labelled block:

```text
<client-extractor name="form_state" trust="untrusted-page-content">
quantity=2&shipping=express&promo=
</client-extractor>

What's my total with promo NEWUSER?
```

A system-prompt rule instructs the model to treat the contents as data, not instructions.

## What makes extractors safe

| Property | Mechanism |
| --- | --- |
| Allowlisting | Channel must opt-in by name. Per-channel; no global default. |
| Tamper detection | Allowlist is signed into the envelope. Mismatched name → HTTP 422. |
| Size cap | Per-extractor `extractor_size_cap_bytes`. Oversize output is truncated and logged. |
| Time cap | Per-extractor `extractor_timeout_ms`. Slow extractors are skipped (not failed). |
| History stripping | Extracted blocks are stripped from history replay; only fresh blocks appear on each turn. |
| Identity-shape blocking | Extractor names matching identity patterns (`user_id`, `account_id`, etc.) are rejected at config load. |
| Indirection signal | Each block is wrapped in `<client-extractor>` tags with a `trust="untrusted-page-content"` marker. |

## What extractors are NOT for

- **Authorization.** Never use extracted values to decide whether a user can do something. Use the [threaded actor](./threaded-actor) for that.
- **Persisting state.** Extracted blocks are stripped from history. If you need long-lived state, that's [context](./context) or a [tool](./tool-calling).
- **Untrusted-to-trusted bridging.** Don't write a server-side tool that reads extracted content from history and treats it as ground truth.

## Residual risk

When a channel allowlists extractors **and** mutating tools simultaneously, an indirect prompt injection in the extracted content (for example, a hostile string injected into a customer note) could coerce the model into calling those tools with attacker-chosen arguments.

Soft defences (the wrapping tags, the system-prompt rule, modern model alignment) reduce this risk but do not eliminate it. The hard mitigation is to keep the extractor allowlist and the mutating-tool allowlist disjoint per channel — for example, a read-only support channel can safely allowlist `selected_text`, while an admin channel with `reset_password` should not.

See [ADR-0004](/adr/0004-client-extractors-untrusted-by-construction) for the rationale and [Security](./security) for the full residual-risk discussion.

## See also

- [Web component reference](/reference/web-component) — full `registerClientExtractor()` signature
- [Configuration reference](/reference/configuration#channels) — extractor channel keys
- [ADR-0004](/adr/0004-client-extractors-untrusted-by-construction)
