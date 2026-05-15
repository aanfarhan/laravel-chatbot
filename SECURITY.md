# Security

## Threat model

This package mediates between a host Laravel application and a third-party LLM. The attack surface is:

1. **Context forgery / replay** — a client that forges or replays a signed context envelope to impersonate another user or escalate privileges.
2. **Prompt injection via context data** — user-controlled data reaching the system prompt as instructions rather than data.
3. **Bot-output XSS** — the LLM returns content that the web component renders as HTML, enabling script injection.
4. **Worker exhaustion** — an adversary sending messages that cause runaway LLM calls, consuming server threads and API budget.

---

## What v1 defends against

| Threat | Mitigation |
|---|---|
| Context forgery / replay | HMAC-signed `ContextEnvelope` with a configurable TTL (`chatbot.envelope_ttl`, default 900 s). An expired or tampered token is rejected with HTTP 403. |
| Basic tag-shape injection | `ContextSanitizer` strips the tags configured in `chatbot.sanitizer_tags` (default: `context`, `system`, `instructions`, `assistant`, `user`) from context values before they enter the prompt. |
| Bot-output XSS | The web component passes LLM output through a DOMPurify allowlist before inserting it into the DOM. Only a curated set of formatting tags is permitted. |
| Worker exhaustion | Each SSE stream runs with an abort signal tied to the client disconnect. The `CHATBOT_TIMEOUT` environment variable caps wall-clock time per request. |

---

## What v1 does NOT defend against

| Gap | Notes |
|---|---|
| Sophisticated prompt injection | Multi-turn, encoded, or indirect injection (e.g. instructions embedded in a user's order notes) is not detected or blocked. |
| Post-render content drift | The DOMPurify pass runs at insertion time; dynamic DOM mutations after render are outside the component's control. |
| Base64-encoded or obfuscated payloads | The sanitizer operates on plaintext strings; it does not decode or classify encoded content. |
| Two-pass content classification | No secondary classifier runs on LLM output to detect policy violations before display. |
| Automatic retry / model fallback | If the LLM returns an error or an empty response, the package surfaces the failure; it does not retry or switch models. |

---

## Host responsibilities

Deploying this package does not absolve the host application of broader security and compliance obligations. The host is responsible for:

- **Privacy policy and user disclosure** — informing end-users that their messages are forwarded to a third-party LLM provider.
- **Subprocessor disclosure** — listing the LLM vendor as a subprocessor in your data processing agreement and privacy notices.
- **Retention decisions** — configuring `chatbot.retention_days` (per channel) to match your data-retention policy. The default is 30 days. Set to `null` to retain indefinitely.
- **Dollar-cost governance** — the package tracks token usage and supports per-channel `daily_quota` caps, but budget alerts and hard stops at the provider level are the host's responsibility.
- **Vendor integrations** — the package uses the OpenAI-compatible API format. Switching providers, setting rate limits at the API gateway level, and monitoring for vendor outages are outside this package's scope.

---

## Pen-testing aid

Use the `chatbot:inspect-prompt` Artisan command to review the exact message array sent to the LLM for any route without making a live request:

```
php artisan chatbot:inspect-prompt --route=orders.show --channel=default --context-json=sample.json
```

Flags:

| Flag | Required | Description |
|---|---|---|
| `--route` | yes | Named route being simulated (used for labelling) |
| `--channel` | no | Channel name (default: `default`) |
| `--user` | no | User ID to include in the inspection header |
| `--context-json` | no | Path to a JSON file with sample context payload |

The command outputs the full message array as pretty-printed JSON, with a header showing the inspection parameters. It uses the same `PromptAssembler` and `ContextSanitizer` as the live request path, so the output is authoritative.
