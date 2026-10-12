<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'image',
        'is_active',
        'sort_order',
        'requires_verification',
        'requires_background_check',
        'requires_driving_documents',
        'requires_specialist_documents',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'requires_verification' => 'boolean',
            'requires_background_check' => 'boolean',
            'requires_driving_documents' => 'boolean',
            'requires_specialist_documents' => 'boolean',
        ];
    }
}