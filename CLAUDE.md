## PHP binary

Use `/Users/farhan/Library/Application Support/Herd/bin/php82` to run PHP commands (tests, artisan, etc.). This matches the package's minimum supported version (`php: ^8.2`), so local runs exercise the floor that CI guards. The system default `php` may differ; use the Herd binary explicitly.

## Formatting & static analysis

Do NOT run `pint` or `phpstan` after every edit — during a red-green loop run only the focused test. A `pre-push` git hook runs the CI-parity checks (`pint --test` + `phpstan analyse --memory-limit=512M`, php82) automatically, gated on whether the push touches `*.php`, so they stay out of the loop's context.

When a push is blocked: run `composer format` to auto-fix formatting, and fix the phpstan errors it reports (CI runs PHPStan at level 9). You may also run these manually before pushing if you want an early check.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default five-role vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
