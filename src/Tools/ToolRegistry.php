<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Illuminate\Contracts\Foundation\Application;

final class ToolRegistry
{
    /** @var array<string, string> name -> class */
    private array $tools = [];

    public function __construct(private readonly Application $app) {}

    /**
     * @param  class-string<ChatbotTool>  $class
     */
    public function register(string $class): void
    {
        /** @var ChatbotTool $instance */
        $instance = $this->app->make($class);
        $name = $instance->name();

        if (isset($this->tools[$name])) {
            throw new \RuntimeException("Tool '{$name}' is already registered");
        }

        $this->tools[$name] = $class;
    }

    public function resolve(string $name): ?ChatbotTool
    {
        if (! isset($this->tools[$name])) {
            return null;
        }

        /** @var ChatbotTool */
        return $this->app->make($this->tools[$name]);
    }

    /**
     * @return list<array<string, mixed>> OpenAI tools array
     */
    public function toDefinitions(): array
    {
        $defs = [];

        foreach ($this->tools as $name => $class) {
            /** @var ChatbotTool $instance */
            $instance = $this->app->make($class);
            $defs[] = [
                'type' => 'function',
                'function' => [
                    'name' => $name,
                    'description' => $instance->description(),
                    'parameters' => $instance->parameters(),
                ],
            ];
        }

        return $defs;
    }

    /**
     * @param  list<string>  $allowlist
     * @return list<array<string, mixed>> OpenAI tools array filtered to the allowlist
     */
    public function toDefinitionsFor(array $allowlist): array
    {
        $allowed = array_flip($allowlist);
        $defs = [];

        foreach ($this->tools as $name => $class) {
            if (! isset($allowed[$name])) {
                continue;
            }

            /** @var ChatbotTool $instance */
            $instance = $this->app->make($class);
            $defs[] = [
                'type' => 'function',
                'function' => [
                    'name' => $name,
                    'description' => $instance->description(),
                    'parameters' => $instance->parameters(),
                ],
            ];
        }

        return $defs;
    }

    public function isEmpty(): bool
    {
        return $this->tools === [];
    }

    public function clear(): void
    {
        $this->tools = [];
    }
}
