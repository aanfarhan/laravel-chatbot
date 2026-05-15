<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;

Route::get('/chatbot/demo', DemoController::class)->name('chatbot.demo');
