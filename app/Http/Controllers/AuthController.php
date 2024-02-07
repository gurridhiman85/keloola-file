<?php

namespace App\Http\Controllers;

use App\Models\LoginAudit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\Carbon;

class AuthController extends Controller
{
    private $userRepository;
    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');
        $token = Auth::claims([])->attempt($credentials);
        $remoteIP = $this->getIp();

        $model = LoginAudit::create([
            'userName' => $request['email'],
            'loginTime' => Carbon::now(),
            'remoteIP' => $remoteIP,
            'status' => $token ? 'Success' : 'Error',
            'latitude' => $request['latitude'],
            'longitude' => $request['longitude']
        ]);

        $model->save();

        if (!$token) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        $user = Auth::user();

        $userClaimsFromRole =  DB::table('userRoles')
            ->select('roleClaims.claimType')
            ->leftJoin('roles', 'roles.id', '=', 'userRoles.roleId')
            ->leftJoin('roleClaims', 'roleClaims.roleId', '=', 'roles.id')
            ->where('userRoles.userId', '=', $user->id)
            ->get()
            ->toArray();

        $userIndividualClaims = DB::table('userClaims')
            ->select('claimType')
            ->where('userClaims.userId', '=', $user->id)
            ->get()
            ->toArray();

        $allClaimsObjArray = array_merge($userClaimsFromRole, $userIndividualClaims);

        $userClaims = array_map(function ($value) {
            return $value->claimType;
        }, $allClaimsObjArray);

        $user->claims = $userClaims;

        $token = Auth::claims(array('claims' => $userClaims, 'email' => $user->email, 'userId' => $user->id))->attempt($credentials);

        return response()->json([
            'status' => 'success',
            'claims' => $userClaims,
            'user' => [
                'id' => $user->id,
                'firstName' =>  $user->firstName,
                'lastName' => $user->lastName,
                'email' => $user->email,
                'userName' => $user->userName,
                'phoneNumber' => $user->phoneNumber
            ],
            'authorisation' => [
                'token' => $token,
                'type' => 'bearer',
            ]
        ]);
    }

    public function refresh()
    {
        $userId = Auth::parseToken()->getPayload()->get('userId');
        $token = Auth::getToken();
        $user = $this->userRepository->findUser($userId);

        $userClaimsFromRole =  DB::table('userRoles')
            ->select('roleClaims.claimType')
            ->leftJoin('roles', 'roles.id', '=', 'userRoles.roleId')
            ->leftJoin('roleClaims', 'roleClaims.roleId', '=', 'roles.id')
            ->where('userRoles.userId', '=', $user->id)
            ->get()
            ->toArray();

        $userIndividualClaims = DB::table('userClaims')
            ->select('claimType')
            ->where('userClaims.userId', '=', $user->id)
            ->get()
            ->toArray();

        $allClaimsObjArray = array_merge($userClaimsFromRole, $userIndividualClaims);

        $userClaims = array_map(function ($value) {
            return $value->claimType;
        }, $allClaimsObjArray);

        $user->claims = $userClaims;

        $token = Auth::claims(array('claims' => $userClaims, 'email' => $user->email, 'userId' => $user->id))->refresh($token);

        return response()->json([
            'status' => 'success',
            'claims' => $userClaims,
            'user' => [
                'id' => $user->id,
                'firstName' =>  $user->firstName,
                'lastName' => $user->lastName,
                'email' => $user->email,
                'userName' => $user->userName,
                'phoneNumber' => $user->phoneNumber
            ],
            'authorisation' => [
                'token' => $token,
                'type' => 'bearer',
            ]
        ]);
    }

    public function testToken()
    {
        $token = Auth::parseToken();
        return $token->getPayload()->get('Peter');
    }

    public function getIp()
    {
        foreach (array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR') as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip); // just to be safe
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return request()->ip(); // it will return the server IP if the client IP is not found using this method.
    }
}
