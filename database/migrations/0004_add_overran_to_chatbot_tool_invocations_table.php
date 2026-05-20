<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chatbot_tool_invocations', function (Blueprint $table): void {
            // Advisory-budget overrun indicator. Recorded for tuning; never alters
            // control flow — a completed result is always fed to the model. See ADR-0006.
            $table->boolean('overran')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('chatbot_tool_invocations', function (Blueprint $table): void {
            $table->dropColumn('overran');
        });
    }
};
