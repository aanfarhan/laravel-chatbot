# Laravel AI Chatbot Widget

A Composer package that drops a context-aware chatbox onto any Laravel page. Declare what data the chat should see in your controller; the package handles signing, streaming, persistence, tool calling, and the frontend widget.

**📚 Full documentation: [aanfarhan.github.io/laravel-chatbot](https://aanfarhan.github.io/laravel-chatbot)**

## Requirements

- PHP 8.3+
- Laravel 11 or 12
- An OpenAI-compatible LLM provider (OpenAI, Azure, OpenRouter, Groq, Ollama, etc.)

## Install

```bash
composer require aanfarhan/laravel-chatbot
php artisan chatbot:install
```

## Use

```php
use Aanfarhan\Chatbot\Facades\Chatbot;

Route::get('/orders/{order}', function (Order $order) {
    Chatbot::context(['order' => new OrderResource($order)]);

    return view('orders.show', compact('order'));
})->name('orders.show');
```

```blade
<body>
    @yield('content')
    @chatbot
</body>
```

That's it. For everything else — channels, tool calling, client extractors, theming, GDPR, security, the full reference — see the **[documentation site](https://aanfarhan.github.io/laravel-chatbot)**.

## Links

- 📘 [Documentation](https://aanfarhan.github.io/laravel-chatbot)
- 🔒 [Security & threat model](https://aanfarhan.github.io/laravel-chatbot/guide/security)
- 📝 [Architecture decisions](https://aanfarhan.github.io/laravel-chatbot/decisions/)
- 🐛 [Issues](https://github.com/aanfarhan/laravel-chatbot/issues)
- 📦 [Packagist](https://packagist.org/packages/aanfarhan/laravel-chatbot)

## License

MIT
