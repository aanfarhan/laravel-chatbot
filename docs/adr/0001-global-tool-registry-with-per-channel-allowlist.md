# Global tool registry with per-channel allowlist

## Context

Tools (host-owned PHP callables the LLM can invoke for fresh data) need a registration surface. The natural-looking choice — register tools per route in the controller, mirroring `Chatbot::context([...])` — was rejected because tool registration happens at page-render time, but tool *invocation* happens later at `/messages`, possibly across processes. Closures cannot be signed into the envelope and resurrected server-side.

## Decision

Tools are registered once in a service provider into a process-wide registry keyed by name. Each request's controller declares which subset of names this channel may call (`Chatbot::tools(['lookup_order', ...])`), and that allowlist is signed into the context envelope. At `/messages`, the package resolves names against the registry, gated by the signed allowlist.

The signed envelope carries **names only** — schemas are read from the current registry at the start of every turn. This keeps the envelope compact and lets schema changes ship via deploy without invalidating outstanding envelopes.

## Considered alternatives

- **Per-channel registration in the controller.** Rejected: closures can't be persisted across the render → message-send boundary, and inlining handler code at every controller would multiply auth-sensitive surface.
- **Full tool definitions signed in the envelope.** Rejected: bloats the token, double-sources the schema (envelope vs code), and makes legitimate schema changes painful.

## Consequences

- A tool registered globally is still invisible to any channel that doesn't allowlist it; the trust model stays "the controller declares what this page's chatbot can reach", just with names instead of callables.
- If a name in a signed envelope no longer resolves at invocation (tool removed between page render and message send), the package feeds an error result back to the model rather than failing the conversation — matching how timeouts and per-tool errors are handled.
