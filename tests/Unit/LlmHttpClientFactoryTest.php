<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Http\LlmHttpClientFactory;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\CurlHandler;
use GuzzleHttp\HandlerStack;

it('make() returns a GuzzleClient with connect_timeout and read_timeout', function (): void {
    $client = LlmHttpClientFactory::make([
        'connect_timeout' => 5.0,
        'read_timeout' => 45.0,
    ]);

    expect($client)->toBeInstanceOf(GuzzleClient::class);
    expect($client->getConfig('connect_timeout'))->toBe(5.0);
    expect($client->getConfig('read_timeout'))->toBe(45.0);
});

it('make() uses a HandlerStack wrapping CurlHandler when curl extension is loaded', function (): void {
    if (! \extension_loaded('curl')) {
        $this->markTestSkipped('curl extension not available');
    }

    $client = LlmHttpClientFactory::make(['connect_timeout' => 5.0, 'read_timeout' => 30.0]);
    $stack = $client->getConfig('handler');

    expect($stack)->toBeInstanceOf(HandlerStack::class);

    $ref = new ReflectionProperty(HandlerStack::class, 'handler');
    $ref->setAccessible(true);
    expect($ref->getValue($stack))->toBeInstanceOf(CurlHandler::class);
});
