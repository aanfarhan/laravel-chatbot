<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chatbot_tool_invocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('conversation_id')
                ->constrained('chatbot_conversations')
                ->cascadeOnDelete();
            $table->foreignId('message_id')
                ->nullable()
                ->constrained('chatbot_messages')
                ->nullOnDelete();
            $table->string('tool_name');
            $table->json('arguments');
            $table->text('result');
            $table->string('status');
            $table->text('error')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at');

            $table->index(['conversation_id', 'finished_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_tool_invocations');
    }
};
