# Demo lives in a separate showcase project, not in the package

## Context

The package shipped a "demo trio": the `chatbot:demo` command, `DemoController`, the `GET /chatbot/demo` route, a `demo.blade.php` view, a `chatbot.demo` config block (`CHATBOT_DEMO` env), and a branch in the service provider that bound `LLMClient` to a `FakeClient` with canned replies when `chatbot.demo.enabled` was true. Its job was to let someone confirm the widget renders end-to-end without spending tokens — it was the post-install verification step in the installation guide.

That convenience carried ongoing cost. The demo bound a fake driver and exposed a public route, so every surface that touched it (installation, security, configuration docs) had to repeat a "NEVER enable in production" warning, and the provider's client-resolution path carried a demo branch that had nothing to do with real operation. Meanwhile two things that *look* adjacent are not demo and earn their place: `FakeClient` / `Chatbot::fake()` is the public, documented testing API for consumers, and the Playwright fixture (`chatbot.playwright_fixture`) is the package's own browser e2e infrastructure.

A separate showcase project — one that exercises every package feature — serves people *evaluating the package before they install it*. That is a different audience from someone *verifying the install inside their own app*, and conflating the two is what kept demo code in the library.

## Decision

The demo trio is removed from the package. Demos and feature showcases live in a separate, standalone project.

- **Removed:** `chatbot:demo`, `DemoController`, `routes/chatbot-demo.php`, `resources/views/demo.blade.php`, the `chatbot.demo` config block / `CHATBOT_DEMO` env, the provider's demo `FakeClient` binding branch, and the `DemoCommandTest` / `DemoRouteTest` tests.
- **Kept:** `FakeClient` and `Chatbot::fake()` (public testing API), and the entire Playwright fixture. Neither is demo code.
- **Post-install verification** moves to a short `Chatbot::fake()` recipe in the docs — binding the fake in a throwaway route or test — which closes the "confirm it works without spending tokens" gap using an API that already exists and is already documented.
- **Clean break.** No deprecation cycle. The removal ships as a breaking release with an `upgrading.md` entry; a stale `CHATBOT_DEMO=true` simply becomes inert and `/chatbot/demo` returns 404. A deprecation period was not worth it for a flag that was never meant to run in production.

## Considered alternatives

- **Keep the demo in the package.** Rejected. It is permanent surface and a recurring "never in production" caveat for a feature that only matters in dev, and it duplicates what a dedicated showcase project does better.
- **Deprecate over one release** (warn + no-op, then remove). Rejected. It keeps demo code alive longer, which is the opposite of the goal, for negligible safety on a dev-only flag.
- **Clean break but fail loud** (throw if `chatbot.demo.enabled` is still truthy). Rejected as unnecessary ceremony — the upgrade note covers the dev who had it on, and an inert key harms nothing.

## Consequences

- This is a breaking change: `/chatbot/demo` 404s, the `chatbot.demo` config key is inert, and a dev relying on `CHATBOT_DEMO=true` for a fake driver now falls through to the real client (possibly with an empty API key). The `upgrading.md` entry documents the migration to `Chatbot::fake()`.
- [ADR 0009](0009-routes-under-configurable-web-middleware-with-envelope-identity.md) referenced `GET /chatbot/demo` as a `web`-wrapped route and, with the fixture, as a page that "models the real integration." After this change the Playwright fixture stands alone as that integration model; 0009's body is left intact as a historical record and carries a pointer to this ADR.
- Until the separate showcase project exists, there is no in-package "see everything at once" experience — only the per-feature `Chatbot::fake()` recipe. That gap is accepted deliberately.
