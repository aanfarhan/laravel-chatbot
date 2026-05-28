<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Http\Controllers\PlaywrightFixtureController;
use Illuminate\Support\Facades\Route;

Route::get('/chatbot/test-fixture', PlaywrightFixtureController::class)
    ->name('chatbot.playwright-fixture');
