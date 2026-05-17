<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Http\Controllers\HealthController;
use Aanfarhan\Chatbot\Http\Controllers\HistoryController;
use Aanfarhan\Chatbot\Http\Controllers\MessagesController;
use Illuminate\Support\Facades\Route;

Route::get('/chatbot/health', HealthController::class)
    ->name('chatbot.health');

Route::post('/chatbot/messages', MessagesController::class)
    ->name('chatbot.messages');

Route::get('/chatbot/conversations/{id}/messages', HistoryController::class)
    ->name('chatbot.conversations.messages');

Route::get('/chatbot/widget.js', function () {
    return response()->file(
        __DIR__.'/../dist/chatbot-widget.js',
        ['Content-Type' => 'application/javascript; charset=UTF-8'],
    );
})->name('chatbot.widget-js');
