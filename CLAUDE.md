## PHP binary

Use `/Users/farhan/Library/Application Support/Herd/bin/php82` to run PHP commands (tests, artisan, etc.). This matches the package's minimum supported version (`php: ^8.2`), so local runs exercise the floor that CI guards. The system default `php` may differ; use the Herd binary explicitly.

## Code formatting

After every PHP file change or new PHP file creation, run `vendor/bin/pint` to auto-fix formatting. Do not skip this — the CI runs `vendor/bin/pint --test` and will fail if formatting is off.

## Static analysis

After every PHP file change or new PHP file creation, run `vendor/bin/phpstan analyse --memory-limit=512M` to check for type errors. Do not skip this — the CI runs PHPStan at level 9 and will fail if there are errors.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default five-role vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
