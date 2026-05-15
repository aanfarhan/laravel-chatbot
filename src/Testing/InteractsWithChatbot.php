<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Testing;

use Illuminate\Testing\TestResponse;
use RuntimeException;

trait InteractsWithChatbot
{
    public function extractSignedContext(TestResponse $response): string
    {
        $html = (string) $response->getContent();

        if (preg_match('/<chatbot-widget\b[^>]*\bsigned-context="([^"]+)"/', $html, $matches) !== 1) {
            throw new RuntimeException(
                'chatbot test helper: no signed_context found in response (is @chatbot rendered?)',
            );
        }

        return htmlspecialchars_decode($matches[1], ENT_QUOTES);
    }
}
