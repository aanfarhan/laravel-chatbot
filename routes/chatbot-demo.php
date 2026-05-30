<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;

Route::middleware((array) config('chatbot.route_middleware', ['web']))->group(function (): void {
    Route::get('/chatbot/demo', DemoController::class)->name('chatbot.demo');
});
