# Wire ToolInvocationStore into MessagesController

Status: done

## Parent

`.scratch/llm-tool-calling/issues/04-tool-invocation-persistence-freshness-window.md`

## What to build

`MessagesController` instantiates `StreamCoordinator` without passing a `ToolInvocationStore`, so no rows are ever written to `chatbot_tool_invocations` at runtime — even though `EloquentToolInvocationStore` is registered as a singleton in `ChatbotServiceProvider` and `StreamCoordinator` accepts it as an optional constructor argument.

The fix is a two-liner:

1. Add `ToolInvocationStore` to `MessagesController`'s constructor (Laravel's IoC will auto-inject the registered singleton).
2. Forward it to `StreamCoordinator` via the named argument `toolInvocationStore:` in the `new StreamCoordinator(...)` call inside `__invoke`.

No schema changes, no config changes, no new contracts — the infrastructure is already in place.

Discovered via the E2E test suite in `chatbot-e2e` (`ToolCallingTest.php`): after a successful tool call the `chatbot_tool_invocations` table remained empty, which confirmed the wiring gap.

## Acceptance criteria

- [ ] `MessagesController::__construct` declares `private readonly ToolInvocationStore $toolInvocationStore`
- [ ] The `new StreamCoordinator(...)` call in `__invoke` passes `toolInvocationStore: $this->toolInvocationStore`
- [ ] After a successful tool invocation via `POST /chatbot/messages`, a row with `status = 'ok'` is present in `chatbot_tool_invocations`
- [ ] After a failed/unauthorized tool invocation, a row with `status = 'failed'` is present
- [ ] `vendor/bin/pint` clean, PHPStan level 9 clean

## Blocked by

None — can start immediately.
