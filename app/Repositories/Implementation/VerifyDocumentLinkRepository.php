<?php

namespace App\Repositories\Implementation;

use App\Models\DocumentMetaDatas;
use App\Models\DocumentAuditTrails;
use App\Models\DocumentOperationEnum;
use App\Models\DocumentRolePermissions;
use App\Models\Documents;
use App\Models\VerifyDocumentLinks;
use App\Models\DocumentUserPermissions;
use App\Models\UserRoles;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\VerifyDocumentLinkInterface;
use App\Repositories\Exceptions\RepositoryException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
//use Your Model

/**
 * Class UserRepository.
 */
class VerifyDocumentLinkRepository extends BaseRepository implements VerifyDocumentLinkInterface
{
    /**
     * @var Model
     */
    protected $model;
    protected $startDate;
    protected $endDate;

    /**
     * BaseRepository constructor..
     *
     * @param Model $model
     */


    public static function model()
    {
        return VerifyDocumentLinks::class;
    }

    public function saveVerifyDocumentLink($data)
    {
        $model = $this->model->newInstance($data);
        $model->documentId = $data['documentId'];
        if(isset($data['documentPath']) && !empty($data['documentPath'])){
            $model->documentPath = $data['documentPath'];
        }
        if(isset($data['password']) && !empty($data['password'])){
            $model->password = $data['password'];
        }
        $model->createdDate = date("Y-m-d H:i:s");
        $saved = $model->save();
        $this->resetModel();
        $result = $this->parseResult($model);

        if (!$saved) {
            throw new RepositoryException('Error in saving data.');
        }

        return (string)$result->id;
    }

    public function updateVerifyDocumentLink($data)
    {
        $model = $this->model->where('documentId',$data['documentId'])->where('createdBy',$data['createdBy'])->first();

        if (isset($data['isTimeBound']) && $data['isTimeBound']) {
            $startdate1 = date('Y-m-d', strtotime(str_replace('/', '-', $data['startDate'])));
            $enddate1 = date('Y-m-d', strtotime(str_replace('/', '-', $data['endDate'])));
            $this->startDate = Carbon::createFromFormat('Y-m-d', $startdate1)->startOfDay();
            $this->endDate = Carbon::createFromFormat('Y-m-d', $enddate1)->endOfDay();
        }

        if(isset($data['documentPath']) && !empty($data['documentPath'])){
            $model->documentPath = $data['documentPath'];
        }
        if(isset($data['password']) && !empty($data['password'])){
            $model->password = Crypt::encryptString($data['password']);
        }
        if(isset($data['link']) && !empty($data['link'])){
            $model->link = $data['link'];
        }
        if(isset($data['isTimeBound'])){
            $model->isTimeBound = $data['isTimeBound'];
        }else{
            $model->isTimeBound = 0;
        }
        if(isset($data['isTimeBound']) && $data['isTimeBound'] && !empty($this->startDate)){
            $model->startDate = $this->startDate;
        }else{
            $model->startDate = '';
        }
        if(isset($data['isTimeBound']) && $data['isTimeBound'] && !empty($this->endDate)){
            $model->endDate = $this->endDate;
        }else{
            $model->endDate = '';
        }
        if(isset($data['allowPassword'])){
            $model->allowPassword = $data['allowPassword'];
        }else{
            $model->allowPassword = 0;
        }
        if(isset($data['selectedAllowedType'])){
            $model->allowType = $data['selectedAllowedType'];
        }

        $saved = $model->save();
        $this->resetModel();
        $result = $this->parseResult($model);

        if (!$saved) {
            throw new RepositoryException('Error in saving data.');
        }
        return $result;
    }
}
