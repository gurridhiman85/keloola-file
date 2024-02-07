<?php

namespace App\Repositories\Implementation;

use App\Models\RoleClaims;
use App\Models\Roles;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Exceptions\RepositoryException;


//use Your Model

/**
 * Class RoleRepository.
 */
class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    /**
     * @var Model
     */
    protected $model;

    /**
     * BaseRepository constructor.
     *
     * @param Model $model
     */
    public static function model()
    {
        return Roles::class;
    }

    public function findRole($id)
    {
        $model = $this->model->with('roleClaims')->findOrFail($id);
        $this->resetModel();
        return $this->parseResult($model);
    }

    public function createRole(array $attributes)
    {
        $model = $this->model->newInstance($attributes);
        $model->save();
        $this->resetModel();
        $result = $this->parseResult($model);
        foreach ($attributes['roleClaims'] as $roleId) {
            $model = RoleClaims::create(array(
                'actionId' =>  $roleId['actionId'],
                'claimType' => $roleId['claimType'],
                'claimValue' => $roleId['claimValue'],
                'roleId' =>  $result->id,
            ));
            $model->save();
        }

        return $result;
    }


    public function updateRoleClaim($model, $id, $userRoles)
    {

        $roleclaim = RoleClaims::where('roleId', '=', $id)->get('id');
        RoleClaims::destroy($roleclaim);
        $result = $this->parseResult($model);

        foreach ($userRoles as $action) {
          RoleClaims::create(array(
                'roleId' =>    $action['roleId'],
                'actionId' =>  $action['actionId'],
                'claimType' => $action['claimType'],
                'claimValue' => $action['claimValue'],
            ));
        }

        $saved = $model->save();
        if (!$saved) {
            throw new RepositoryException('Error in saving data.');
        }
        $this->resetModel();

        $result = $this->parseResult($model);
        return $result;
    }
}
