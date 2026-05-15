<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Aanfarhan\Chatbot\Facades\Chatbot;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Response;
use Illuminate\View\Factory as ViewFactory;

final class DemoController
{
    public function __invoke(Repository $config, ViewFactory $view): Response
    {
        if (! $config->get('chatbot.demo.enabled', false)) {
            abort(404);
        }

        $order = [
            'id'      => 'ORD-1042',
            'product' => 'Wireless Headphones',
            'status'  => 'Shipped',
            'total'   => '$89.99',
        ];

        Chatbot::context(['order' => $order]);

        return response($view->make('chatbot::demo', compact('order')));
    }
}
