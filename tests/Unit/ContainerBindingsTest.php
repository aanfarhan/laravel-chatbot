<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Streaming\SseStreamEmitter;
use Aanfarhan\Chatbot\Streaming\StreamEmitter;
use Aanfarhan\Chatbot\Tools\ToolInvoker;

it('resolves StreamEmitter as SseStreamEmitter singleton', function (): void {
    $a = app(StreamEmitter::class);
    $b = app(StreamEmitter::class);

    expect($a)->toBeInstanceOf(SseStreamEmitter::class);
    expect($a)->toBe($b);
});

it('resolves ToolInvoker as singleton', function (): void {
    $a = app(ToolInvoker::class);
    $b = app(ToolInvoker::class);

    expect($a)->toBe($b);
});
