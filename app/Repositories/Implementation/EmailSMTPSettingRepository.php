<?php

namespace App\Repositories\Implementation;


use App\Models\EmailSMTPSettings;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\EmailSMTPSettingRepositoryInterface;



class EmailSMTPSettingRepository extends BaseRepository implements EmailSMTPSettingRepositoryInterface
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
        return EmailSMTPSettings::class;
    }

    public function createEmailSMTP($attribute)
    {

        $model = $this->model->newInstance($attribute);

        if ($model->isDefault) {

            $defaultEmailSMTPSettings = EmailSMTPSettings::where('isDefault', '=', 1)->get();

            foreach ($defaultEmailSMTPSettings as $defaultEmailSMTPSetting) {
                $defaultEmailSMTPSetting->isDefault = false;
                $defaultEmailSMTPSetting->save();
            }
        }

        $model->save();
        $this->resetModel();
        $result = $this->parseResult($model);

        return $result;
    }

    public function updateEmailSMTP($request, $id)
    {
        $entityExist = $this->model->findOrFail($id);
       
        $entityExist->isDefault = $request->isDefault;
        $entityExist->isEnableSSL = $request->isEnableSSL;
        $entityExist->host = $request->host;
        $entityExist->port = $request->port;
        $entityExist->userName = $request->userName;
        $entityExist->password = $request->password;

        // remove other as default
        if ($entityExist->isDefault) {

            $defaultEmailSMTPSettings = EmailSMTPSettings::where('isDefault', '=', 1)->get();

            foreach ($defaultEmailSMTPSettings as $defaultEmailSMTPSetting) {
                $defaultEmailSMTPSetting->isDefault = false;
                $defaultEmailSMTPSetting->save();
            }
        }

        $entityExist->save();
        $this->resetModel();
        $result = $this->parseResult($entityExist);

        return $result;
    }
}
