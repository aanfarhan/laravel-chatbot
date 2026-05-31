<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\PromptAssembler;

it('applies the configured context section cap to the container-bound assembler', function (): void {
    config()->set('chatbot.context.section_size_cap', 100);

    $assembler = app(PromptAssembler::class);

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: ['big' => str_repeat('x', 500)],
        history: [],
        userMessage: 'Hi',
    );

    preg_match('|<big>(.*)</big>|s', $messages[0]['content'], $m);

    expect(strlen($m[1]))->toBeLessThanOrEqual(100);
});
