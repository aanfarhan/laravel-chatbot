# Threaded actor is a contract parameter, not an argument

## Context

Tool handlers run in the host Laravel app with full privileges and routinely return user-scoped data (orders, account details, message history). The threaded actor — the authenticated host-side identity that owns the conversation turn — is the only trustworthy source of "who is this for." The LLM also sees argument schemas it can fill in freely, and a coerced or sloppily-prompted model will happily emit `user_id: 42` and pass it to a tool that looks user-scoped.

In v1 the actor was available on the `Invocation` passed to `handle()`, but using it was a convention. CONTEXT.md warned hosts to "scope by the threaded actor, never by LLM-supplied identity arguments," but nothing in the contract enforced it. A handler that read `$invocation->arguments['user_id']` instead of `$invocation->actor` would silently leak cross-user data, and the package had no way to detect that mistake at registration, at boot, or at runtime.

SECURITY.md's threat model lists tool-call abuse as threat #5, and the "What v1 does NOT defend against" gap on outbound tool side effects called this out explicitly: "does not sandbox arguments."

## Decision

Promote the threaded actor from a property on `Invocation` to a typed primary parameter on the `ChatbotTool` contract:

```php
public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool;
public function handle(?Authenticatable $actor, ToolInvocation $invocation): array|string;
```

The actor type stays `?Authenticatable` (Laravel's existing interface, already used on `ToolInvocation`) — introducing a package-owned wrapper would be gold-plating; the load-bearing change is the parameter promotion. Guest turns remain `null`; the contract docblock spells this out so handlers cannot treat the unauthenticated case as an oversight. `actor` is removed from `ToolInvocation` so there is exactly one way to read it.

In tandem, at tool-registration time the registry rejects any `tool definition` whose `parameters` schema declares an identity-shaped parameter name (`user_id`, `userId`, `actor_id`, `account_id`, `tenant_id`, `viewer_id`, `on_behalf_of`, and their camelCase variants). No opt-out hatch — there are no known legitimate cases in this codebase, and admin-impersonation flows belong in the host's auth layer, not in tool arguments.

This is a breaking change to the `ChatbotTool` contract with no backward-compat shim. The package is pre-1.0 and external adoption is small; the cost of the shim (a second code path that silently re-permits the exact mistake the change exists to prevent) exceeds the migration cost.

## Considered alternatives

- **Lint-only warning at registration.** Rejected: warnings get ignored, and the failure mode (cross-user data leak) is too severe for a soft signal.
- **Forbidden-name registry alone, no contract change.** Rejected: closes the registration-time hole but leaves handlers free to ignore the actor on `Invocation` and trust other arg-derived values; the convention problem persists.
- **Silent argument rewriting** (strip identity fields from LLM args before `handle()`). Rejected: violates fail-loud; surprises handlers that legitimately referenced those fields; the LLM keeps re-emitting them.
- **Backward-compat shim** that inspects handler signatures and adapts. Rejected: preserves the exact code paths the decision exists to eliminate, and the migration is mechanical for the handful of existing implementations.

## Consequences

- Every existing `ChatbotTool` implementation in host applications must update both method signatures. Migration is mechanical (add the typed first parameter, replace `$invocation->actor` reads with `$actor`) and documented in `UPGRADE.md`.
- Guest turns are now explicit in the type system; handlers cannot silently treat `null` as "no actor, allow anything."
- The identity-arg blocklist is a hard boot-time failure. Teams adding a tool with a forbidden parameter name will see it immediately in tests or local dev, not in production.
- The blocklist is a denylist, not an allowlist — a sufficiently creative parameter name (`target`, `for_user`, `requested_by`) still slips through. The contract change is the load-bearing defense; the blocklist is defense-in-depth against the obvious mistakes.
- Identity-spoofing prevention is now a contract-level guarantee, not a documentation request. SECURITY.md can move this row from "does NOT defend against" into "defends against."
