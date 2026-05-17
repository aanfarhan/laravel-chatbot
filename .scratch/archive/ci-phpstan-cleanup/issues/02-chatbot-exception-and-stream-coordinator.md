Status: done

# Complete ChatbotException API and clean StreamCoordinator typing

## What to build

`StreamCoordinator` calls `$exception->code()` and `$exception->isRetryable()` on `ChatbotException`, but neither method exists. It also has many unnecessary `?->inputTokens` / `?->outputTokens` nullsafe accesses (PHPStan proves the left side is never null) and mixed casts. Separately, `OpenAiCompatibleClient::stream()` declares `iterable<int, mixed>` but actually yields `StreamChunk`.

Add the missing methods on `ChatbotException` with the semantics already implied by the call sites, drop the redundant nullsafe operators, fix the mixed casts in `StreamCoordinator`, and correct the `stream()` PHPDoc to `iterable<int, StreamChunk>` (or `Generator<int, StreamChunk>`).

## Acceptance criteria

- [ ] `ChatbotException::code(): string` and `ChatbotException::isRetryable(): bool` exist, with semantics matching how `StreamCoordinator` uses them
- [ ] `StreamCoordinator.php` lines 136,137,149,150,159,160,166,167 no longer use unnecessary nullsafe on `inputTokens` / `outputTokens`
- [ ] `StreamCoordinator.php` lines 49 and 70 cast mixed safely
- [ ] `OpenAiCompatibleClient::stream()` PHPDoc matches the actual generator type
- [ ] `vendor/bin/phpstan analyse` reports 0 errors in: `Streaming/StreamCoordinator.php`, `Exceptions/ChatbotException.php`, `Clients/OpenAiCompatibleClient.php`
- [ ] `vendor/bin/pint` is clean

## Blocked by

None - can start immediately
