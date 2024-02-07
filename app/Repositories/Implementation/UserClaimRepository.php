<?php

namespace App\Repositories\Implementation;

use App\Models\UserClaims;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\UserClaimRepositoryInterface;
use App\Repositories\Exceptions\RepositoryException;

//use Your Model

/**
 * Class UserRepository.
 */
class UserClaimRepository extends BaseRepository implements UserClaimRepositoryInterface
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
        return UserClaims::class;
    }

    public function updateUserClaim($id, $userclaims)
    {
        $userclaim = UserClaims::where('userId', $id)->get();
        $model = UserClaims::destroy($userclaim);
        $result = $this->parseResult($model);

        foreach ($userclaims as $action) {
            $model1 =  UserClaims::create(array(
                'userId' =>    $action['userId'],
                'actionId' =>  $action['actionId'],
                'claimType' => $action['claimType'],
                'claimValue' => $action['claimValue'],
            ));
        }


        $saved = $model1->save();
        if (!$saved) {
            throw new RepositoryException('Error in saving data.');
        }
        $this->resetModel();

        $result = $this->parseResult($model1);
        return $result;
    }
}
