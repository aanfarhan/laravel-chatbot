<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Blade;

use InvalidArgumentException;

final class BladeSnapshotCompiler
{
    public function open(string $expression): string
    {
        $trimmed = trim($expression);
        if ($trimmed === '') {
            throw new InvalidArgumentException(
                '@chatbotSnapshot requires a label expression, e.g. @chatbotSnapshot(\'article\').',
            );
        }

        return '<?php echo \'<span data-chatbot-snapshot="\'.e('.$trimmed.').\'" style="display:contents">\'; ?>';
    }

    public function close(): string
    {
        return '<?php echo \'</span>\'; ?>';
    }
}
