# Domain glossary

Single source of truth for the language used in this package. Implementation details belong in code or ADRs, not here.

## Terms

### Tool
A named, host-owned PHP callable that the LLM can invoke mid-turn to fetch fresh data (or perform a read-only lookup) the static **Context** does not contain. Tools run in the host Laravel app with full access to its services. The package never defines tools itself — it only orchestrates discovery, invocation, and result feedback.

Related: [[context]], [[tool-registry]], [[tool-allowlist]].

### Tool definition
The host-side declaration of a single tool: `name`, human-readable `description`, JSON-schema `parameters` (hand-written array literal in OpenAI's `parameters` shape, passed through to the provider verbatim), and `handler`. The canonical form is a class implementing the package's `ChatbotTool` contract; a closure shorthand is accepted for prototyping but not preferred.

### Tool registry
The process-wide map of `name → tool definition` populated by the host application (typically in a service provider). The package looks tools up by name from this registry when the LLM emits a tool call.

### Tool allowlist
The subset of tool names a given **Channel** is permitted to call. Declared per-request in the controller alongside `Chatbot::context(...)`, signed into the **Context envelope**, and enforced server-side at invocation time. A tool not on the allowlist is invisible to the LLM and rejected if somehow called.

### Context
The static, host-supplied data block injected into the system prompt at conversation start. Contrast with **Tool**, which fetches data dynamically during a turn.

### Channel
A named widget mount point (e.g. `default`, `admin`). Carries its own prompt, context, and — under this feature — tool allowlist.

### Tool invocation
A single execution of a [[tool]] handler triggered by the LLM. Carries the LLM-supplied arguments, the authenticated actor (or null for guests), the channel, and the verified static context from the envelope. The package calls the tool's `authorize()` with this invocation before `handle()`; both methods are required on the contract so authorization is never an accidental omission. Handlers should scope by the threaded actor, never by LLM-supplied identity arguments.

### Tool-call loop
The provider-driven cycle within a single user message: model emits `tool_calls` → server resolves each call against the [[tool-registry]] (gated by the [[tool-allowlist]]) → executes handlers → appends results as `role: tool` messages → re-invokes the provider. Repeats until the model produces final prose or a configured iteration cap is hit.

### Tool status event
A structured SSE event emitted to the frontend during the [[tool-call-loop]] carrying only the tool `name` and lifecycle phase (`started`, `finished`, `failed`). Arguments and results are never sent to the client. The widget renders these as a transient status chip (themable via existing CSS-parts).

### Tool invocation record
The persisted trace of a single [[tool-invocation]] — tool name, (optionally redacted) arguments, (optionally redacted) result, timestamp, and the conversation message it belongs to. Stored in its own table (not inlined on `messages`) so tool usage can be queried independently for audit, debugging, and analytics.

### Freshness window
The maximum age of a stored [[tool-invocation-record]] for which its result is replayed into the LLM's history on subsequent user turns. Older records are kept for audit but omitted from replay, forcing the model to re-call the tool if it still needs that data. Default 5 minutes; configurable per channel.

### Context envelope
The signed, short-lived token minted at page render that carries the channel's context payload and metadata to the `/messages` endpoint. Will be extended to carry the tool allowlist.
