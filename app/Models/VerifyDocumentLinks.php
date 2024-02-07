<?php

namespace App\Models;
use Ramsey\Uuid\Uuid;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Builder;

class VerifyDocumentLinks extends Model
{
    use HasFactory;
    use Notifiable, Uuids;
    public $timestamps = false;
    const CREATED_AT = 'createdDate';
    protected $table = 'verifydocumentlinks';
    public $incrementing = false;

    protected $fillable = [
        'documentId', 'password', 'toEmail', 'createdBy','createdDate'
    ];

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

        // static::addGlobalScope('isDeleted', function (Builder $builder) {
        //     $builder->where('documents.isDeleted', '=', 0);
        // });
    }
}
