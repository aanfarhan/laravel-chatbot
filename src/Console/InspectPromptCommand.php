<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Aanfarhan\Chatbot\ContextSanitizer;
use Aanfarhan\Chatbot\PromptAssembler;
use Illuminate\Console\Command;
use Illuminate\Contracts\Config\Repository;

final class InspectPromptCommand extends Command
{
    protected $signature = 'chatbot:inspect-prompt
        {--route= : Named route being simulated (required)}
        {--user= : User ID to include in the inspection header}
        {--channel=default : Channel name}
        {--context-json= : Path to a JSON file with sample context payload}';

    protected $description = 'Dump the assembled prompt for a route as the LLM would receive it';

    public function __construct(
        private readonly PromptAssembler $assembler,
        private readonly ContextSanitizer $sanitizer,
        private readonly Repository $config,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $route = $this->option('route');

        if (! is_string($route) || $route === '') {
            $this->error('--route is required');

            return self::FAILURE;
        }

        $channel = is_string($this->option('channel')) ? $this->option('channel') : 'default';
        $userId = $this->option('user');

        $contextPayload = $this->loadContext();
        if ($contextPayload === null) {
            return self::FAILURE;
        }

        /** @var array<string, mixed> $channelConfig */
        $channelConfig = (array) $this->config->get("chatbot.channels.{$channel}", []);

        $sanitized = $this->sanitizer->sanitize($contextPayload);

        $messages = $this->assembler->assemble(
            channelConfig: $channelConfig,
            routeOverrides: [],
            contextPayload: $sanitized,
            history: [],
            userMessage: '[sample user message]',
        );

        $header = "route={$route}  channel={$channel}";
        if ($userId !== null) {
            $header .= "  user={$userId}";
        }

        $this->line("# chatbot:inspect-prompt  {$header}");
        $this->line('');
        $this->line((string) json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        return self::SUCCESS;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function loadContext(): ?array
    {
        $path = $this->option('context-json');

        if (! is_string($path) || $path === '') {
            return [];
        }

        if (! file_exists($path)) {
            $this->error("context-json file not found: {$path}");

            return null;
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        if (! is_array($decoded)) {
            $this->error("context-json is not a valid JSON object: {$path}");

            return null;
        }

        return $decoded;
    }
}
