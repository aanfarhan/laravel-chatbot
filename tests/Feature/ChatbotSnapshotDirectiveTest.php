<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Blade;

it('@chatbotSnapshot renders a marker wrapping the body', function (): void {
    $template = "@chatbotSnapshot('article')Hello world@endChatbotSnapshot";

    $rendered = Blade::render($template);

    expect($rendered)->toContain('data-chatbot-snapshot="article"');
    expect($rendered)->toContain('Hello world');
    expect($rendered)->toContain('display:contents');
});

it('@chatbotSnapshot supports a dynamic label expression', function (): void {
    $template = '@chatbotSnapshot($label)body@endChatbotSnapshot';

    $rendered = Blade::render($template, ['label' => 'orders']);

    expect($rendered)->toContain('data-chatbot-snapshot="orders"');
});
