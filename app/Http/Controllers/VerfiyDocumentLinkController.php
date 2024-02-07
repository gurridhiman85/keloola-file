<?php

namespace App\Http\Controllers;

use App\Http\Dto\DocumentResource;
use Illuminate\Http\Request;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Models\Documents;
use App\Models\DocumentVersions;
use App\Models\Categories;
use App\Models\Roles;
// use App\Models\Categories;
// use App\Models\Categories;
use App\Repositories\Contracts\DocumentMetaDataRepositoryInterface;
use App\Repositories\Contracts\DocumentTokenRepositoryInterface;
use App\Repositories\Contracts\UserNotificationRepositoryInterface;
use App\Repositories\Contracts\VerifyDocumentLinkInterface;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Ramsey\Uuid\Uuid;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
//use PHPOpenSourceSaver\JWTAuth;
use Illuminate\Http\Response;
use App\Models\VerifyDocumentLinks;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use App\Models\DocumentAuditTrails;
use Carbon\Carbon;

class VerfiyDocumentLinkController extends Controller
{
    private $documentRepository;
    private  $documentMetaDataRepository;
    private $documenTokenRepository;
    private $userNotificationRepository;
    protected $queryString;
    private $user_id;
    private $category;
    private $db_files;
    private $files_folder_count;
    private $verifydocumentlinkRepository;

    public function __construct(
        DocumentRepositoryInterface $documentRepository,
        DocumentMetaDataRepositoryInterface $documentMetaDataRepository,
        UserNotificationRepositoryInterface $userNotificationRepository,
        DocumentTokenRepositoryInterface $documenTokenRepository,
        VerifyDocumentLinkInterface $verifydocumentlinkRepository
    ) {
        $this->documentRepository = $documentRepository;
        $this->documentMetaDataRepository = $documentMetaDataRepository;
        $this->userNotificationRepository = $userNotificationRepository;
        $this->documenTokenRepository = $documenTokenRepository;
        $this->verifydocumentlinkRepository = $verifydocumentlinkRepository;
    }

    // public function getFileFolderLinkDetails($id){
    //     $userId = Auth::parseToken()->getPayload()->get('userId');
    //     $model = VerifyDocumentLinks::where([['documentId', '=', $id], ['createdBy', '=', $userId]])->first();

    //     $verify_link = '';

    //     if (!is_null($model)) {
    //         $id = $model->id;
    //         $encrypted_id = Crypt::encryptString($id);
    //         //$base_url = url()->to('/');
    //         /**need to remove this while live */
    //         $base_url = 'http://localhost:4200';
    //         $verify_link = $base_url.'/verify-password/'.$encrypted_id;
    //     }else{
    //         $data = [
    //             "documentId" => $id,
    //         ];
    //         $linkid = $this->verifydocumentlinkRepository->saveVerifyDocumentLink($data);

    //         $encrypted_id = Crypt::encryptString($linkid);
    //         //$base_url = url()->to('/');
    //         /**need to remove this while live */
    //         $base_url = 'http://localhost:4200';
    //         $verify_link = $base_url.'/verify-password/'.$encrypted_id;

    //         $data = [
    //             "documentId" => $id,
    //             "link" => $verify_link,
    //             "createdBy" => $userId,
    //         ];

    //         $this->verifydocumentlinkRepository->updateVerifyDocumentLink($data);
    //     }
    //     return response()->json(array('link' => $verify_link));

    // }

    // public function save_document_link_details(Request $request){
    //     //dd($request->all());
    //     $userId = Auth::parseToken()->getPayload()->get('userId');
    //     $model = VerifyDocumentLinks::where([['documentId', '=', $request->documentId], ['createdBy', '=', $userId]])->first();

    //     // $data = [
    //     //     "documentId" => $request->documentId,
    //     //     "startDate" => $verify_link,
    //     //     "createdBy" => $userId,
    //     // ];
    //     $request->request->add(['createdBy' => $userId]);
    //     if (!is_null($model)) {
    //         $this->verifydocumentlinkRepository->updateVerifyDocumentLink($request->all());
    //         return response(200);
    //     }else{
    //         return response(403);
    //     }
    // }

    public function verify_document_password(Request $request){
        $verify_id = Crypt::decryptString($request->verifyId);
        $password = $request->password;

        $verification_details = VerifyDocumentLinks::where('id',$verify_id)->first();

        if(!empty($verification_details)){
            if (Crypt::decryptString($verification_details->password) === $password) {
                $documentId = $verification_details->documentId;
                $documentDetails = Documents::where('id',$documentId)->first();
                if($documentDetails){
                    $filePath = storage_path('app/',$documentDetails->url);
                    if (file_exists($filePath)) {
                        return response()->json([
                            'status' => 'success',
                            'message' => 'File is now downloading.',
                            'id' => $documentId,
                            'sharedBy' => $verification_details->createdBy,
                            'documentInfo' => $documentDetails
                        ], 200);
                    } else {
                        return response()->json([
                            'status' => 'Error',
                            'message' => 'File not found.',
                        ], 404);
                    }
                } else {
                    return response()->json([
                        'status' => 'Error',
                        'message' => 'File not found.',
                    ], 404);
                }
            }else{
                return response()->json([
                    'status' => 'Error',
                    'message' => 'Incorrect Password.',
                ], 422);
            }
        }
    }

    public function getDocuments(Request $request)
    {
        if(!empty($request->input('parentId')) || !empty($request->input('id'))){
            $this->queryString = new DocumentResource();

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
            if ($request->has('categoryId')) {
                $this->queryString->categoryId = $request->input('categoryId');
            }
            if ($request->has('name')) {
                $this->queryString->name = $request->input('name');
            }
            if ($request->has('metaTags')) {
                $this->queryString->metaTags = $request->input('metaTags');
            }
            if ($request->has('id')) {
                $this->queryString->id = $request->input('id');
            }
            if ($request->has('parentId')) {
                $this->queryString->parentId = $request->input('parentId');
            }
            $count = $this->documentRepository->getDocumentsCount($this->queryString);
            return response()->json($this->documentRepository->getDocuments($this->queryString))
                ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
        }else{
            return response()->json([
                'status' => 'Error',
                'message' => 'Something went wrong.',
            ], 422);
        }

    }
    public function getDocumentbyId($id,$type=null)
    {
        return response()->json($this->documentRepository->getDocumentbyId($id,$type));
    }

    public function getverfiylinkDetailsById($id){
        if(!empty($id)){
            $verify_id = Crypt::decryptString($id);
            $model = VerifyDocumentLinks::where('id', $verify_id)->first();
            //dd($model);
            return response()->json($model);
        }else{
            return response()->json([
                'status' => 'Error',
                'message' => 'Something went wrong.',
            ], 422);
        }

    }

    public function documentAuditTrailAnonymous(Request $request){
        $uuid = Uuid::uuid4()->toString(); // Generate a UUID
        $data = [
            'id' => $uuid,
            'documentId' => $request->documentId,
            'createdDate' =>  Carbon::now(),
            'operationName' => $request->operationName,
            'is_anonymous' => (!empty($request->is_anonymous)) ? $request->is_anonymous : 0,
            'createdBy' => (!empty($request->createdBy)) ? $request->createdBy : null
        ];
        $result = DocumentAuditTrails::insert($data);
    }
}
