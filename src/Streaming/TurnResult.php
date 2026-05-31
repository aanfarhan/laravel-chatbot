<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

use Aanfarhan\Chatbot\Exceptions\ChatbotException;
use Aanfarhan\Chatbot\Responses\Usage;

final readonly class TurnResult
{
    public function __construct(
        public string $assembled,
        public ?Usage $usage,
        public TurnOutcome $outcome,
        public ?ChatbotException $failure,
    ) {
        // ctor invariant: failure non-null ⟺ outcome === Failed
        if ($outcome === TurnOutcome::Failed && $failure === null) {
            throw new \InvalidArgumentException('TurnResult: failure must be non-null when outcome is Failed');
        }

        if ($outcome !== TurnOutcome::Failed && $failure !== null) {
            throw new \InvalidArgumentException('TurnResult: failure must be null unless outcome is Failed');
        }
    }

    /**
     * Returns the failure exception. Throws if outcome is not Failed.
     * Lets callers narrow the type without suppression or assert().
     */
    public function requireFailure(): ChatbotException
    {
        if ($this->failure === null) {
            throw new \LogicException('requireFailure() called on a non-Failed TurnResult');
        }

        return $this->failure;
    }
}
