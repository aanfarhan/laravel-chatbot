<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Extractors;

final class ClientExtractorPayload
{
    private const DEFAULT_OUTPUT_SIZE_CAP = 8192;

    public function __construct(
        private readonly int $outputSizeCap = self::DEFAULT_OUTPUT_SIZE_CAP,
    ) {}

    /**
     * Normalise raw inbound extractor blocks against the signed allowlist.
     *
     * @param  list<mixed>  $raw
     * @param  list<string>  $allowedExtractors
     * @return array<string, string> name -> normalised output
     */
    public function normalise(array $raw, array $allowedExtractors, ClientExtractorRegistry $registry): array
    {
        $allowed = array_flip($allowedExtractors);
        $seen = [];
        $result = [];

        foreach ($raw as $block) {
            if (! is_array($block) || ! isset($block['name']) || ! is_string($block['name'])) {
                continue;
            }

            $name = $block['name'];
            $output = $block['output'] ?? null;

            if (! isset($allowed[$name])) {
                throw new \RuntimeException(
                    "Client extractor '{$name}' is not in the signed allowlist.",
                );
            }

            if (isset($seen[$name])) {
                throw new \RuntimeException(
                    "Duplicate client extractor block '{$name}'.",
                );
            }

            $seen[$name] = true;

            if ($output === null || ! is_string($output) || trim($output) === '') {
                continue;
            }

            if (strlen($output) > $this->outputSizeCap) {
                $output = substr($output, 0, $this->outputSizeCap).'[truncated]';
            }

            $result[$name] = $output;
        }

        return $result;
    }
}
