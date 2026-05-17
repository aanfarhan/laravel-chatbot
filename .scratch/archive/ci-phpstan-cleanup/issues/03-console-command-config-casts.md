Status: done

# Type config/array access in console commands

## What to build

PHPStan flags ~16 errors across console commands: `config('chatbot.…')` returns `mixed`, so every encapsed-string interpolation, `(int)`/`(string)` cast, `array_key_exists`, `Carbon::subDays`, and `Command::line()` call downstream of a config read or array offset fails.

Narrow the types at the point of read — either via explicit `(string)`/`(int)` casts after `is_string`/`is_int` guards, dedicated typed config accessors (e.g. a `ChatbotConfig` helper), or `assert()` statements with the right shape. Pick whichever stays closest to the existing style in the package.

Affected files:
- `Console/InspectPromptCommand.php` (mixed casts, `loadContext()` return type)
- `Console/PruneCommand.php` (config `retention_days`, Carbon, `+=` on mixed)
- `Console/ExportUserCommand.php` (encapsed `$userId`/`$count`, `Command::line()` `string|false`)
- `Console/DeleteGuestCommand.php`
- `Console/DeleteUserCommand.php`
- `Console/InstallCommand.php`

## Acceptance criteria

- [ ] All listed files have 0 PHPStan errors
- [ ] `Command::line()` receives `string` (never `string|false`)
- [ ] `InspectPromptCommand::loadContext()` actually returns `array<string, mixed>|null`
- [ ] No `(int) $mixed` or `(string) $mixed` without a prior type narrowing
- [ ] `vendor/bin/pint` is clean

## Blocked by

None - can start immediately
