<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\ContextNormalizer;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;

it('passes plain arrays through unchanged', function (): void {
    $normalizer = new ContextNormalizer;

    $result = $normalizer->normalize(['order' => ['id' => 7]]);

    expect($result)->toBe(['order' => ['id' => 7]]);
});

it('passes scalar values through unchanged', function (): void {
    $normalizer = new ContextNormalizer;

    $result = $normalizer->normalize(['count' => 5, 'label' => 'test']);

    expect($result)->toBe(['count' => 5, 'label' => 'test']);
});

it('emits a dev-mode warning when a non-JsonResource Arrayable is passed', function (): void {
    Log::shouldReceive('warning')->once()->withArgs(fn (string $msg) => str_contains($msg, 'Arrayable'));

    $arrayable = new class implements Arrayable
    {
        public function toArray(): array
        {
            return ['foo' => 'bar'];
        }
    };

    $normalizer = new ContextNormalizer;
    $normalizer->normalize(['data' => $arrayable]);
});

it('resolves a non-JsonResource Arrayable via toArray()', function (): void {
    Log::shouldReceive('warning')->once();

    $arrayable = new class implements Arrayable
    {
        public function toArray(): array
        {
            return ['foo' => 'bar'];
        }
    };

    $normalizer = new ContextNormalizer;
    $result = $normalizer->normalize(['data' => $arrayable]);

    expect($result['data'])->toBe(['foo' => 'bar']);
});
