<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Exceptions\ChatbotTimeoutException;
use Aanfarhan\Chatbot\Streaming\TurnOutcome;
use Aanfarhan\Chatbot\Streaming\TurnResult;

// ──────────────────────────────────────────────────────────────────────────────
// Constructor invariants
// ──────────────────────────────────────────────────────────────────────────────

it('throws when outcome is Failed but failure is null', function (): void {
    expect(fn () => new TurnResult('', null, TurnOutcome::Failed, null))
        ->toThrow(InvalidArgumentException::class, 'failure must be non-null when outcome is Failed');
});

it('throws when outcome is not Failed but failure is non-null', function (): void {
    $ex = new ChatbotTimeoutException;

    expect(fn () => new TurnResult('', null, TurnOutcome::Completed, $ex))
        ->toThrow(InvalidArgumentException::class, 'failure must be null unless outcome is Failed');
});

// ──────────────────────────────────────────────────────────────────────────────
// requireFailure()
// ──────────────────────────────────────────────────────────────────────────────

it('requireFailure returns the exception on a Failed result', function (): void {
    $ex = new ChatbotTimeoutException;
    $result = new TurnResult('partial', null, TurnOutcome::Failed, $ex);

    expect($result->requireFailure())->toBe($ex);
});

it('requireFailure throws LogicException on a non-Failed result', function (): void {
    $result = new TurnResult('done', null, TurnOutcome::Completed, null);

    expect(fn () => $result->requireFailure())
        ->toThrow(LogicException::class, 'requireFailure() called on a non-Failed TurnResult');
});
