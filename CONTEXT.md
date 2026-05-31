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

### Conversation
A single ongoing thread of user/assistant turns on one [[channel]]. Owned by exactly one party — an authenticated host user **or** a guest — never both, and possibly neither once anonymized (see [[conversation-ownership]]). The widget resumes a conversation across page loads by presenting its identifier; the server only honours that identifier for the party that owns the conversation.

### Conversation ownership
The rule that binds a [[conversation]] to the party allowed to read or append to it. An authenticated requester is matched on host user identity only; a guest is matched on their guest token only — the two are never cross-honoured, so a logged-in user cannot resume a guest thread (or vice versa) by carrying a stale token. A conversation owned by neither party (e.g. after GDPR anonymization) is reusable by no one. Enforced server-side on both the read path (history) and the append path (messages); a presented identifier that fails the ownership check is treated as absent — the server silently starts a fresh conversation rather than revealing that the identifier exists. The identifier presented by the client is the conversation's exposed UUID handle, never its internal primary key. See ADR-0008.

### Channel
A named widget mount point (e.g. `default`, `admin`). Carries its own prompt, context, and — under this feature — tool allowlist.

### Channel settings
The resolved configuration for a [[channel]], read through one module that owns a single resolution rule: **per-channel value → global value → default**, applied uniformly to every setting (model, throttle limits, [[freshness-window]], prompt, greeting, summary, extractor allowlist and limits). The rule is strict on type — a config value of the wrong type fails loud (the framework's typed getters throw) rather than silently degrading to the default; only a *missing* key falls through to the next level. Defaults live once in a flat constants holder, referenced by both the published config file and the resolver. The module hides only the merge rule — pure global scalars with no per-channel dimension (e.g. token cap, stream duration, tool caps) are read directly through the framework's typed config getters, not fronted here, to avoid a shallow pass-through interface. Distinct from the in-memory overrides set by the fluent builder on the `Chatbot` facade, which take precedence over this resolver but are not owned by it.

### Tool invocation
A single execution of a [[tool]] handler triggered by the LLM. Carries the LLM-supplied arguments, the channel, and the verified static context from the envelope. The [[threaded-actor]] is NOT on the invocation; it is passed as a separate typed first parameter to `authorize()` and `handle()` (see ADR-0003). The package calls the tool's `authorize()` before `handle()`; both methods are required on the contract so authorization is never an accidental omission.

### Tool-call loop
The provider-driven cycle within a single user message: model emits `tool_calls` → server resolves each call against the [[tool-registry]] (gated by the [[tool-allowlist]]) → executes handlers → appends results as `role: tool` messages → re-invokes the provider. Repeats until the model produces final prose or a configured iteration cap is hit.

### Tool status event
A structured SSE event emitted to the frontend during the [[tool-call-loop]] carrying only the tool `name` and lifecycle phase (`started`, `finished`, `failed`). Arguments and results are never sent to the client. The widget renders these as a transient status chip (themable via existing CSS-parts). Written through the [[stream-emitter]], the same seam every other turn event uses.

### Stream emitter
The seam through which every server-sent event of a turn is written — assistant tokens, the context summary, the [[tool-status-event]], and the terminal `done`/`error`. A single instance is shared across the turn so events originating in the [[tool-call-loop]] and inside each [[tool-invocation]] interleave in wire order. The production adapter writes SSE frames and flushes; tests substitute a recording adapter, making the ordered event stream the assertion surface instead of a captured output buffer.

### Tool invocation record
The persisted trace of a single [[tool-invocation]] — tool name, (optionally redacted) arguments, (optionally redacted) result, timestamp, whether it overran its [[advisory-tool-budget]], the terminal status (see [[tool-invocation-result]]), and the conversation message it belongs to. Stored in its own table (not inlined on `messages`) so tool usage can be queried independently for audit, debugging, and analytics. Every invocation leaves a record, including rejected ones (allowlist, unknown tool, schema, authorization) — there is no silent path.

### Tool invocation result
The transient, in-memory outcome of a single [[tool-invocation]]: the `role: tool` message fed back to the model, the handler's wall-clock duration (excluded from the [[stream-duration]] budget per ADR-0006), and a status drawn from a fixed set — `ok`, `rejected_allowlist`, `rejected_not_found`, `rejected_schema`, `rejected_unauthorized`, `handler_error`. Distinct from the [[tool-invocation-record]]: the result is what the [[tool-call-loop]] consumes in-memory and discards after the turn, while the record is its durable audit trace.

### Advisory tool budget
The per-tool wall-clock duration a [[tool-invocation]] is measured against. **Advisory, not enforcing**: the package runs the tool's handler synchronously and cannot interrupt a blocking call, so it records the duration and an overrun flag on the [[tool-invocation-record]] but always lets a completed result through. Bounding a tool's actual runtime is the host's responsibility (HTTP-client timeouts, query limits, offloading long work to a queue). Global default, configurable. See ADR-0006.

### Stream duration
The wall-clock budget for LLM token streaming within a single SSE response, measured **excluding** time spent blocked in synchronous [[tool-invocation]] handlers. Guards against a runaway model stream; it does not — and under the [[advisory-tool-budget]] cannot — bound time spent inside tools. The lifetime of a connection that calls slow tools is bounded instead by the tool-call budget (max calls per turn) and host infrastructure limits. See ADR-0006.

### Freshness window
The maximum age of a stored [[tool-invocation-record]] for which its result is replayed into the LLM's history on subsequent user turns. Older records are kept for audit but omitted from replay, forcing the model to re-call the tool if it still needs that data. Default 5 minutes; configurable per channel.

### Conversation replay
The reconstructed prior history for a resolved [[conversation]], ready to slot between the system prompt and the current user message: prior user/assistant turns loaded from the store, interleaved in wire order with the tool call/result pairs still inside the [[freshness-window]]. Owns the two subtle rules of that reconstruction — (1) the **stale-call filter**: each stored [[tool-invocation-record]] is re-checked against today's rules (tool still registered, arguments still valid under its current schema) and only still-valid pairs replay, the rest dropped silently but left in the DB for audit; (2) the **interleave**: a stable chronological sort that keeps each call/result pair adjacent, breaks timestamp ties in load order, and drops content-free tool-only assistant turns (their pair carries them instead). A single deep module behind one `historyFor(conversation, freshnessWindow)` interface.

### Context envelope
The signed, short-lived token minted at page render that carries the channel's context payload and metadata to the `/messages` endpoint. Will be extended to carry the tool allowlist.

### Threaded actor
The authenticated host-side identity (or `null` for guests) that owns the conversation turn. Reconstituted server-side from the verified envelope's `userId` via the configured auth guard's user provider and passed as the typed first parameter to `ChatbotTool::authorize()` and `ChatbotTool::handle()`, so handler-side authorization and scoping cannot accidentally read identity from LLM-supplied arguments. Contrast with any actor-shaped value in tool arguments, which is never trusted.

### Identity-shaped argument
A tool parameter whose name suggests it identifies an actor or tenant (`user_id`, `account_id`, `tenant_id`, etc.). Forbidden at tool registration: the package rejects any [[tool-definition]] declaring one, on the rule that scoping must use the [[threaded-actor]], not LLM-supplied identity.

### Client extractor
A named, host-registered JavaScript function that runs in the browser at user-message send-time and returns a string drawn from the live page (DOM, route, selection state, etc.) for the LLM to read on that turn. All allowlisted extractors run on every user turn; results are attached to that turn's user message as clearly-delimited, name-labelled blocks (not the system prompt), and stripped from history on subsequent turns — old page snapshots are misleading, same spirit as [[freshness-window]] for tools. Symmetric to [[tool]] across the trust boundary: tools are host-owned PHP the LLM invokes server-side; extractors are host-owned JS the widget invokes client-side. Output is untrusted page material — never used for authorization or scoping. Registration is split across the trust boundary: the host registers PHP-side metadata (name, human-readable description) in a server-side registry, and registers a matching JS function with the same name on the widget; mismatched names fail loudly at widget boot. The per-[[channel]] allowlist of extractor names mirrors [[tool-allowlist]] and is signed into the [[context-envelope]] at page render so the widget knows what to run and the server can reject any inbound block whose name is not allowlisted. Distinct from [[context]] (which is static, server-supplied, and signed into the [[context-envelope]] at page render).

### Blade snapshot
A paired Blade directive (`@chatbotSnapshot('label') … @endChatbotSnapshot`) the host wraps around any view fragment to ship that fragment's rendered content to the LLM. Untrusted by construction — same trust posture as [[client-extractor]], not [[context]] — because the fragment can interpolate user-generated data. Multiple uses on a page aggregate into a single labelled payload delivered through one package-reserved [[client-extractor]] (`blade-snapshot`), which the host enables per [[channel]] with a single config opt-in. Frozen at page-render time; the same snapshot replays on every user turn and is stripped from history on subsequent turns, matching the [[client-extractor]] lifecycle. The directive name `@chatbotSnapshot` and extractor name `blade-snapshot` are reserved by the package: registering an extractor under the name `blade-snapshot` throws. See ADR-0005 for the pipeline design and ADR-0004 for the trust framing.

### Argument schema validation
The package-owned, pre-`authorize()` check that LLM-supplied tool arguments conform to the [[tool-definition]]'s declared JSON schema. Strict (no coercion, no extra fields, capped string length). Failures count against [[tool-call-loop]] budget and are persisted as a [[tool-invocation-record]] with a rejection status.
