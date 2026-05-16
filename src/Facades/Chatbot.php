<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Facades;

use Aanfarhan\Chatbot\Chatbot as ChatbotManager;
use Aanfarhan\Chatbot\Clients\FakeClient;
use Illuminate\Support\Facades\Facade;

/**
 * @method static ChatbotManager context(array<string, mixed> $context)
 * @method static ChatbotManager tools(list<string> $tools)
 * @method static FakeClient fake()
 * @method static string renderWidget(string $channel = 'default')
 * @method static void registerTool(string $class)
 * @method static void clearTools()
 *
 * @see ChatbotManager
 */
final class Chatbot extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ChatbotManager::class;
    }
}
