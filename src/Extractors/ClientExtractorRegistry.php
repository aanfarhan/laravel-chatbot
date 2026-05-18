<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Extractors;

final class ClientExtractorRegistry
{
    /** @var array<string, string> name -> description */
    private array $extractors = [];

    public function register(string $name, string $description): void
    {
        if (isset($this->extractors[$name])) {
            throw new \RuntimeException("Client extractor '{$name}' is already registered");
        }

        $this->extractors[$name] = $description;
    }

    public function has(string $name): bool
    {
        return isset($this->extractors[$name]);
    }

    /**
     * @return array<string, string> name -> description
     */
    public function all(): array
    {
        return $this->extractors;
    }
}
