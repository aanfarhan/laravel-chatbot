# SemVer commitments

This page defines what is **stable** (covered by SemVer) and what is **internal** (may change in any release, including patches).

If you depend on something not listed in the stable section, you are pinning to internal behaviour — pin a strict version and read [UPGRADE.md](https://github.com/aanfarhan/laravel-chatbot/blob/main/UPGRADE.md) before bumping.

## Public contract (stable across minor and patch releases)

### PHP API

- `Chatbot` facade method signatures: `context`, `channel`, `tools`, `registerTool`, `clearTools`, `fake`, `quota`, `authorize`, `renderWidget`
- `ChannelScope` fluent method signatures: `context`, `prompt`, `greeting`, `summary`, `tools`, `renderWidget`
- `ChatbotTool` and `PersistableTool` interface signatures
- `ToolInvocation` public constructor and properties
- Typed exception class hierarchy under `ChatbotException`
- Event class names: `ChatbotMessageStarted`, `ChatbotMessageCompleted`, `ChatbotMessageFailed`, `ChatbotSuspiciousContextDetected`

### Configuration

- All documented keys in [`config/chatbot.php`](/reference/configuration)
- Default values may shift in minor releases when justified by a security or correctness improvement; such changes are called out in the release notes and [UPGRADE.md](https://github.com/aanfarhan/laravel-chatbot/blob/main/UPGRADE.md).

### HTTP & wire protocol

- SSE event shape: `{ type, ... }` with documented fields for `token`, `done`, `error`, `context_summary`, `tool_started`, `tool_finished`, `tool_failed`
- Signed envelope public payload fields
- HTTP routes: `POST /chatbot/messages`, `GET /chatbot/conversations/{id}/messages`, `GET /chatbot/health`, `GET /chatbot/widget.js`

### Frontend

- Web component **tag name**: `<chatbot-widget>`
- Web component **attributes**: `channel`, `position`, `title`, `signed-context`
- Web component **method**: `registerClientExtractor(name, fn, options)`
- CSS custom properties: all eight `--chatbot-*` properties documented in [Theming](./theming)
- CSS parts: all ten named parts documented in [Theming](./theming)

## Internal (may change in any release)

- Database schema. Managed via migrations; run `php artisan migrate` on upgrade.
- Base system prompt content. It is prompt tuning, not a contract.
- HMAC algorithm and envelope encoding. The public interface is `mint/verify`, not the wire format.
- The internal class hierarchy under `src/` (anything not listed above).
- The bundled widget's internal DOM structure beyond the named CSS parts.
- The exact wording of error messages on exceptions. Use `->code()` and `->isRetryable()` programmatically; never match on `->getMessage()`.

## Versioning policy

- **Patch (1.x.y)** — bug fixes, dependency bumps, internal refactors, doc-only changes.
- **Minor (1.y.0)** — new features, new methods, new config keys with safe defaults, new exception subclasses under existing parents.
- **Major (X.0.0)** — removal or signature change of anything in the stable surface above. Always accompanied by an entry in [UPGRADE.md](https://github.com/aanfarhan/laravel-chatbot/blob/main/UPGRADE.md).

## Deprecations

Deprecations are announced one full minor release before removal:

- A `@deprecated` PHPDoc on the symbol.
- A note in the changelog under "Deprecated".
- A migration recipe in [UPGRADE.md](https://github.com/aanfarhan/laravel-chatbot/blob/main/UPGRADE.md).
- A runtime `trigger_error(..., E_USER_DEPRECATED)` where practical without breaking strict-error environments.
