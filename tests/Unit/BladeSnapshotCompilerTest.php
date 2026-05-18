<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Blade\BladeSnapshotCompiler;

function compileAndRender(string $compiledPhp): string
{
    ob_start();
    eval('?>'.$compiledPhp);

    return (string) ob_get_clean();
}

it('compiles the opening directive into a marker with the label and invisible styling', function (): void {
    $compiler = new BladeSnapshotCompiler;

    $rendered = compileAndRender($compiler->open("'article'"));

    expect($rendered)->toContain('data-chatbot-snapshot="article"');
    expect($rendered)->toContain('display:contents');
});

it('emits the closing directive as a matching tag', function (): void {
    $compiler = new BladeSnapshotCompiler;

    $opened = compileAndRender($compiler->open("'article'"));
    $closed = compileAndRender($compiler->close());

    $tagName = (string) preg_replace('/^\s*<(\w+).*$/s', '$1', $opened);
    expect($closed)->toBe('</'.$tagName.'>');
});

it('html-escapes the label expression', function (): void {
    $compiler = new BladeSnapshotCompiler;

    $rendered = compileAndRender($compiler->open("'\"><script>'"));

    expect($rendered)->not->toContain('<script>');
    expect($rendered)->toContain('&lt;script&gt;');
});

it('throws when the label expression is empty', function (): void {
    $compiler = new BladeSnapshotCompiler;

    $compiler->open('');
})->throws(InvalidArgumentException::class);

it('throws when the label expression is whitespace only', function (): void {
    $compiler = new BladeSnapshotCompiler;

    $compiler->open('   ');
})->throws(InvalidArgumentException::class);
