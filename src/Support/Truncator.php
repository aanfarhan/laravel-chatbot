<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Support;

final class Truncator
{
    private const MARKER = '[truncated]';

    /**
     * Truncate to a hard byte cap, appending a visible marker so a downstream
     * reader can tell the payload was cut. The total emitted length never
     * exceeds $cap (the marker is counted, not appended on top), and a
     * multi-byte UTF-8 sequence is never split.
     */
    public static function toByteCap(string $value, int $cap): string
    {
        if (strlen($value) <= $cap) {
            return $value;
        }

        $budget = max(0, $cap - strlen(self::MARKER));

        return mb_strcut($value, 0, $budget, 'UTF-8').self::MARKER;
    }
}
