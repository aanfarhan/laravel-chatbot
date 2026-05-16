<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Events\ChatbotSuspiciousContextDetected;
use Illuminate\Support\Facades\Event;

final class ContextSanitizer
{
    /** @var list<string> */
    private const DEFAULT_TAGS = ['context', 'system', 'instructions', 'assistant', 'user'];

    /** @var list<string> */
    private array $patterns;

    /** @param list<string>|null $tags */
    public function __construct(?array $tags = null)
    {
        $tagList = $tags ?? self::DEFAULT_TAGS;

        $this->patterns = [];
        foreach ($tagList as $tag) {
            $this->patterns[] = '<'.$tag.'>';
            $this->patterns[] = '</'.$tag.'>';
        }
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function sanitize(array $context): array
    {
        $keyPaths = [];
        $result = [];

        foreach ($context as $k => $v) {
            $result[$k] = $this->walk($v, (string) $k, $keyPaths);
        }

        if ($keyPaths !== []) {
            Event::dispatch(new ChatbotSuspiciousContextDetected($keyPaths, $result));
        }

        return $result;
    }

    /**
     * @param  list<string>  $keyPaths
     */
    private function walk(mixed $value, string $path, array &$keyPaths): mixed
    {
        if (is_string($value)) {
            $sanitized = str_replace(
                $this->patterns,
                array_map(fn (string $p): string => htmlspecialchars($p, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), $this->patterns),
                $value,
            );

            if ($sanitized !== $value) {
                $keyPaths[] = $path;
            }

            return $sanitized;
        }

        if (is_array($value)) {
            $out = [];
            foreach ($value as $k => $v) {
                $childPath = $path === '' ? (string) $k : $path.'.'.$k;
                $out[$k] = $this->walk($v, $childPath, $keyPaths);
            }

            return $out;
        }

        return $value;
    }
}
