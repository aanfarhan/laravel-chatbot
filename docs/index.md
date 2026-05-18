---
layout: home

hero:
  name: Laravel Chatbot
  text: Context-aware chat for any Laravel page
  tagline: Declare what the chat should see in your controller. The package handles signing, streaming, tool calls, persistence, and the widget.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/aanfarhan/laravel-chatbot

features:
  - title: Signed page context
    details: Inject any Eloquent resource or array into the chat session. The package mints an HMAC-signed envelope per page render — no client-supplied identity ever reaches your tools.
  - title: Host-owned tools
    details: Register PHP callables the LLM can invoke mid-turn. Strict JSON-schema validation, per-channel allowlists, and a threaded actor parameter make identity spoofing impossible by construction.
  - title: Client extractors
    details: Pull live DOM state, form values, or selected text into each user turn — wrapped as untrusted data, stripped from history replay, never confused with instructions.
  - title: OpenAI-compatible
    details: Works with OpenAI, Azure, OpenRouter, Groq, Ollama, and any other provider that speaks the OpenAI chat-completions protocol.
  - title: Streaming first
    details: Native SSE streaming with structured lifecycle events for tool calls. Backpressure-aware, abort-on-disconnect, with a wall-clock cap.
  - title: GDPR-friendly
    details: Built-in trait for user data access, export, anonymisation, and deletion. Artisan commands for retention pruning and per-user purges.
---
