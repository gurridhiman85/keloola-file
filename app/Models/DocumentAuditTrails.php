<?php

namespace App\Models;

use Ramsey\Uuid\Uuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Casts\Attribute;

class DocumentAuditTrails extends Model
{
    use HasFactory, SoftDeletes;
    use Notifiable, Uuids;
    protected $primaryKey = "id";
    protected  $table = 'documentAuditTrails';
    public $incrementing = false;

    const CREATED_AT = 'createdDate';
    const UPDATED_AT = 'modifiedDate';

    protected $fillable = [
        'documentId', 'operationName','assignToUserId','assignToRoleId', 'createdBy',
        'modifiedBy', 'isDeleted', 'is_anonymous'
    ];

    public function user()
    {
        return $this->belongsTo(Users::class, 'createdBy','assignToUserId');
    }

    public function document()
    {
        return $this->belongsTo(Documents::class, 'documentId');
    }

    public function roles()
    {
        return $this->belongsTo(Roles::class, 'assignToRoleId');
    }

    // public function getDocumentUrlAttribute($value)
    // {
    //     dd($value);
    //     // Modify the documentUrl attribute before returning it
    //     $baseUrl = 'https://example.com/'; // Replace this with your base URL
    //     return $baseUrl . $value;
    // }

    // protected function documentUrl(): Attribute
    // {
    //     return Attribute::make(
    //         get: function ($value) {
    //         $value_array = explode('/', $value);
    //         array_pop($value_array);
    //         $modified_value = implode('/', $value_array);
    //         return ucfirst($modified_value);
    //         }
    //     );
    // }

    protected static function boot()
    {
        parent::boot();
        static::creating(function (Model $model) {
            $userId = Auth::parseToken()->getPayload()->get('userId');
            $model->createdBy= $userId;
            $model->modifiedBy =$userId;
            $model->setAttribute($model->getKeyName(), Uuid::uuid4());
        });
        static::updating(function (Model $model) {
            $userId = Auth::parseToken()->getPayload()->get('userId');
            $model->modifiedBy =$userId;
        });
    }
}
