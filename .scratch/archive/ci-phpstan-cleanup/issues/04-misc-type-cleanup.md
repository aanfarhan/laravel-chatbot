Status: done

# Misc PHPStan cleanup across remaining files

## What to build

Final sweep of the remaining low-volume errors after slices 01–03 land. Each is a small, localised fix:

- `Clients/FakeClient.php` — `throwDuringStream()` `$chunksBefore` missing iterable value type; `$streamQueue` declared `list<list<string>>` but assigned `non-empty-list<array>`
- `TokenCounter.php` (3 errors) — `count()` and `prune()` operate on `non-empty-list<array{…}|null>` where `list<array{…}>` is expected; filter nulls or tighten the input type
- `ContextSanitizer.php` (2 errors) — `sanitize()` returns `mixed` instead of `array<string, mixed>`; event payload type mismatch on `ChatbotSuspiciousContextDetected`
- `Concerns/HasChatbotData.php` — trait declared but never used (delete or wire up; pick based on whether anything in v1-core needs it)
- `Chatbot.php` (2 errors) — investigate and fix
- `PromptAssembler.php` (1 error) — investigate and fix
- Any stragglers reported by PHPStan that weren't covered by slices 01–03

## Acceptance criteria

- [ ] `vendor/bin/phpstan analyse --memory-limit=512M` exits with 0 errors across the entire package
- [ ] `vendor/bin/pint --test` passes
- [ ] CI workflow `.github/workflows/ci.yml` passes on PR
- [ ] No baseline file (`phpstan-baseline.neon`) was added — issues are fixed, not silenced

## Blocked by

None - can start in parallel, but final verification depends on 01, 02, 03 being merged
