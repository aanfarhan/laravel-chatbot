<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Facades\Chatbot;

it('Chatbot::fake() returns a FakeClient and binds it as the LLMClient', function (): void {
    $fake = Chatbot::fake();

    expect($fake)->toBeInstanceOf(FakeClient::class);
    expect(app(LLMClient::class))->toBe($fake);
});

it('Chatbot::context() stores context on the current Chatbot instance', function (): void {
    Chatbot::context(['order' => ['id' => 7, 'total' => 45]]);

    expect(Chatbot::getFacadeRoot()->resolveContext())
        ->toBe(['order' => ['id' => 7, 'total' => 45]]);
});
