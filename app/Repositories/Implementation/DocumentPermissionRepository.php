<?php

namespace App\Repositories\Implementation;

use App\Models\DocumentAuditTrails;
use App\Models\DocumentRolePermissions;
use App\Models\DocumentUserPermissions;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\DocumentPermissionRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\DocumentOperationEnum;
use App\Models\Documents;
use App\Models\UserNotifications;
use App\Models\UserRoles;
use Illuminate\Support\Facades\Auth;


class DocumentPermissionRepository extends BaseRepository implements DocumentPermissionRepositoryInterface
{

    /**
     * @var Model
     */
    protected $model;
    protected $startDate;
    protected $endDate;
    private $list;


    /**
     * BaseRepository constructor.
     *
     * @param Model $model
     */
    public static function model()
    {
        return DocumentRolePermissions::class;
    }

    public function getDocumentPermissionList($id)
    {
        $documentRolePermission = DocumentRolePermissions::where('documentId', '=', $id)->with('role')->get();
        $documentRolePermissionList = $documentRolePermission->map(function ($item) {
            $item->type = 'Role';
            return $item;
        });
        $documentUserPermission = DocumentUserPermissions::where('documentId', '=', $id)
            ->with(['user' => function ($query) {
                $query->select('id', 'username', 'firstName', 'lastName', 'email');
            }])->get();
        $documentUserPermissionList = $documentUserPermission->map(function ($item) {
            $item->type = 'User';
            return $item;
        });
        $result = $documentRolePermissionList->concat($documentUserPermissionList);
        return $result;
    }

    public function addDocumentRolePermission($request)
    {

        $documentRolePermissions = $request['documentRolePermissions'];
        if(!empty($documentRolePermissions)){
            $rolePermissionsArray = array();
            /**this follow is for remove and add new permissions according to selected */
            $sharedDetails = $this->getDocumentPermissionList($documentRolePermissions[0]['documentId']);
            $insertedRoles = [];
            $selectedRoles = [];
            if(!empty($sharedDetails)){
                $insertedRoles = array_column($sharedDetails->toArray(),'roleId');
            }
            $selectedRoles = array_column($documentRolePermissions,'roleId');

            $allowedRoles = array_diff($selectedRoles,$insertedRoles);
            $deleteRoles = array_diff($insertedRoles,$selectedRoles);

            if(!empty($deleteRoles)){
                foreach($deleteRoles as $deleteRole){
                    $permissionModel = DocumentAuditTrails::create([
                        'documentId' => $documentRolePermissions[0]['documentId'],
                        'createdDate' =>  Carbon::now(),
                        'operationName' => DocumentOperationEnum::Remove_Permission->value,
                        'assignToRoleId' => $deleteRole
                    ]);
                    DocumentRolePermissions::where('documentId',$documentRolePermissions[0]['documentId'])->where('roleId',$deleteRole)->delete();
                }
            }
            foreach ($documentRolePermissions as $docuemntrole) {
                if(in_array($docuemntrole['roleId'],$allowedRoles)){
                    if ($docuemntrole['isTimeBound']) {
                        $startdate1 = date('Y-m-d', strtotime(str_replace('/', '-', $docuemntrole['startDate'])));
                        $enddate1 = date('Y-m-d', strtotime(str_replace('/', '-', $docuemntrole['endDate'])));
                        $this->startDate = Carbon::createFromFormat('Y-m-d', $startdate1)->startOfDay();
                        $this->endDate = Carbon::createFromFormat('Y-m-d', $enddate1)->endOfDay();
                    }

                    $model = DocumentRolePermissions::create([
                        'documentId' => $docuemntrole['documentId'],
                        'endDate' => $this->endDate  ?? '',
                        'isAllowDownload' => $docuemntrole['isAllowDownload'],
                        'isAllowCopyMove' => $docuemntrole['isAllowCopyMove'],
                        'isTimeBound' => $docuemntrole['isTimeBound'],
                        'roleId' => $docuemntrole['roleId'],
                        'startDate' => $this->startDate ?? ''
                    ]);

                    $permissionModel = DocumentAuditTrails::create([
                        'documentId' => $docuemntrole['documentId'],
                        'createdDate' =>  Carbon::now(),
                        'operationName' => DocumentOperationEnum::Add_Permission->value,
                        'assignToRoleId' => $docuemntrole['roleId']
                    ]);

                    $userIds = UserRoles::select('userId')
                        ->where('roleId', $docuemntrole['roleId'])
                        ->get();

                    foreach ($userIds as $userIdObject) {
                        array_push($rolePermissionsArray, [
                            'documentId' => $docuemntrole['documentId'],
                            'userId' => $userIdObject['userId']
                        ]);
                    }
                }
            }

            $rolePermissions = array_unique($rolePermissionsArray, SORT_REGULAR);
            foreach ($rolePermissions as $rolePermission) {
                $notification = UserNotifications::create([
                    'documentId' => $rolePermission['documentId'],
                    'userId' => $rolePermission['userId']
                ]);
            }
            if(!empty($model)){
                $model->save();
            }
            if(!empty($permissionModel)){
                $permissionModel->save();
            }
            if(!empty($rolePermissions)){
                $notification->save();
            }
            $this->resetModel();
            if(!empty($model)){
                $result = $this->parseResult($model);
                return $result->toArray();
            }

        }
    }

    public function addDocumentUserPermission($request)
    {
        $documentUserPermissions = $request['documentUserPermissions'];
        if(!empty($documentUserPermissions)){
            /**this follow is for remove and add new permissions according to selected */
            $sharedDetails = $this->getDocumentPermissionList($documentUserPermissions[0]['documentId']);
            $insertedUsers = [];
            $selectedUsers = [];
            if(!empty($sharedDetails)){
                $insertedUsers = array_column($sharedDetails->toArray(),'userId');
            }
            $selectedUsers = array_column($documentUserPermissions,'userId');

            $allowedUsers = array_diff($selectedUsers,$insertedUsers);
            $deleteUsers = array_diff($insertedUsers,$selectedUsers);

            if(!empty($deleteUsers)){
                foreach($deleteUsers as $deleteUser){
                    $permissionModel = DocumentAuditTrails::create([
                        'documentId' => $documentUserPermissions[0]['documentId'],
                        'createdDate' =>  Carbon::now(),
                        'operationName' => DocumentOperationEnum::Remove_Permission->value,
                        'assignToUserId' => $deleteUser
                    ]);
                    DocumentUserPermissions::where('documentId',$documentUserPermissions[0]['documentId'])->where('userId',$deleteUser)->delete();
                }
            }

            foreach ($documentUserPermissions as $docuemntUser) {
                if(in_array($docuemntUser['userId'],$allowedUsers)){
                    if ($docuemntUser['isTimeBound']) {
                        $startdate1 = date('Y-m-d', strtotime(str_replace('/', '-', $docuemntUser['startDate'])));
                        $enddate1 = date('Y-m-d', strtotime(str_replace('/', '-', $docuemntUser['endDate'])));
                        $this->startDate = Carbon::createFromFormat('Y-m-d', $startdate1)->startOfDay();
                        $this->endDate = Carbon::createFromFormat('Y-m-d', $enddate1)->endOfDay();
                    }

                    $model = DocumentUserPermissions::create([
                        'documentId' => $docuemntUser['documentId'],
                        'endDate' => $this->endDate  ?? '',
                        'isAllowDownload' => $docuemntUser['isAllowDownload'],
                        'isAllowCopyMove' => $docuemntUser['isAllowCopyMove'],
                        'isTimeBound' => $docuemntUser['isTimeBound'],
                        'userId' => $docuemntUser['userId'],
                        'startDate' => $this->startDate ?? ''
                    ]);

                    $permissionModel = DocumentAuditTrails::create([
                        'documentId' => $docuemntUser['documentId'],
                        'createdDate' =>  Carbon::now(),
                        'operationName' => DocumentOperationEnum::Add_Permission->value,
                        'assignToUserId' => $docuemntUser['userId']
                    ]);

                    $notification = UserNotifications::create([
                        'documentId' => $docuemntUser['documentId'],
                        'userId' => $docuemntUser['userId']
                    ]);
                    $model->save();
                    $permissionModel->save();
                    $notification->save();
                    $this->resetModel();
                    $result = $this->parseResult($model);
                }

            }
            if(!empty($result)){
                return $result->toArray();
            }
        }
    }

    public function deleteDocumentUserPermission($id)
    {
        $model = DocumentUserPermissions::find($id);
        if (!is_null($model)) {
            $permissionModel = DocumentAuditTrails::create([
                'documentId' => $model->documentId,
                'createdDate' =>  Carbon::now(),
                'operationName' => DocumentOperationEnum::Remove_Permission->value,
                'assignToUserId' => $model->userId
            ]);
            $permissionModel->save();
        }

        return DocumentUserPermissions::destroy($id);
    }

    public function deleteDocumentRolePermission($id)
    {
        $model = DocumentRolePermissions::find($id);
        if (!is_null($model)) {
            $permissionModel = DocumentAuditTrails::create([
                'documentId' => $model->documentId,
                'createdDate' =>  Carbon::now(),
                'operationName' => DocumentOperationEnum::Remove_Permission->value,
                'assignToRoleId' => $model->roleId
            ]);
            $permissionModel->save();
        }
        return DocumentRolePermissions::destroy($id);
    }

    public function multipleDocumentsToUsersAndRoles($request)
    {
        $permissionsArray = array();
        foreach ($request['documents'] as $document) {
            $childDocumentIds = $this->get_child_documents($document);

            foreach($childDocumentIds as $childId){
                if ($request['isTimeBound']) {
                    $startdate = date('Y-m-d', strtotime(str_replace('/', '-', $request['startDate'])));
                    $endDate = date('Y-m-d', strtotime(str_replace('/', '-', $request['endDate'])));
                    if ($request['roles']) {
                        foreach ($request['roles'] as $role) {
                            $model = DocumentRolePermissions::create([
                                'documentId' => $childId,
                                'endDate' => $endDate ?? '',
                                'isAllowDownload' => $request['isAllowDownload'],
                                'isTimeBound' => $request['isTimeBound'],
                                'roleId' => $role,
                                'startDate' => $startdate ?? ''
                            ]);

                            $userIds = UserRoles::select('userId')
                                ->where('roleId', $role)
                                ->get();


                            foreach ($userIds as $userIdObject) {
                                array_push($permissionsArray, [
                                    'documentId' => $childId,
                                    'userId' => $userIdObject['userId']
                                ]);
                            }
                        }
                    }
                    if ($request['users']) {
                        foreach ($request['users'] as $user) {
                            $model = DocumentUserPermissions::create([
                                'documentId' => $childId,
                                'endDate' => $endDate ?? '',
                                'isAllowDownload' => $request['isAllowDownload'],
                                'isTimeBound' => $request['isTimeBound'],
                                'userId' => $user,
                                'startDate' => $startdate ?? ''
                            ]);

                            array_push($permissionsArray, [
                                'documentId' => $childId,
                                'userId' => $user
                            ]);
                        }
                    }
                } else {
                    if ($request['roles']) {
                        foreach ($request['roles'] as $role) {
                            $model = DocumentRolePermissions::create([
                                'documentId' => $childId,
                                'isAllowDownload' => $request['isAllowDownload'],
                                'isTimeBound' => $request['isTimeBound'],
                                'roleId' => $role,
                            ]);

                            $userIds = UserRoles::select('userId')
                                ->where('roleId', $role)
                                ->get();

                            $userIds = UserRoles::select('userId')
                                ->where('roleId', $role)
                                ->get();


                            foreach ($userIds as $userIdObject) {
                                array_push($permissionsArray, [
                                    'documentId' => $childId,
                                    'userId' => $userIdObject['userId']
                                ]);
                            }
                        }
                    }
                    if ($request['users']) {
                        foreach ($request['users'] as $user) {
                            $model = DocumentUserPermissions::create([
                                'documentId' => $childId,
                                'isAllowDownload' => $request['isAllowDownload'],
                                'isTimeBound' => $request['isTimeBound'],
                                'userId' => $user,
                            ]);

                            array_push($permissionsArray, [
                                'documentId' => $childId,
                                'userId' => $user
                            ]);
                        }
                    }
                }
            }
        }

        $permissions = array_unique($permissionsArray, SORT_REGULAR);
        foreach ($permissions as $permission) {
            $notification = UserNotifications::create([
                'documentId' => $permission['documentId'],
                'userId' => $permission['userId']
            ]);
        }

        $model->save();
        $notification->save();
        $this->resetModel();
        $result = $this->parseResult($model);
        return $result->toArray();
    }

    public function getIsDownloadFlag($id, $isPermission)
    {
        if($isPermission == 'true'){
            return true;
        }
        $userId = Auth::parseToken()->getPayload()->get('userId');
        $userRoles = UserRoles::select('roleId')
            ->where('userId', $userId)
            ->get();
        $query = Documents::where('documents.id',  '=', $id)
            ->where(function ($query) use ($userId, $userRoles) {
                $query->whereExists(function ($query) use ($userId) {
                    $query->select(DB::raw(1))
                        ->from('documentUserPermissions')
                        ->whereRaw('documentUserPermissions.documentId = documents.id')
                        ->where('documentUserPermissions.userId', '=', $userId)
                        ->where('documentUserPermissions.isAllowDownload', '=', true)
                        ->where(function ($query) {
                            $query->where('documentUserPermissions.isTimeBound', '=', '0')
                                ->orWhere(function ($query) {
                                    $date = date('Y-m-d');
                                    $startDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
                                    $endDate = Carbon::createFromFormat('Y-m-d', $date)->endOfDay();
                                    $query->where('documentUserPermissions.isTimeBound', '=', '1')
                                        ->whereDate('documentUserPermissions.startDate', '<=', $startDate)
                                        ->whereDate('documentUserPermissions.endDate', '>=', $endDate);
                                });
                        });
                })->orWhereExists(function ($query) use ($userRoles) {
                    $query->select(DB::raw(1))
                        ->from('documentRolePermissions')
                        ->whereRaw('documentRolePermissions.documentId = documents.id')
                        ->where('documentRolePermissions.isAllowDownload', '=', true)
                        ->whereIn('documentRolePermissions.roleId', $userRoles)
                        ->where(function ($query) {
                            $query->where('documentRolePermissions.isTimeBound', '=', '0')
                                ->orWhere(function ($query) {
                                    $date = date('Y-m-d');
                                    $startDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
                                    $endDate = Carbon::createFromFormat('Y-m-d', $date)->endOfDay();
                                    $query->where('documentRolePermissions.isTimeBound', '=', '1')
                                        ->whereDate('documentRolePermissions.startDate', '<=', $startDate)
                                        ->whereDate('documentRolePermissions.endDate', '>=', $endDate);
                                });
                        });
                });
            });


        $count = $query->count();
        $checkAssign = 0;
        //this flow will if any of its parent folders has permission for download or not using role and user
        if($count < 1){
            $parent_documents_array = [];
            if(!empty($id)){
                $parent_documents_array = $this->create_all_parent_array($id);
            }
            $userId = Auth::parseToken()->getPayload()->get('userId');

            if(!empty($parent_documents_array)){
                $checkAssignDataUser = DocumentUserPermissions::where('userId',$userId)->where('isAllowDownload', '=', true)->whereIn('documentId',$parent_documents_array)->get();
                if(!empty($checkAssignDataUser) && count($checkAssignDataUser) > 0 ){
                    $checkAssign = 1;
                }
                $checkAssignDataRole = DocumentRolePermissions::whereIn('roleId', $userRoles)->where('isAllowDownload', '=', true)->whereIn('documentId',$parent_documents_array)->get();
                if(!empty($checkAssignDataRole) && count($checkAssignDataRole) > 0 ){
                    $checkAssign = 1;
                }
            }
        }
        return $count + $checkAssign > 0 ? true : false;
    }

    public function create_all_parent_array($parentId = null){
        $array = [];

        if(!empty($parentId)){
            $details = Documents::where('id',$parentId)->first();
            if(!empty($details)){
                array_push($array,$details['id']);
                if(!empty($details['parentId'])){
                    $result = $this->create_all_parent_array($details['parentId']);
                    if(!empty($result)){
                        $array = array_merge($array,$result);
                    }
                }
            }
        }
        return $array;
    }

    public function get_child_documents($id){
        $all_ids = [];
        if($id){
            array_push($all_ids,$id);
            // $query = Documents::where('parentId',  '=', $id)->get();
            // if(!empty($query)){
            //     $data = $query->toArray();
            //     foreach($data as $row){
            //         $ids = $this->get_child_documents($row['id']);
            //         $all_ids =  array_merge($all_ids,$ids);
            //     }
            // }
        }
        return $all_ids;
    }

    public function updateCopyMovePermission($request){
        if($request['type'] == 'User'){
            $model = DocumentUserPermissions::find($request['permissionId']);
        }else{
            $model = DocumentRolePermissions::find($request['permissionId']);
        }
        if (!is_null($model)) {
            $model->isAllowCopyMove = $request['isAllow'];
            $model->save();
            return $request['permissionId'];
        }
    }
}
