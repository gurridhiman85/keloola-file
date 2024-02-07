<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EmailSMTPSettings;
use Illuminate\Support\Facades\Validator;
use App\Repositories\Contracts\EmailSMTPSettingRepositoryInterface;

class EmailSMTPSettingController extends Controller
{
    private $emailSMTPSettingRepository;

    public function __construct(EmailSMTPSettingRepositoryInterface $emailSMTPSettingRepository)
    {
        $this->emailSMTPSettingRepository = $emailSMTPSettingRepository;
    }

    public function index()
    {
        return response()->json($this->emailSMTPSettingRepository->all());
    }

    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'userName' => "required|unique:emailSMTPSettings,userName,NULL,id,deleted_at,NULL",
        ]);

        if ($validator->fails()) {
            return response()->json($validator->messages(), 409);
        }

        return  response($this->emailSMTPSettingRepository->createEmailSMTP($request->all()), 201);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        return response()->json($this->emailSMTPSettingRepository->find($id));
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'userName' => "required|unique:emailSMTPSettings,userName,$id,id,deleted_at,NULL",
        ]);

        if ($validator->fails()) {
            return response()->json($validator->messages(), 409);
        }

        return   response()->json($this->emailSMTPSettingRepository->updateEmailSMTP($request, $id), 200);
    }

    public function destroy($id)
    {
        return response($this->emailSMTPSettingRepository->delete($id), 204);
    }
}
