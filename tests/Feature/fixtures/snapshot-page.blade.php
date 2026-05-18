<!DOCTYPE html>
<html>
<body>
@chatbotSnapshot('article')
<p>The order total is {{ $total }} dollars.</p>
@endChatbotSnapshot
@isset($rows)
@foreach ($rows as $row)
@chatbotSnapshot('rows')
<p>{{ $row }}</p>
@endChatbotSnapshot
@endforeach
@endisset
@chatbot
</body>
</html>
