# Blade snapshot rides the client-extractor pipeline

## Context

Host developers want a "drop it anywhere" way to feed sections of a Laravel view to the LLM: a paired Blade directive (`@chatbotSnapshot('label') … @endChatbotSnapshot`) wrapped around any view fragment, with the rendered content shipped to the model on each user turn. See [[blade-snapshot]] in the glossary.

The directive runs server-side, at page render, which superficially looks like [[context]] (host PHP, signed into the [[context-envelope]], trustworthy by construction). It is not. The fragment being wrapped almost always interpolates request-time data — <code v-pre>{{ $customer->notes }}</code>, loops over user-generated records, etc. — so its trust posture matches [[client-extractor]] output (ADR-0004), not [[context]].

Two structural problems flow from that:

1. **Where does it go in the prompt?** The trusted Context channel is the wrong home; the untrusted-block path that ADR-0004 hardened (`<client-extractor name="…" trust="untrusted-page-content">…</client-extractor>` plus the system-prompt framing rule) is the right one.

2. **How does the allowlist work?** The [[client-extractor]] allowlist is read from config at envelope-mint time, which happens in the controller — *before* the view renders. A directive used deep in a view cannot retroactively add its name to the allowlist.

We also want the lifecycle of captured content to match extractor output: replayed every user turn, stripped from history (old page snapshots mislead the model — same reasoning as the [[freshness-window]] for tools).

## Decision

Implement the directive as syntactic sugar over a single, package-reserved [[client-extractor]] named `blade-snapshot`:

- **One reserved extractor name.** The package owns `blade-snapshot` and hard-rejects any host attempt to register an extractor by that name on either the PHP `ClientExtractorRegistry` or the widget's JS registry. Hosts enable the feature per [[channel]] by adding `'blade-snapshot'` to `chatbot.channels.{channel}.allowed_extractors` in config — a single line, regardless of how many `@chatbotSnapshot` directives appear in the views.

- **Directive emits hidden DOM + an auto-registered JS extractor.** Each `@chatbotSnapshot('label')` use renders a marker around its content in the DOM. The widget ships an internal JS extractor (registered under `blade-snapshot`) that, at send-time, walks the markers, reads each section's `innerText`, concatenates same-label sections in document order, and submits a single labelled aggregate as the extractor's output.

- **Label is required.** Anonymous chunks are rejected at directive-use time. Labels surface inside the aggregated block so the LLM can refer to them; numbered fallbacks would just be noise.

- **`innerText`, not HTML.** Strips tags, respects `display:none`, collapses whitespace the way the browser shows it. Cheapest on tokens; matches what the user actually sees on the page.

- **Lifecycle is inherited unchanged from [[client-extractor]].** Captured at page render (server-side), but transmitted on every user turn (client-side, via the existing send-time pipeline) and stripped from history on subsequent turns. Aggregate output respects the existing `extractor_size_cap_bytes` and uses the existing `[truncated]` marker.

- **Naming.** The directive is `@chatbotSnapshot`, not `@chatbotContext`. The latter would actively mislead — [[context]] in this package means *trusted, server-supplied, signed*, which this content is not.

In effect, "Blade snapshot" is not a new domain concept: it is one specific, package-owned [[client-extractor]] whose source is a page-render-time snapshot of marked DOM rather than live page state.

## Considered alternatives

- **Wire the directive into the trusted [[context]] pipeline.** Rejected. Mechanism (server-side, page render) was the misleading signal; trust posture (untrusted page material) is the load-bearing one. Sending interpolated user-generated content through the Context channel would silently bypass ADR-0004's hardening (delimited untrusted-block tags, system-prompt framing rule, history stripping).

- **Add a new envelope field carrying the captured content, server splices each turn.** Rejected. Duplicates the entire extractor pipeline on a parallel path: a new persisted snapshot, new server-side replay, new allowlist surface. The hidden-DOM-plus-extractor path reuses the existing allowlist, signed envelope, untrusted-block wrapping, history stripping, timeout, and chip rendering for free.

- **Defer envelope minting until after view render so directives can register themselves dynamically.** Rejected. Changes the controller contract (`Chatbot::context(...)` would no longer return a ready-to-render envelope) and re-opens ADR-0004's allowlist framing. The single-reserved-name approach gives the host "drop anywhere" ergonomics without moving the mint point.

- **Per-directive extractor names, host allowlists each in config.** Rejected. Symmetric with hand-written extractors but defeats the entire ergonomic the host asked for: every new `@chatbotSnapshot('foo')` would require a config edit, and the host would have to keep config and views in sync forever.

- **Capture rendered HTML rather than `innerText`.** Rejected as the default. 3–10× the bytes, noisy with classes and attributes the model does not need, and pulls in script content via `textContent` shortcuts. Hosts who need structural fidelity can pass markdown or pre-formatted text inside the directive.

- **Auto-suffix duplicate labels (`rows-1`, `rows-2`, …) instead of concatenating.** Rejected. Breaks the natural loop pattern (`@foreach (...) @chatbotSnapshot('rows') … @endChatbotSnapshot @endforeach`) and presents the LLM with meaningless numbered labels.

## Consequences

- The reserved name `blade-snapshot` becomes part of the package's host-visible API: changing it later is a breaking change for anyone who has it in `allowed_extractors`. Hard-reservation on both registries prevents accidental shadowing.

- The `@chatbotSnapshot` directive name becomes equally load-bearing. The deliberate split from `@chatbotContext` is a one-time chance to keep the trust boundary legible; renaming later would re-introduce the very confusion this ADR avoids.

- Snapshots are frozen at page render. Single-page-app navigations that swap content without a full reload will keep replaying the old snapshot until the page is reloaded or the widget is remounted. Hosts who need live page state should reach for a hand-written [[client-extractor]] instead — the two mechanisms coexist deliberately.

- Because the directive sits on top of the existing extractor pipeline, every future hardening of that pipeline (size caps, timeouts, prompt-framing changes) automatically applies. The trade-off is the reverse: any decision to relax extractor handling for ergonomics would weaken this feature too.

- The package gains one new host-facing primitive but **no new domain concept beyond the glossary entry for [[blade-snapshot]]**. Reviewers reading the implementation should expect a Blade compiler hook, a tiny piece of widget JS, and registry-side guards — not a parallel server-side replay path.
