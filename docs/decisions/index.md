# Architecture decisions

This section publishes the package's **Architecture Decision Records** (ADRs) — short documents that capture each load-bearing design choice, the alternatives considered, and the trade-offs.

ADRs are the answer to *"why is it built this way?"* Many of them are surprising at first glance; reading the relevant ADR before proposing a change usually saves a round-trip.

## Index

- [ADR-0001 — Global tool registry with per-channel allowlist](/adr/0001-global-tool-registry-with-per-channel-allowlist)
- [ADR-0002 — Persist tool invocations with a freshness window](/adr/0002-persist-tool-invocations-with-freshness-window)
- [ADR-0003 — Threaded actor is a contract parameter](/adr/0003-threaded-actor-is-a-contract-parameter)
- [ADR-0004 — Client extractors: untrusted by construction](/adr/0004-client-extractors-untrusted-by-construction)
- [ADR-0005 — Blade snapshot rides the client-extractor pipeline](/adr/0005-blade-snapshot-rides-the-client-extractor-pipeline)

## When a new ADR gets written

The maintainers add an ADR when a decision meets all three of:

1. **Hard to reverse** — the cost of changing your mind later is meaningful.
2. **Surprising without context** — a future reader will wonder *"why did they do it this way?"*
3. **The result of a real trade-off** — there were genuine alternatives and one was picked for specific reasons.

If you're proposing a change that conflicts with an existing ADR, open an issue referencing the ADR number and outlining the new context that justifies revisiting it. ADRs are amended (with a "Superseded by ADR-XXXX" header) rather than rewritten in place.
