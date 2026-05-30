<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Chatbot Demo</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .order-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .badge { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 0.85em; }
    </style>
</head>
<body>
    <h1>Demo Order Page</h1>
    <p>This is a demo page. The chatbot below is powered by <code>FakeClient</code> — no API key required.</p>

    <div class="order-card">
        <h2>Order #{{ $order['id'] }}</h2>
        <p><strong>Product:</strong> {{ $order['product'] }}</p>
        <p><strong>Status:</strong> <span class="badge">{{ $order['status'] }}</span></p>
        <p><strong>Total:</strong> {{ $order['total'] }}</p>
    </div>

    @chatbot

    <p><em>Demo mode is active. Set <code>chatbot.demo.enabled = false</code> before deploying to production.</em></p>
</body>
</html>
