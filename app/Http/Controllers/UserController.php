<?php

namespace App\Http\Controllers;

use App\Models\Users;
use App\Http\Dto\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;


class UserController extends Controller
{
    private $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function index(Request $request)
    {
        $this->queryString = new UserResource();

        if ($request->has('Fields')) {
            $this->queryString->fields = $request->input('Fields');
        }
        if ($request->has('OrderBy')) {
            $this->queryString->orderBy = $request->input('OrderBy');
        }
        if ($request->has('PageSize')) {
            $this->queryString->pageSize = $request->input('PageSize');
        }
        if ($request->has('createDateString')) {
            $this->queryString->createDateString = $request->input('createDateString');
        }
        if ($request->has('SearchQuery')) {
            $this->queryString->searchQuery = $request->input('SearchQuery');
        }
        if ($request->has('Skip')) {
            $this->queryString->skip = $request->input('Skip');
        }
        if ($request->has('id')) {
            $this->queryString->id = $request->input('id');
        }
        if ($request->has('name')) {
            $this->queryString->name = $request->input('name');
        }
        if ($request->has('userName')) {
            $this->queryString->userName = $request->input('userName');
        }
        if ($request->has('role')) {
            $this->queryString->role = $request->input('role');
        }

        $count = $this->userRepository->getUsersCount($this->queryString);
        return response()->json($this->userRepository->getUsers($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);

        //return response()->json($this->userRepository->all());
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */

    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'       => ['required', 'email', 'unique:' . (new Users())->getTable()],
            'firstName' =>   ['required'],
        ]);

        if ($validator->fails()) {
            return response()->json($validator->messages(), 409);
        }

        $request['password'] = Hash::make($request->password);
        return  response()->json($this->userRepository->createUser($request->all()), 201);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        return response()->json($this->userRepository->findUser($id));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $request->except(['password']);
        $model = $this->userRepository->find($id);
        $model->firstName = $request->firstName;
        $model->lastName = $request->lastName;
        $model->phoneNumber = $request->phoneNumber;
        $model->userName = $request->userName;
        $model->email = $request->email;

        return  response()->json($this->userRepository->updateUser($model, $id, $request['roleIds']), 200);
    }

    public function destroy($id)
    {
        return response($this->userRepository->delete($id), 204);
    }

    public function updateUserProfile(Request $request)
    {
        return  response()->json($this->userRepository->updateUserProfile($request), 200);
    }

    public function submitResetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users',
            'password' => 'required'
        ]);

        $user = Users::where('email', $request->email)
            ->update(['password' => Hash::make($request->password)]);

        return  response()->json(($user), 204);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'oldPassword' => 'required',
            'newPassword' => 'required',
        ]);

        if (!(Hash::check($request->get('oldPassword'), Auth::user()->password))) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Old Password does not match!',
            ], 422);
        }

        Users::whereId(auth()->user()->id)->update([
            'password' => Hash::make($request->newPassword)
        ]);

        return response()->json([], 200);
    }

    public function get_users(){
        return response()->json($this->userRepository->get_users_except_loggedIn());
    }
}
