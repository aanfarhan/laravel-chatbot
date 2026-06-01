# Exceptions

Every exception thrown by the package extends `Aanfarhan\Chatbot\Exceptions\ChatbotException`, an abstract class extending `RuntimeException`.

```php
namespace Aanfarhan\Chatbot\Exceptions;

abstract class ChatbotException extends \RuntimeException
{
    abstract public function code(): string;
    abstract public function isRetryable(): bool;
}
```

The class hierarchy, the `code()` return values, and the `isRetryable()` semantics are part of the [public contract](/guide/semver). The `getMessage()` text is not.

## Hierarchy

```
ChatbotException (abstract)
├── ChatbotConfigurationException
├── ChatbotContentBlockedException
├── ChatbotProviderException
├── ChatbotQuotaExceededException
├── ChatbotTimeoutException
├── ChatbotTokenCapExceededException
├── ForbiddenToolArgumentException
└── InvalidEnvelopeException (abstract)
    ├── ExpiredEnvelopeException
    ├── MismatchedEnvelopeException
    └── TamperedEnvelopeException
```

## Reference

| Class | `code()` | `isRetryable()` | When |
| --- | --- | --- | --- |
| `ChatbotConfigurationException` | `configuration_error` | `false` | Misconfigured provider URL, missing API key, malformed channel block. |
| `ChatbotContentBlockedException` | `content_blocked` | `false` | Content filter rejected the request or response. |
| `ChatbotProviderException` | `provider_error` | per-instance | The upstream LLM returned a non-2xx. Constructor accepts `bool $retryable` and `?Throwable $previous`. |
| `ChatbotQuotaExceededException` | `quota_exceeded` | `false` | `DailyUsageTracker` exhausted `chatbot.daily_quota.*` for the user. |
| `ChatbotTimeoutException` | `timeout` | `true` | Stream exceeded `chatbot.stream_duration`, or a tool exceeded `chatbot.tools.default_timeout`. |
| `ChatbotTokenCapExceededException` | `token_cap_exceeded` | `false` | A single user message alone exceeds `chatbot.token_cap`. |
| `ForbiddenToolArgumentException` | `forbidden_tool_argument` | `false` | Tool registration declared an identity-shaped parameter name (`user_id`, etc.). |
| `InvalidEnvelopeException` (abstract) | `invalid_envelope` | `false` | Base for envelope verification failures. |
| `ExpiredEnvelopeException` | `invalid_envelope` | `false` | The envelope is past its TTL. |
| `MismatchedEnvelopeException` | `invalid_envelope` | `false` | The envelope was minted for a different route / channel / user. |
| `TamperedEnvelopeException` | `invalid_envelope` | `false` | HMAC signature mismatch. |

## Outside the hierarchy

`InvalidExtractorPayloadException` (`Aanfarhan\Chatbot\Exceptions\InvalidExtractorPayloadException`) extends `\RuntimeException` directly — it is not a `ChatbotException`. It is thrown when a client-extractor payload fails internal validation and is caught by `MessagesController`, which turns it into a `422` response. You will not encounter it in normal application code.

## Where they surface

| Exception | Surface |
| --- | --- |
| `InvalidEnvelopeException` family | HTTP `403` from `POST /chatbot/messages`. |
| Everything else | SSE `error` event on the open stream, `code` field matches `->code()`, `retryable` matches `->isRetryable()`. |

## Usage

Match on `->code()`, never on `->getMessage()`:

```php
use Aanfarhan\Chatbot\Exceptions\ChatbotException;

try {
    // ...
} catch (ChatbotException $e) {
    match ($e->code()) {
        'quota_exceeded'    => $this->upsellPlan(),
        'invalid_envelope'  => $this->log->warning('possible tampering'),
        default             => report($e),
    };
}
```

Catching `ChatbotException` itself catches every package exception.
