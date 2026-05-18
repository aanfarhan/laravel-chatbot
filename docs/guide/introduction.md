# Introduction

`aanfarhan/laravel-chatbot` is a Composer package that drops a context-aware chatbot widget onto any Laravel page. You declare what data the conversation should see in your controller, and the package handles the rest: signing, streaming, persistence, tool calling, theming, and the frontend web component.

## What you get

- A Blade directive (`@chatbot`) that mounts a styleable web component on any page.
- A signed page-context envelope so the LLM only ever sees data your controller approved — never anything from the client.
- A tool-calling loop that lets the LLM invoke host-owned PHP callables mid-turn, with strict identity guarantees.
- A client-extractor mechanism for forwarding live page state (form values, selected text, DOM data) on each user turn as clearly-delimited untrusted content.
- Per-channel configuration for model, prompt, allowlists, throttling, retention, and theming.
- Server-Sent Events streaming with structured lifecycle events for the frontend.
- A GDPR-friendly persistence layer with built-in artisan commands for export, pruning, anonymisation, and per-user deletion.

## When to use this package

Use it when your application has structured per-page data — an order, a report, a ticket, a dashboard — and you want users to ask the LLM questions about *that specific thing* without writing a bespoke chat backend.

You do **not** need this package if you only need a "talk to a generic chatbot" surface with no per-page context. A simpler integration directly with your provider's SDK will be smaller.

## Conceptual model

A single user turn flows like this:

1. **Render** — your controller calls `Chatbot::context([...])` and renders a view containing `@chatbot`. The package mints a signed envelope carrying the context payload, the channel name, the user id, the route name, the tool allowlist, and the client-extractor allowlist.
2. **Send** — the widget posts the signed envelope plus the user message (and any extractor blocks) to `POST /chatbot/messages`.
3. **Verify** — the server verifies the envelope's signature, TTL, route, and channel binding, and reconstitutes the authenticated actor.
4. **Assemble** — the system prompt is built from the configured base prompt, the channel prompt, the verified static context, the assistant greeting, and conversation history.
5. **Stream** — the prompt is sent to the configured OpenAI-compatible provider. Tokens stream back over SSE.
6. **Tool calls** — if the model emits `tool_calls`, the server resolves each against the per-channel allowlist, validates arguments against each tool's JSON schema, runs `authorize()` then `handle()`, appends results, and re-invokes the provider. Repeats up to `chatbot.tools.max_calls_per_turn`.
7. **Persist** — the message, usage metadata, and any tool invocations are written to the database.

See [Tool calling](./tool-calling) and [Client extractors](./client-extractors) for the trust-boundary mechanics.

## Compatibility

| Requirement | Version |
| --- | --- |
| PHP | 8.3+ |
| Laravel | 11 or 12 |
| LLM provider | Any OpenAI chat-completions–compatible endpoint (OpenAI, Azure OpenAI, OpenRouter, Groq, Ollama, vLLM, etc.) |
| Browser | Any browser supporting native Web Components + EventSource (all modern evergreens) |

## What's next

- [Install the package](./installation)
- Walk through a minimal [Quick start](./quickstart)
- Read the [Channels](./channels) and [Context](./context) concepts to understand the trust model
- Once comfortable, browse the [Reference](/reference/configuration) for exhaustive enumerations of every config key, contract, and event
