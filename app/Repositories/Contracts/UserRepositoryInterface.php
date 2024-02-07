<?php

namespace App\Repositories\Contracts;
use App\Repositories\Contracts\BaseRepositoryInterface;

interface UserRepositoryInterface extends BaseRepositoryInterface
{
    public function getUsers($attributes);
    public function getUsersCount($attributes);
    public function createUser(array $attributes);
    public function findUser($id);
    public function updateUser($model, $id, $userRoles);
    public function updateUserProfile($request);
    public function get_users_except_loggedIn();
}
