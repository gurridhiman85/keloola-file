<?php

namespace App\Repositories\Implementation;

use App\Models\UserRoles;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\RoleUsersRepositoryInterface;
use App\Repositories\Exceptions\RepositoryException;


//use Your Model

/**
 * Class RoleRepository.
 */
class RoleUsersRepository extends BaseRepository implements RoleUsersRepositoryInterface
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
        return UserRoles::class;
    }

    public function getRoleUsers($id)
    {
        $query = UserRoles::select(['users.firstName', 'users.lastName', 'users.userName', 'userRoles.userId', 'userRoles.roleId'])
            ->join('users', 'users.id', '=', 'userRoles.userId')
            ->join('roles', 'roles.id', '=', 'userRoles.roleId');

        $results = $query->where('roleId', $id)->get();
        return $results;
    }
    public function updateRoleUsers($roleId, $request)
    {

        $userRoles = UserRoles::where('roleId', '=', $roleId)->get();
        UserRoles::destroy($userRoles);
        if ($request['userRoles']) {

            foreach ($request['userRoles'] as $userRole) {
                $model = UserRoles::create([
                    'roleId' => $userRole['roleId'],
                    'userId' => $userRole['userId']
                ]);
            }
            $saved = $model->save();
            $this->resetModel();
            $result = $this->parseResult($model);

            if (!$saved) {
                throw new RepositoryException('Error in saving data.');
            }
            return  $result;
        } else {
            return [];
        }
    }
}
