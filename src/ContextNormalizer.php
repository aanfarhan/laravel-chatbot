<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;

final class ContextNormalizer
{
    public function __construct(
        private readonly ?Request $request = null,
    ) {}

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function normalize(array $context): array
    {
        $normalized = [];

        foreach ($context as $key => $value) {
            $normalized[$key] = $this->resolveValue($value);
        }

        return $normalized;
    }

    private function resolveValue(mixed $value): mixed
    {
        if ($value instanceof \Closure) {
            return $this->resolveValue($value());
        }

        if ($value instanceof JsonResource) {
            return $value->resolve($this->request);
        }

        if ($value instanceof Arrayable) {
            Log::warning(
                'Aanfarhan\\Chatbot\\ContextNormalizer: an Arrayable (non-JsonResource) was passed to Chatbot::context(). '
                .'Use a JsonResource for curated, audit-friendly serialization.',
            );

            return $value->toArray();
        }

        return $value;
    }
}
