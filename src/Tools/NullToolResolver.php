<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\ToolResolver;

final class NullToolResolver implements ToolResolver
{
    public function resolve(string $name): ?ChatbotTool
    {
        return null;
    }
}
