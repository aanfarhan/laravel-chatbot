# Events

PHP events dispatched by the package via Laravel's event dispatcher. Subscribe via `Event::listen()` or a listener class as usual.

All four class names are part of the [public contract](/guide/semver).

## `ChatbotMessageStarted`

Fired when a new user message has been accepted and the stream is about to begin.

```php
namespace Aanfarhan\Chatbot\Events;

final class ChatbotMessageStarted
{
    public function __construct(
        public readonly int $conversationId,
        public readonly string $channel,
        public readonly string $model,
    ) {}
}
```

Use for: per-message metrics, distributed tracing spans, billing pre-authorisation.

## `ChatbotMessageCompleted`

Fired when the stream closes cleanly with a `done` SSE event.

```php
namespace Aanfarhan\Chatbot\Events;

final class ChatbotMessageCompleted
{
    public function __construct(
        public readonly int $inputTokens,
        public readonly int $outputTokens,
        public readonly string $model,
    ) {}
}
```

Use for: usage aggregation, cost rollups, post-message webhooks.

## `ChatbotMessageFailed`

Fired when a turn terminates with a `ChatbotException` (any subclass).

```php
namespace Aanfarhan\Chatbot\Events;

use Aanfarhan\Chatbot\Exceptions\ChatbotException;

final class ChatbotMessageFailed
{
    public function __construct(
        public readonly int $conversationId,
        public readonly string $channel,
        public readonly ChatbotException $exception,
    ) {}
}
```

Use for: alerting on `provider_error` / `quota_exceeded`, escalating `invalid_envelope` (signed-context tampering attempts), feeding `chatbot:anonymize-user` workflows on content blocks.

The exception's `->code()` is stable; the message is not. Match on code.

## `ChatbotSuspiciousContextDetected`

Fired when `ContextSanitizer` rewrites at least one key in the context payload before assembly — i.e., the payload contained one of the configured `chatbot.sanitizer_tags`.

```php
namespace Aanfarhan\Chatbot\Events;

final class ChatbotSuspiciousContextDetected
{
    /**
     * @param list<string> $keyPaths    Dot-notation paths of rewritten keys
     * @param array<string, mixed> $payload  The sanitised context array
     */
    public function __construct(
        public readonly array $keyPaths,
        public readonly array $payload,
    ) {}
}
```

Use for: detecting attempts to smuggle system-prompt instructions through user-controlled context fields. Treat repeated firings from the same user/route as a strong signal.
