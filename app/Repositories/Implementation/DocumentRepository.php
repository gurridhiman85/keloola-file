<?php

namespace App\Repositories\Implementation;

use App\Models\DocumentMetaDatas;
use App\Models\DocumentAuditTrails;
use App\Models\DocumentOperationEnum;
use App\Models\DocumentRolePermissions;
use App\Models\Documents;
use App\Models\DocumentUserPermissions;
use App\Models\UserRoles;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Repositories\Implementation\BaseRepository;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Exceptions\RepositoryException;

//use Your Model

/**
 * Class UserRepository.
 */
class DocumentRepository extends BaseRepository implements DocumentRepositoryInterface
{
    /**
     * @var Model
     */
    protected $model;

    /**
     * BaseRepository constructor..
     *
     * @param Model $model
     */


    public static function model()
    {
        return Documents::class;
    }

    public function getDocuments($attributes)
    {

        $query = Documents::select(['documents.id', 'documents.name', 'documents.url', 'documents.createdDate', 'documents.description', 'categories.id as categoryId', 'categories.name as categoryName', DB::raw("CONCAT(users.firstName,' ', users.lastName) as createdByName"), 'documents.mime_type', 'documents.parentId','documents.createdBy'])
            ->join('categories', 'documents.categoryId', '=', 'categories.id')
            ->join('users', 'documents.createdBy', '=', 'users.id');

        $orderByArray =  explode(' ', $attributes->orderBy);
        $orderBy = $orderByArray[0];
        $direction = $orderByArray[1] ?? 'asc';

        $query = $query->orderBy('documents.document_type', 'ASC');
        if ($orderBy == 'categoryName') {
            $query = $query->orderBy('categories.name', $direction);
        } else if ($orderBy == 'name') {
            $query = $query->orderBy('documents.name', $direction);
        } else if ($orderBy == 'createdDate') {
            $query = $query->orderBy('documents.createdDate', $direction);
        } else if ($orderBy == 'createdBy') {
            $query = $query->orderBy('users.firstName', $direction);
        }


        if ($attributes->categoryId) {
            $query = $query->where('categoryId', $attributes->categoryId);
        }

        if ($attributes->parentId) {
            $query = $query->where('documents.parentId', $attributes->parentId);
        }elseif($attributes->id){
            $query = $query->where('documents.id', $attributes->id);
        }else{
            $query = $query->where('documents.is_main', 1);
        }

        if (!empty($attributes->document_type) && $attributes->document_type == 'folder') {
            $query = $query->where('documents.document_type', 1);
        }

        if (!empty($attributes->exclude_document)) {
            $query = $query->where('documents.id','!=', $attributes->exclude_document);
        }

        if ($attributes->name) {
            $query = $query->where(function($subquery) use ($attributes){
                        $subquery->where('documents.name', 'like', '%' . $attributes->name . '%')
                                ->orWhere('documents.description',  'like', '%' . $attributes->name . '%');
                    });
        }

        if ($attributes->metaTags) {
            $metaTags = $attributes->metaTags;
            $query = $query->whereExists(function ($query) use ($metaTags) {
                $query->select(DB::raw(1))
                    ->from('documentMetaDatas')
                    ->whereRaw('documentMetaDatas.documentId = documents.id')
                    ->where('documentMetaDatas.metatag', 'like', '%' . $metaTags . '%');
            });
        }

        if ($attributes->createDateString) {

            $startDate = Carbon::parse($attributes->createDateString)->setTimezone('UTC');
            $endDate = Carbon::parse($attributes->createDateString)->setTimezone('UTC')->addDays(1)->addSeconds(-1);

            $query = $query->whereBetween('documents.createdDate', [$startDate, $endDate]);
        }
        if($attributes->pageSize){
            $results = $query->skip($attributes->skip)->take($attributes->pageSize)->get();
        }else{
            $results = $query->get();
        }

        return $results;
    }

    public function getDocumentsCount($attributes)
    {
        $query = Documents::query()
            ->join('categories', 'documents.categoryId', '=', 'categories.id')
            ->join('users', 'documents.createdBy', '=', 'users.id');

        if ($attributes->categoryId) {
            $query = $query->where('categoryId', $attributes->categoryId);
        }
        if (!empty($attributes->parentId)) {
            $query = $query->where('documents.parentId', $attributes->parentId);
        }else{
            $query = $query->where('documents.is_main', 1);
        }

        if (!empty($attributes->document_type) && $attributes->document_type == 'folder') {
            $query = $query->where('documents.document_type', 1);
        }

        if (!empty($attributes->exclude_document)) {
            $query = $query->where('documents.id','!=', $attributes->exclude_document);
        }
        if (!empty($attributes->from_module) && $attributes->from_module == 'assigned') {
            $query = $query->where('documents.createdBy', Auth::parseToken()->getPayload()->get('userId'));
        }

        if ($attributes->name) {
            $query = $query->where(function($subquery) use ($attributes){
                        $subquery->where('documents.name', 'like', '%' . $attributes->name . '%')
                                ->orWhere('documents.description',  'like', '%' . $attributes->name . '%');
                    });
        }

        if ($attributes->metaTags) {
            $metaTags = $attributes->metaTags;
            $query = $query->whereExists(function ($query) use ($metaTags) {
                $query->select(DB::raw(1))
                    ->from('documentMetaDatas')
                    ->whereRaw('documentMetaDatas.documentId = documents.id')
                    ->where('documentMetaDatas.metatag', 'like', '%' . $metaTags . '%');
            });
        }

        if ($attributes->createDateString) {
            $date = date('Y-m-d', strtotime(str_replace('/', '-', $attributes->createDateString)));

            $startDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
            $endDate = Carbon::createFromFormat('Y-m-d', $date)->endOfDay();

            $query = $query->whereDate('documents.createdDate', '>=', $startDate)
                ->whereDate('documents.createdDate', '<=', $endDate);
        }

        $count = $query->count();
        return $count;
    }


    public function saveDocument($request, $path)
    {
        if($request->document_type == 2){
            $model = $this->model->newInstance($request);
            $namewithextension = $request->name; //Name with extension 'filename.jpg'
            $name = explode('.', $namewithextension)[0]; // Filename 'filename'
            $extensionArray = explode('.', $namewithextension);
            $extension = end($extensionArray);

            $org_name = (isset($request->org_name) && !empty($request->org_name)) ? trim($request->org_name) : $name;
            $org_name = preg_replace('/\s\d+$/', '', $org_name);
            $model->url = $path;
            $model->org_url = (isset($request->org_url) && !empty($request->org_url)) ? trim($request->org_url) : $path;
            $model->categoryId = $request->categoryId;
            $model->name = $name;
            $model->org_name = $org_name;
            $model->description = $request->description;
            $model->parentId = (!empty($request->parentId)) ? $request->parentId : null;
            $model->is_main = $request->is_main;
            $model->mime_type = $extension;
            $model->document_type = $request->document_type;
            $metaDatas = $request->documentMetaDatas;
            $saved = $model->save();
            $this->resetModel();
            $result = $this->parseResult($model);


            foreach (json_decode($metaDatas) as $metaTag) {
                DocumentMetaDatas::create(array(
                    'documentId' =>   $result->id,
                    'metatag' =>  $metaTag->metatag,
                ));
            }

            $data = [
                'documentId' => $result->id,
                'createdDate' =>  Carbon::now(),
                'operationName' => DocumentOperationEnum::Created,
                'is_anonymous' => 0,
            ];
            $resultDocumentAuditTrails = DocumentAuditTrails::create($data);
            // return $result;
        }elseif($request->document_type == 1){
            $model = $this->model->newInstance($request);
            $model->url = trim($request->path);
            $model->org_url = trim($request->org_url);
            $model->categoryId = $request->categoryId;
            $model->name = $request->name;
            $model->org_name = $request->org_name;
            $model->description = $request->description;
            $model->parentId = (!empty($request->parentId)) ? $request->parentId : null;
            $model->is_main = $request->is_main;
            $model->mime_type = null;
            $model->document_type = $request->document_type;
            $metaDatas = $request->documentMetaDatas;
            $saved = $model->save();
            $this->resetModel();
            $result = $this->parseResult($model);

            foreach (json_decode($metaDatas) as $metaTag) {
                DocumentMetaDatas::create(array(
                    'documentId' =>   $result->id,
                    'metatag' =>  $metaTag->metatag,
                ));
            }

            $data = [
                'documentId' => $result->id,
                'createdDate' =>  Carbon::now(),
                'operationName' => DocumentOperationEnum::Created,
                'is_anonymous' => 0,
            ];
            $resultDocumentAuditTrails = DocumentAuditTrails::create($data);
        }

        if (!$saved) {
            throw new RepositoryException('Error in saving data.');
        }

        return (string)$result->id;
    }

    public function updateDocument($request, $id)
    {
        $model = $this->model->find($id);

        $model->name = $request->name;
        $model->description = $request->description;
        $model->categoryId = $request->categoryId;
        $metaDatas = $request->documentMetaDatas;
        $saved = $model->save();
        $this->resetModel();
        $result = $this->parseResult($model);

        $documentMetadatas = DocumentMetaDatas::where('documentId', '=', $id)->get('id');
        DocumentMetaDatas::destroy($documentMetadatas);

        foreach ($metaDatas as $metaTag) {
            DocumentMetaDatas::create(array(
                'documentId' =>  $id,
                'metatag' =>  $metaTag['metatag'],
            ));
        }

        if (!$saved) {
            throw new RepositoryException('Error in saving data.');
        }
        return $result;
    }

    public function assignedDocuments($attributes)
    {
        $userId = Auth::parseToken()->getPayload()->get('userId');
        $userRoles = UserRoles::select('roleId')
            ->where('userId', $userId)
            ->get();
        $query = Documents::select([
            'documents.id', 'documents.name', 'documents.url', 'documents.createdDate', 'documents.description', 'categories.id as categoryId', 'categories.name as categoryName',
            DB::raw("CONCAT(users.firstName,' ', users.lastName) as createdByName"), 'documents.mime_type', 'documents.parentId','documents.createdBy'
        ]);
        if (empty($attributes->parentId)) {
            $query = Documents::select([
                'documents.id', 'documents.name', 'documents.url', 'documents.createdDate', 'documents.description', 'categories.id as categoryId', 'categories.name as categoryName',
                DB::raw("CONCAT(users.firstName,' ', users.lastName) as createdByName"),
                DB::raw("(SELECT max(documentUserPermissions.endDate) FROM documentUserPermissions
                WHERE documentUserPermissions.documentId = documents.id and documentUserPermissions.isTimeBound =1
                GROUP BY documentUserPermissions.documentId) as maxUserPermissionEndDate"),
                DB::raw("(SELECT max(documentRolePermissions.endDate) FROM documentRolePermissions
                WHERE documentRolePermissions.documentId = documents.id and documentRolePermissions.isTimeBound =1
                GROUP BY documentRolePermissions.documentId) as maxRolePermissionEndDate"), 'documents.mime_type', 'documents.parentId','documents.createdBy'
            ]);
        }

        $query->join('categories', 'documents.categoryId', '=', 'categories.id')
            ->join('users', 'documents.createdBy', '=', 'users.id');
        if (empty($attributes->parentId)) {
            $query->where(function ($query) use ($userId, $userRoles) {
                $query->whereExists(function ($query) use ($userId) {
                    $query->select(DB::raw(1))
                        ->from('documentUserPermissions')
                        ->whereRaw('documentUserPermissions.documentId = documents.id')
                        ->where('documentUserPermissions.userId', '=', $userId)
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
        }


        $orderByArray =  explode(' ', $attributes->orderBy);
        $orderBy = $orderByArray[0];
        $direction = $orderByArray[1] ?? 'asc';

        $query = $query->orderBy('documents.document_type', 'ASC');
        if ($orderBy == 'categoryName') {
            $query = $query->orderBy('categories.name', $direction);
        } else if ($orderBy == 'name') {
            $query = $query->orderBy('documents.name', $direction);
        } else if ($orderBy == 'createdDate') {
            $query = $query->orderBy('documents.createdDate', $direction);
        } else if ($orderBy == 'createdBy') {
            $query = $query->orderBy('users.firstName', $direction);
        }

        if ($attributes->categoryId) {
            $query = $query->where('categoryId', $attributes->categoryId);
        }

        if ($attributes->parentId) {
            $query = $query->where('documents.parentId', $attributes->parentId);
        }else{
            //$query = $query->where('documents.is_main', 1);
        }

        if (!empty($attributes->document_type) && $attributes->document_type == 'folder') {
            $query = $query->where('documents.document_type', 1);
        }

        if (!empty($attributes->exclude_document)) {
            $query = $query->where('documents.id','!=', $attributes->exclude_document);
        }

        if ($attributes->name) {
            $query = $query->where(function($subquery) use ($attributes){
                        $subquery->where('documents.name', 'like', '%' . $attributes->name . '%')
                                ->orWhere('documents.description',  'like', '%' . $attributes->name . '%');
                    });
        }

        if ($attributes->metaTags) {
            $metaTags = $attributes->metaTags;
            $query = $query->whereExists(function ($query) use ($metaTags) {
                $query->select(DB::raw(1))
                    ->from('documentMetaDatas')
                    ->whereRaw('documentMetaDatas.documentId = documents.id')
                    ->where('documentMetaDatas.metatag', 'like', '%' . $metaTags . '%');
            });
        }

        $results = $query->skip($attributes->skip)->take($attributes->pageSize)->get();
        //
        if(!empty($results)){
            $results_new = [];
            foreach($results as $result){
                $is_download = $this->getIsDownloadFlag($result['id']);
                $is_copy_move = $this->getIsMoveCopyFlag($result['id']);
                $result['is_download'] =  $is_download;
                $result['is_copy_move'] =  $is_copy_move;
                $results_new[] = $result;
            }
            return $results_new;
        }else{
            return $results;
        }
    }

    public function assignedDocumentsCount($attributes)
    {
        $userId = Auth::parseToken()->getPayload()->get('userId');
        $userRoles = UserRoles::select('roleId')
            ->where('userId', $userId)
            ->get();


        $query = Documents::query()
            ->join('categories', 'documents.categoryId', '=', 'categories.id')
            ->join('users', 'documents.createdBy', '=', 'users.id');
            if (empty($attributes->parentId)) {
                $query->where(function ($query) use ($userId, $userRoles) {
                $query->whereExists(function ($query) use ($userId) {
                    $query->select(DB::raw(1))
                        ->from('documentUserPermissions')
                        ->whereRaw('documentUserPermissions.documentId = documents.id')
                        ->where('documentUserPermissions.userId', '=', $userId)
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
            }

        if ($attributes->categoryId) {
            $query = $query->where('categoryId', $attributes->categoryId);
        }

        if ($attributes->parentId) {
            $query = $query->where('documents.parentId', $attributes->parentId);
        }

        if (!empty($attributes->document_type) && $attributes->document_type == 'folder') {
            $query = $query->where('documents.document_type', 1);
        }

        if (!empty($attributes->exclude_document)) {
            $query = $query->where('documents.id','!=', $attributes->exclude_document);
        }

        if ($attributes->name) {
            $query = $query->where(function($subquery) use ($attributes){
                        $subquery->where('documents.name', 'like', '%' . $attributes->name . '%')
                                ->orWhere('documents.description',  'like', '%' . $attributes->name . '%');
                    });
        }

        if ($attributes->metaTags) {
            $metaTags = $attributes->metaTags;
            $query = $query->whereExists(function ($query) use ($metaTags) {
                $query->select(DB::raw(1))
                    ->from('documentMetaDatas')
                    ->whereRaw('documentMetaDatas.documentId = documents.id')
                    ->where('documentMetaDatas.metatag', 'like', '%' . $metaTags . '%');
            });
        }

        $count = $query->count();
        return $count;
    }

    public function getIsDownloadFlag($id)
    {
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
        //dd($checkAssign);
        return $count + $checkAssign > 0 ? true : false;
    }

    public function getIsMoveCopyFlag($id)
    {
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
                        ->where('documentUserPermissions.isAllowCopyMove', '=', true)
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
                        ->where('documentRolePermissions.isAllowCopyMove', '=', true)
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

            if(!empty($parent_documents_array)){
                $checkAssignDataUser = DocumentUserPermissions::where('userId',$userId)->where('isAllowCopyMove', '=', true)->whereIn('documentId',$parent_documents_array)->get();
                if(!empty($checkAssignDataUser) && count($checkAssignDataUser) > 0 ){
                    $checkAssign = 1;
                }
                $checkAssignDataRole = DocumentRolePermissions::whereIn('roleId', $userRoles)->where('isAllowCopyMove', '=', true)->whereIn('documentId',$parent_documents_array)->get();
                if(!empty($checkAssignDataRole) && count($checkAssignDataRole) > 0 ){
                    $checkAssign = 1;
                }
            }
        }
        //dd($checkAssign);
        return $count + $checkAssign > 0 ? true : false;
    }

    public function getDocumentByCategory()
    {
        $userId = Auth::parseToken()->getPayload()->get('userId');
        $userRoles = UserRoles::select('roleId')
            ->where('userId', $userId)
            ->get();

        $query = Documents::select(['documents.categoryId', 'categories.name as categoryName',  DB::raw('count(*) as documentCount')])
            ->join('categories', 'documents.categoryId', '=', 'categories.id')
            ->join('users', 'documents.createdBy', '=', 'users.id')
            ->where(function ($query) use ($userId, $userRoles) {
                $query->whereExists(function ($query) use ($userId) {
                    $query->select(DB::raw(1))
                        ->from('documentUserPermissions')
                        ->whereRaw('documentUserPermissions.documentId = documents.id')
                        ->where('documentUserPermissions.userId', '=', $userId)
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

        $results =  $query->groupBy('documents.categoryId', 'categories.name')->get();

        return $results;
    }

    public function addDocumentToMe($request, $path)
    {
        //$idArray = [];
        if($request->document_type == 2){
            //foreach($request->file('uploadFile') as $key => $upload_file){
                $model = $this->model->newInstance($request);
                $namewithextension = $request->name; //Name with extension 'filename.jpg'
                $name = explode('.', $namewithextension)[0]; // Filename 'filename'
                $extension = explode('.', $namewithextension)[1];

                $model->url = $path;
                $model->categoryId = $request->categoryId;
                $model->name = $name;
                $model->description = $request->description;
                $model->parentId = (!empty($request->parentId)) ? $request->parentId : null;
                $model->is_main = $request->is_main;
                $model->mime_type = $extension;
                $model->document_type = $request->document_type;
                $metaDatas = $request->documentMetaDatas;
                $saved = $model->save();

                $this->resetModel();
                $result = $this->parseResult($model);
                //$idArray[] = $result->id->toString();

                $data = [
                    'documentId' => $result->id,
                    'createdDate' =>  Carbon::now(),
                    'operationName' => DocumentOperationEnum::Created,
                    'is_anonymous' => 0,
                ];
                $resultDocumentAuditTrails = DocumentAuditTrails::create($data);

                foreach (json_decode($metaDatas) as $metaTag) {
                    DocumentMetaDatas::create(array(
                        'documentId' =>   $result->id,
                        'metatag' =>  $metaTag->metatag,
                    ));
                }

                $parent_documents_array = [];
                if(!empty($request->parentId)){
                    $parent_documents_array = $this->create_all_parent_array($request->parentId);
                }

                $userId = Auth::parseToken()->getPayload()->get('userId');
                $checkAssign = false;
                if(!empty($parent_documents_array)){
                    $checkAssignData = DocumentUserPermissions::where('userId',$userId)->whereIn('documentId',$parent_documents_array)->get();
                    if(!empty($checkAssignData)){
                        $checkAssign = true;
                    }
                }
                if(!$checkAssign){
                    $newPermission = DocumentUserPermissions::create([
                        'documentId' =>   $result->id,
                        'isTimeBound' => false,
                        'isAllowDownload' => true,
                        'userId' => $userId,
                        'createdBy' => $userId,
                        'createdDate' => Carbon::now(),
                    ]);
                    $saved = $newPermission->save();
                }

                $documentAudit = DocumentAuditTrails::create([
                    'documentId' =>   $result->id,
                    'createdBy' => $userId,
                    'createdDate' => Carbon::now(),
                    'operationName' => DocumentOperationEnum::Add_Permission,
                    'assignToUserId' => $userId
                ]);

                $documentAudit->save();

                if (!$result) {
                    throw new RepositoryException('Error in saving data.');
                }
            //}
        }elseif($request->document_type == 1){
            $model = $this->model->newInstance($request);

            $model->url = $request->path;
            $model->categoryId = $request->categoryId;
            $model->name = $request->name;
            $model->org_name = $request->org_name;
            $model->description = $request->description;
            $model->parentId = (!empty($request->parentId)) ? $request->parentId : null;
            $model->is_main = $request->is_main;
            $model->mime_type = null;
            $model->document_type = $request->document_type;
            $metaDatas = $request->documentMetaDatas;
            $saved = $model->save();
            $this->resetModel();
            $result = $this->parseResult($model);
            //$idArray[] = $result->id->toString();

            foreach (json_decode($metaDatas) as $metaTag) {
                DocumentMetaDatas::create(array(
                    'documentId' =>   $result->id,
                    'metatag' =>  $metaTag->metatag,
                ));
            }

            $parent_documents_array = [];
            if(!empty($request->parentId)){
                $parent_documents_array = $this->create_all_parent_array($request->parentId);
            }

            $userId = Auth::parseToken()->getPayload()->get('userId');
            $checkAssign = false;
            if(!empty($parent_documents_array)){
                $checkAssignData = DocumentUserPermissions::where('userId',$userId)->whereIn('documentId',$parent_documents_array)->get();
                if(!empty($checkAssignData)){
                    $checkAssign = true;
                }
            }
            if(!$checkAssign){
                $newPermission = DocumentUserPermissions::create([
                    'documentId' =>   $result->id,
                    'isTimeBound' => false,
                    'isAllowDownload' => true,
                    'userId' => $userId,
                    'createdBy' => $userId,
                    'createdDate' => Carbon::now(),
                ]);
                $saved = $newPermission->save();
            }

            $documentAudit = DocumentAuditTrails::create([
                'documentId' =>   $result->id,
                'createdBy' => $userId,
                'createdDate' => Carbon::now(),
                'operationName' => DocumentOperationEnum::Add_Permission,
                'assignToUserId' => $userId
            ]);

            $documentAudit->save();

            if (!$result) {
                throw new RepositoryException('Error in saving data.');
            }
        }

        return (string)$result->id;
        // $result->idArray = $idArray;
        // return  $result;
    }

    public function getDocumentbyId($id,$type=null)
    {
        if($type != 'link-document'){
            $userId = Auth::parseToken()->getPayload()->get('userId');
            $userRoles = UserRoles::select('roleId')
            ->where('userId', $userId)
            ->get();
        }

        $query = Documents::select(['documents.*']);

            if(!empty($type)){
                $query->where('documents.id',  '=', $id);
            }else{
                $query->where('documents.id',  '=', $id)
                ->where(function ($query) use ($userId, $userRoles, $id) {
                    $query->whereExists(function ($query) use ($userId, $id) {
                        $query->select(DB::raw(1))
                            ->from('documentUserPermissions')
                            ->where('documentUserPermissions.documentId', '=', $id)
                            ->where('documentUserPermissions.userId', '=', $userId)
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
                    })->orWhereExists(function ($query) use ($userRoles, $id) {
                        $query->select(DB::raw(1))
                            ->from('documentRolePermissions')
                            ->where('documentRolePermissions.documentId', '=', $id)
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
            }


        $document = $query->first();

        if ($document == null) {
            return null;
        }
        if($type == 'link-document'){
            return $document;
        }else{
            $docUserPermissionQuery = DocumentUserPermissions::where('documentUserPermissions.documentId',  '=', $id)
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

            $userPermissionCount = $docUserPermissionQuery->count();
            if ($userPermissionCount > 0) {
                $document['isAllowDownload'] = true;
                return $document;
            }

            $docRolePermissionQuery = DocumentRolePermissions::where('documentRolePermissions.documentId',  '=', $id)
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

            $rolePermissionCount = $docRolePermissionQuery->count();
            if ($rolePermissionCount > 0) {
                $document['isAllowDownload'] = true;
                return $document;
            } else {
                $document['isAllowDownload'] = false;
                return $document;
            }
        }

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

    public function create_all_child_array($id = null){
        $array = [];

        if(!empty($id)){
            $query = Documents::where('parentId',$id)->get();
            if(!empty($query)){
                foreach($query->toArray() as $data){
                    if(!empty($data)){
                        $array[] = $data;
                        $result = $this->create_all_child_array($data['id']);
                        $array = array_merge($array,$result);
                    }
                }
            }
        }
        return $array;
    }

}
