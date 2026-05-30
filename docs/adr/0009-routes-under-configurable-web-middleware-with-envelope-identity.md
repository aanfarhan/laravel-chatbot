# Widget-bearing and write routes ship under a configurable middleware group, defaulting to `web`

## Context

The package loaded its routes with `loadRoutesFrom` and no `Route::middleware(...)` group. So `POST /chatbot/messages` ran with no `VerifyCsrfToken`, no `StartSession`, no `EncryptCookies` — none of Laravel's `web` stack.

Two effects fell out of that:

1. **No CSRF on the write path.** Classic CSRF was already largely mitigated — a request must carry a valid `signed_context` envelope, which is HMAC-signed, page-bound, and unguessable (the same-origin policy blocks a cross-origin attacker from reading it to replay). But defence-in-depth was absent: nothing stopped a forged cross-site POST from *trying*, and there was no second, independent barrier.
2. **Authenticated-user history was dead.** `HistoryController` read identity from `$request->user()`, which is only populated by `StartSession` + the auth middleware. With no session middleware on the route, `$request->user()` was always `null`, so a logged-in user's history was unreachable. Fail-closed — it broke the feature rather than leaking — but still broken.

The asymmetry that made (2) confusing: `MessagesController` reads identity from the **signed envelope** (`$verified->userId`), not from the session. That was deliberate — the envelope is minted server-side at page render, capturing the then-authenticated user into a tamper-proof token (HMAC over `app.key`, bound to route + channel + TTL). It exists precisely so the write path is **self-contained** and does not depend on the host wiring session middleware onto package routes. `HistoryController` simply never adopted that pattern.

## Decision

Expose a configurable middleware group and route identity through the envelope on both paths.

- **`chatbot.route_middleware`** (default `['web']`) wraps the routes that either accept the widget's POST or render a page hosting the widget: `POST /chatbot/messages`, `GET /chatbot/conversations/{id}/messages`, `GET /chatbot/demo`, `GET /chatbot/test-fixture`. The stateless routes stay bare: `GET /chatbot/health` (pure JSON) and `GET /chatbot/widget.js` (a cacheable static asset that must not acquire a session cookie).
- **History scopes by the envelope, not the session.** `HistoryController` already verifies `signed_context` (it reads the greeting from it); it now also takes ownership identity from `$verified->userId`, matching `MessagesController`. A missing or invalid envelope is rejected with `403` for *both* the authenticated and guest branches — identity always comes from the verified token, so the guest branch still presents an envelope to prove which party it is before its guest cookie is cross-checked. Both read and write paths are now self-contained: identity rides the signed token and is correct under *any* `route_middleware` value, including `[]`.

The `web` default is what makes CSRF a real, independent second barrier (the bundled widget already sends `X-CSRF-TOKEN` from the page's `<meta name="csrf-token">`). Envelope-sourced identity is what keeps both paths working even if a host narrows or empties the middleware group. The two decisions are complementary: `web` adds defence-in-depth; the envelope ensures the feature does not silently depend on it.

## Considered alternatives

- **Default the group to `[]` (opt-in).** Rejected. It preserves today's behaviour exactly and ships no breaking change, but defence-in-depth stays off until a host knows to turn it on — and the hosts most exposed are the ones least likely to. Secure-by-default is worth the major version bump.
- **Leave history on `$request->user()` and rely on the `web` default to revive it.** Rejected. It touches no controller code, but it silently couples a feature to a value we just made configurable: a host who sets `route_middleware` to a custom group without `StartSession` would re-break history with no error. Envelope identity removes the coupling.
- **Also scope the write path on `$request->user()` (cross-check against the envelope).** Rejected. It uses "live" session identity and would close the logout race (see Consequences), but it re-introduces the exact middleware dependency for the write path that the envelope was designed to avoid — the streaming POST must work under any `route_middleware`.

## Consequences

- **Breaking default → major version.** Existing installs whose host page lacks `<meta name="csrf-token">` will get `419` on POST once `web` is active. The opt-out is `chatbot.route_middleware => []`. Documented in `UPGRADE.md`; the CSRF row in `SECURITY.md` is updated from "largely mitigated by the envelope" to "envelope **plus** configurable CSRF".
- **Cookie-encryption migration blip.** `web` includes `EncryptCookies`. Existing plaintext `chatbot_guest_id` and `chatbot_conversation_{channel}` cookies (set under the old no-middleware regime) fail to decrypt once the group is active, so Laravel drops them — a one-time loss of guest/conversation continuity. Set and read are symmetric thereafter. The widget reads neither cookie in JS (conversation id lives in `localStorage`; the guest cookie is `httpOnly`), so encryption is transparent to the client.
- **Frozen-identity property now applies to history too.** Like the write path, history identity is the user captured at page render, valid for the envelope TTL — not live session state. A just-logged-out user's still-loaded page can read (and write) as that user until the envelope expires. Acceptable within the short TTL and consistent across both paths; the alternative (live session identity) was rejected above.
- **The demo and fixture pages model the real integration.** Their render routes join the `web`-wrapped set and their views emit `<meta name="csrf-token">`, so the package's own Playwright e2e drives the full session + CSRF path end-to-end rather than bypassing it.
