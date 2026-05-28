<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Aanfarhan\Chatbot\ContextSanitizer;
use Aanfarhan\Chatbot\Extractors\ClientExtractorPayload;
use Aanfarhan\Chatbot\Extractors\ClientExtractorRegistry;
use Aanfarhan\Chatbot\PromptAssembler;
use Illuminate\Console\Command;
use Illuminate\Contracts\Config\Repository;

final class InspectPromptCommand extends Command
{
    protected $signature = 'chatbot:inspect-prompt
        {--route= : Named route being simulated (required)}
        {--user= : User ID to include in the inspection header}
        {--channel=default : Channel name}
        {--context-json= : Path to a JSON file with sample context payload}
        {--extractor-json= : Path to a JSON file with sample extractor payload (array of {name, output} objects)}
        {--allowed-extractors= : Comma-separated list of extractor names to treat as allowlisted}';

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

        $extractorRaw = $this->loadExtractors();
        if ($extractorRaw === null) {
            return self::FAILURE;
        }

        /** @var array<string, mixed> $channelConfig */
        $channelConfig = (array) $this->config->get("chatbot.channels.{$channel}", []);

        $sanitized = $this->sanitizer->sanitize($contextPayload);

        $allowedExtractors = $this->parseAllowedExtractors();
        $extractorResults = $this->normaliseExtractors($extractorRaw, $allowedExtractors);

        $messages = $this->assembler->assemble(
            channelConfig: $channelConfig,
            routeOverrides: [],
            contextPayload: $sanitized,
            history: [],
            userMessage: '[sample user message]',
            allowedExtractors: $allowedExtractors,
            extractorResults: $extractorResults,
        );

        $header = "route={$route}  channel={$channel}";
        if (is_string($userId) && $userId !== '') {
            $header .= "  user={$userId}";
        }

        $this->line("# chatbot:inspect-prompt  {$header}");
        $this->line('');
        $this->line((string) json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        return self::SUCCESS;
    }

    /**
     * @return list<string>
     */
    private function parseAllowedExtractors(): array
    {
        $raw = $this->option('allowed-extractors');
        if (! is_string($raw) || $raw === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }

    /**
     * @param  list<mixed>  $raw
     * @param  list<string>  $allowedExtractors
     * @return array<string, string>
     */
    private function normaliseExtractors(array $raw, array $allowedExtractors): array
    {
        if ($raw === [] || $allowedExtractors === []) {
            return [];
        }

        $registry = new ClientExtractorRegistry;
        foreach ($allowedExtractors as $name) {
            try {
                $registry->register($name, $name);
            } catch (\RuntimeException) {
                // Skip names that fail registry validation (inspect-prompt is a debug tool).
            }
        }

        try {
            return (new ClientExtractorPayload)->normalise($raw, $allowedExtractors, $registry);
        } catch (\RuntimeException $e) {
            $this->error('extractor-json error: '.$e->getMessage());

            return [];
        }
    }

    /**
     * @return list<mixed>|null
     */
    private function loadExtractors(): ?array
    {
        $path = $this->option('extractor-json');

        if (! is_string($path) || $path === '') {
            return [];
        }

        if (! file_exists($path)) {
            $this->error("extractor-json file not found: {$path}");

            return null;
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        if (! is_array($decoded)) {
            $this->error("extractor-json is not a valid JSON array: {$path}");

            return null;
        }

        /** @var list<array<string, mixed>> */
        return array_values($decoded);
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

        $result = [];
        foreach ($decoded as $key => $value) {
            $result[(string) $key] = $value;
        }

        return $result;
    }
}
