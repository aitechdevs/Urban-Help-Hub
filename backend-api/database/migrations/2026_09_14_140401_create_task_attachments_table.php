<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_disk', 50)->default('private');

            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();

            $table->string('attachment_type', 40)
                ->default('general');

            $table->text('description')->nullable();

            $table->timestamps();

            $table->index('task_id');
            $table->index('uploaded_by');
            $table->index('attachment_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_attachments');
    }
};