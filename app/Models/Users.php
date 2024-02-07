<?php

namespace App\Models;

use Ramsey\Uuid\Uuid;
use Illuminate\Database\Eloquent\Model;
use App\Models\UserRoles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use App\Traits\Uuids;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
class Users extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use Notifiable, Uuids;
    protected $primaryKey = "id";
    public $timestamps = false;
    const CREATED_AT = 'createdDate';
    const UPDATED_AT = 'modifiedDate';

    protected $fillable = [
        'firstName', 'lastName', 'userName', 'email', 'emailConfirmed', 'phoneNumberConfirmed', 'twoFactorEnabled',
        'lockoutEnabled', 'accessFailedCount', 'password', 'isDeleted','phoneNumber','createdDate'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function userRoles()
    {
        return $this->hasMany(UserRoles::class, 'userId', 'id');
    }

    public function remindersUser()
    {
        return $this->hasMany(ReminderUsers::class, 'userId', 'id');
    }

    public function userClaims()
    {
        return $this->hasMany(UserClaims::class, 'userId', 'id');
    }

    public function documentUserPermissions()
    {
        return $this->hasMany(DocumentUserPermissions::class, 'userId', 'id');
    }

    public function documentComments()
    {
        return $this->hasMany(DocumentComments::class, 'createdBy', 'id');
    }

    public function userNotifications()
    {
        return $this->hasMany(UserNotifications::class,'userId', 'id');
    }

    public function documentVersions()
    {
        return $this->hasMany(DocumentVersions::class, 'createdBy', 'id');
    }

    public function documentAuditTrails()
    {
        return $this->hasMany(DocumentAuditTrails::class, 'createdBy', 'id');
    }

    public function getJWTCustomClaims()
    {
        return [

            // 'picture'         => $this->getPicture(),
            // 'confirmed'       => $this->confirmed,
            // 'registered_at'   => $this->created_at->toIso8601String(),
            // 'last_updated_at' => $this->updated_at->toIso8601String(),
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function (Model $model) {
            $model->setAttribute($model->getKeyName(), Uuid::uuid4());
            $userId = Auth::parseToken()->getPayload()->get('userId');
            $model->createdBy= $userId;
            $model->modifiedBy =$userId;
            $model->createdDate =Carbon::now();
        });

        static::addGlobalScope('isDeleted', function (Builder $builder) {
            $builder->where('isDeleted', '=', 0);
        });
    }
}
