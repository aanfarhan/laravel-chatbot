---
Status: done
---

# Install command

## Parent

`.scratch/v1-core/PRD.md`

## What to build

`php artisan chatbot:install` — interactive, idempotent, doubles as upgrade.

Does:
- Publish config file (`config/chatbot.php`)
- Run package migrations
- Prompt for LLM provider settings (`base_url`, `api_key`, `model`) and write to `.env`
- Inject the Blade snippet (`@chatbot` directive + widget mount) into the host app layout, with a confirmation prompt before editing
- Detect runtime (FPM vs Octane vs FrankenPHP vs Roadrunner) and print a tailored warning on FPM about worker-pool saturation and streaming concurrency
- On re-run: no destructive overwrite — picks up new config keys, skips already-injected snippets

Supports `--no-interaction` for CI / scripted use (accepts defaults, skips prompts).

## Acceptance criteria

- [ ] Against a fresh Testbench app: config publishes, migrations run, snippet injected, `.env` updated
- [ ] Second run is a no-op on already-installed state (new config keys merged, existing keys preserved)
- [ ] FPM runtime detection prints the worker-pool warning; Octane / FrankenPHP / Roadrunner do not
- [ ] `--no-interaction` accepts defaults and completes without prompts
- [ ] Snippet injection refuses target layouts that already contain `@chatbot`
- [ ] `.env` writes preserve existing keys / formatting

## Blocked by

- `.scratch/v1-core/issues/01-walking-skeleton.md`
