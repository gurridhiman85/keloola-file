<?php

namespace App\Repositories\Implementation;

use App\Models\UserRoles;
use App\Models\Users;
use Illuminate\Support\Facades\Auth;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Exceptions\RepositoryException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;


//use Your Model

/**
 * Class UserRepository.
 */
class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    /**
     * @var Model
     */
    protected $model;

    /**
     * BaseRepository constructor..
     *
     *
     * @param Model $model
     */


    public static function model()
    {
        return Users::class;
    }

    public function getUsers($attributes)
    {
        //dd($attributes);
        $query = Users::select(['users.*'])->with('userRoles.role');

        if($attributes->role){
            // dd($attributes->role);
            $query = Users::select(['users.*','userRoles.userId'])->with('userRoles.role')
            ->join('userRoles', 'users.id', '=', 'userRoles.userId');
            $query = $query->where('userRoles.roleId',$attributes->role);
        }

        $orderByArray =  explode(' ', $attributes->orderBy);
        $orderBy = $orderByArray[0];
        $direction = $orderByArray[1] ?? 'asc';

        if ($orderBy == 'email') {
            $query = $query->orderBy('users.email', $direction);
        } else if ($orderBy == 'lastName') {
            $query = $query->orderBy('users.lastName', $direction);
        } else if ($orderBy == 'firstName') {
            $query = $query->orderBy('users.firstName', $direction);
        }else if ($orderBy == 'phoneNumber') {
            $query = $query->orderBy('users.phoneNumber', $direction);
        }

        if ($attributes->name) {
            $query = $query->where(function($subquery) use ($attributes){
                        $subquery->where('users.firstName', 'like', '%' . $attributes->name . '%')
                                ->orWhere('users.lastName', 'like', '%' . $attributes->name . '%');
                    });
        }
        if ($attributes->userName) {
            $query = $query->where('users.email', 'like', '%' . $attributes->userName . '%');
        }

        if ($attributes->createDateString) {
            $startDate = Carbon::parse($attributes->createDateString)->setTimezone('UTC');
            $endDate = Carbon::parse($attributes->createDateString)->setTimezone('UTC')->addDays(1)->addSeconds(-1);
            $query = $query->whereBetween('users.createdDate', [$startDate, $endDate]);
        }
        if($attributes->pageSize){
            $results = $query->skip($attributes->skip)->take($attributes->pageSize)->get();
        }else{
            $results = $query->get();
        }
        //dd($results->toArray());
        return $results;
    }

    public function getUsersCount($attributes)
    {
        $query = Users::query();

        if($attributes->role){
            // dd($attributes->role);
            $query = Users::query()
            ->join('userRoles', 'users.id', '=', 'userRoles.userId');
            $query = $query->where('userRoles.roleId',$attributes->role);
        }

        if ($attributes->name) {
            $query = $query->where(function($subquery) use ($attributes){
                        $subquery->where('users.userName', 'like', '%' . $attributes->name . '%');
                    });
        }
        if ($attributes->name) {
            $query = $query->where(function($subquery) use ($attributes){
                        $subquery->where('users.firstName', 'like', '%' . $attributes->name . '%')
                                ->orWhere('users.lastName', 'like', '%' . $attributes->name . '%');
                    });
        }

        if (!empty($attributes->userName)) {
            $query = $query->where('users.email', 'like', '%' . $attributes->userName . '%');
        }

        if ($attributes->createDateString) {
            $startDate = Carbon::parse($attributes->createDateString)->setTimezone('UTC');
            $endDate = Carbon::parse($attributes->createDateString)->setTimezone('UTC')->addDays(1)->addSeconds(-1);
            $query = $query->whereBetween('users.createdDate', [$startDate, $endDate]);
        }

        $count = $query->count();
        return $count;
    }

    public function createUser(array $attributes)
    {
        //dd($attributes);
        $model = $this->model->newInstance($attributes);
        $model->save();
        $this->resetModel();
        $result = $this->parseResult($model);
        foreach ($attributes['roleIds'] as $roleId) {
            $model = UserRoles::create(array(
                'userId' =>   $result->id,
                'roleId' =>  $roleId,
            ));
        }

        return $result;
    }

    public function findUser($id)
    {
        $model = $this->model->with('userRoles')->with('userClaims')->findOrFail($id);
        $this->resetModel();
        return $this->parseResult($model);
    }

    public function updateUser($model, $id, $userRoles)
    {
        $userRoles1 =  UserRoles::where('userId', '=', $id)->get('id');
        UserRoles::destroy($userRoles1);
        $result = $this->parseResult($model);

        foreach ($userRoles as $roleId) {
            UserRoles::create(array(
                'userId' =>   $result->id,
                'roleId' =>  $roleId,
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

    public function updateUserProfile($request)
    {
        $userId = Auth::parseToken()->getPayload()->get('userId');
        if ($userId == null) {
            throw new RepositoryException('User does not exist.');
        }

        $model = $this->model->findOrFail($userId);

        $model->firstName = $request->firstName;
        $model->lastName = $request->lastName;
        $model->phoneNumber = $request->phoneNumber;
        $saved = $model->save();
        if (!$saved) {
            throw new RepositoryException('Error in saving data.');
        }
        $this->resetModel();

        $result = $this->parseResult($model);


        return $result;
    }
    public function get_users_except_loggedIn(){
        $userId = Auth::parseToken()->getPayload()->get('userId');

        $users =  Users::where('id','!=',$userId)->get();
        return $users;
    }
}
