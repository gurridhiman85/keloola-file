<?php

namespace App\Http\Controllers;

use App\Http\Dto\DocumentResource;
use Illuminate\Http\Request;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Models\Documents;
use App\Models\DocumentVersions;
use App\Models\Categories;
use App\Models\Roles;
use App\Models\DocumentRolePermissions;
use App\Models\DocumentUserPermissions;
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
use Illuminate\Support\Facades\Crypt;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Symfony\Component\Process\Process;
use App\Repositories\Contracts\DocumentPermissionRepositoryInterface;
use App\Models\UserRoles;
//use ReflectionObject;
class DocumentController extends Controller
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
        VerifyDocumentLinkInterface $verifydocumentlinkRepository,
        DocumentPermissionRepositoryInterface $documentPermissionRepository,

    ) {
        $this->documentRepository = $documentRepository;
        $this->documentMetaDataRepository = $documentMetaDataRepository;
        $this->userNotificationRepository = $userNotificationRepository;
        $this->documenTokenRepository = $documenTokenRepository;
        $this->verifydocumentlinkRepository = $verifydocumentlinkRepository;
        $this->documentPermissionRepository = $documentPermissionRepository;
    }

    public function getDocuments(Request $request)
    {
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
        if ($request->has('document_type')) {
            $this->queryString->document_type = $request->input('document_type');
        }
        if ($request->has('exclude_document')) {
            $this->queryString->exclude_document = $request->input('exclude_document');
        }
        // if ($request->has('from_module')) {
        //     $this->queryString->from_module = $request->input('from_module');
        // }

        $count = $this->documentRepository->getDocumentsCount($this->queryString);
        return response()->json($this->documentRepository->getDocuments($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
    }

    public function officeviewer(Request $request, $id)
    {
        $isTokenAvailable = $this->documenTokenRepository->getDocumentPathByToken($id, $request);

        if ($isTokenAvailable == false) {
            return response()->json([
                'message' => 'Document Not Found.',
            ], 404);
        }
        return $this->downloadDocument($id, $request->input('isVersion'));
    }


    public function downloadDocument($id, $isVersion, $sharedBy = null)
    {
        $bool = filter_var($isVersion, FILTER_VALIDATE_BOOLEAN);
        if ($bool == true) {
            $file = DocumentVersions::findOrFail($id);
        } else {
            $file = Documents::findOrFail($id);
        }

        $fileupload = $file->url;
        $fileExtension = explode('.', $file->url);

        $fileSize = Storage::disk('local')->size($fileupload); // Get file size in bytes
        $maxFileSize = 10 * 1024 * 1024; // 10 MB in bytes
        $url = Storage::disk('local')->url($fileupload);
        //dd($url);

        if ($fileSize > $maxFileSize) {
            if (Storage::disk('local')->exists($fileupload)) {
                $fileType = Storage::mimeType($fileupload);

                $fileExtension = pathinfo($fileupload, PATHINFO_EXTENSION);
                $response = new StreamedResponse(function () use ($fileupload) {
                    $fileStream = Storage::disk('local')->readStream($fileupload);
                    while (!feof($fileStream) && connection_status() === CONNECTION_NORMAL) {
                        echo fread($fileStream, 8192); // Adjust buffer size as needed
                        flush();
                    }
                    fclose($fileStream);
                });

                $response->headers->set('Content-Type', $fileType);
                $response->headers->set('Content-Disposition', 'attachment; filename="' . $file->name . '.' . $fileExtension . '"');

                return $response;
            }
        }

        else {
            // Small file - use the old method
            if (Storage::disk('local')->exists($fileupload)) {
                $file_contents = Storage::disk('local')->get($fileupload);
                $fileType = Storage::mimeType($fileupload);

                return response($file_contents)
                    ->header('Cache-Control', 'no-cache private')
                    ->header('Content-Description', 'File Transfer')
                    ->header('Content-Type', $fileType)
                    ->header('Content-length', strlen($file_contents))
                    ->header('Content-Disposition', 'attachment; filename=' . $file->name . '.' . pathinfo($fileupload, PATHINFO_EXTENSION))
                    ->header('Content-Transfer-Encoding', 'binary');
            }
        }
    }

    public function newDownload($id, $downloadType = null, $isVersion = false){
        set_time_limit(0); // Set to 0 for no time limit
        if($downloadType == 'multiple'){
            $ids = json_decode($id);
            if(!empty($ids)){

                $duplicateFolderName = 'batch_download'.time();
                $duplicateDirectory = public_path('documents_copy/'.$duplicateFolderName);

                if (!File::exists($duplicateDirectory)) {
                    File::makeDirectory($duplicateDirectory, 0777, true);
                }
                /**Copy all the files/folder to the public directory starts */
                foreach ($ids as $id) {
                    $mainDocumentDetails = Documents::findOrFail($id);
                    $mainDocumentDetails_url = explode("/",$mainDocumentDetails->url);
                    $mainFileName = end($mainDocumentDetails_url);
                    array_pop($mainDocumentDetails_url);
                    //$mainFileName = $mainDocumentDetails->name . ($mainDocumentDetails->mime_type != null ? '.' . $mainDocumentDetails->mime_type : '');

                    $mainFileLocalPath = storage_path("app/".implode('/',$mainDocumentDetails_url));
                    $destinationFilePath = "{$duplicateDirectory}";

                    File::link($mainFileLocalPath.'/'."{$mainFileName}", $destinationFilePath.'/'."{$mainFileName}");
                }
                /**Copy all the files/folder to the public directory end */

                /**Create Zip of new folder generated starts*/
                $folder_name = $duplicateFolderName;
                $document_local_path = escapeshellarg(public_path('documents_copy'));

                // $this->generate_zip_and_download($folder_name, $document_local_path, $duplicateDirectory);
                $saveTosDirectoryPath = public_path('documents_zip');

                if (!File::exists($saveTosDirectoryPath)) {
                    File::makeDirectory($saveTosDirectoryPath, 0755, true);
                }

                $zipFileNameDownload = $folder_name.'.zip';
                $zipFileNameSave = time().' '.$zipFileNameDownload;

                $zipOrgFilePath = $saveTosDirectoryPath.'/'.$zipFileNameSave;
                $zipFilePath = escapeshellarg($saveTosDirectoryPath.'/'.$zipFileNameSave);

                $command = "cd " . $document_local_path . " && zip -r $zipFilePath '$folder_name'";

                $output = shell_exec($command);

                if ($output === null) {
                    abort(404, 'Failed to generate ZIP file.');
                }else{
                    if (File::exists($zipOrgFilePath)) {
                        $headers = [
                            'Content-Type' => 'application/zip',
                        ];
                        File::deleteDirectory($duplicateDirectory);
                        return response()->download($zipOrgFilePath, $zipFileNameDownload, $headers)->deleteFileAfterSend(true);

                    } else {
                        abort(404, 'File not found');
                    }
                }
            }
        }else{
            $bool = filter_var($isVersion, FILTER_VALIDATE_BOOLEAN);
            if ($bool == true) {
                $documentDetails = DocumentVersions::findOrFail($id);
            } else {
                $documentDetails = Documents::findOrFail($id);
            }

            $fileupload = $documentDetails->url;
            if(!empty($documentDetails->mime_type)){
                if (Storage::disk('local')->exists($fileupload)) {
                    $filePath = Storage::disk('local')->path($fileupload);
                    $headers = [
                        'Content-Type' => 'application/illustrator',
                    ];

                    return response()->download($filePath, $documentDetails->name.'.'.$documentDetails->mime_type,$headers);
                } else {
                    abort(404, 'File not found');
                }
            }else{
                if(!empty($documentDetails->url)){
                    $document_path_array = explode("/",$documentDetails->url);
                    array_pop($document_path_array);
                    $folder_name = $documentDetails->name;
                    $document_local_path = escapeshellarg(storage_path('app/'.implode('/',$document_path_array)));
                    //$this->generate_zip_and_download($folder_name,$document_local_path);

                    $saveTosDirectoryPath = public_path('documents_zip');

                    if (!File::exists($saveTosDirectoryPath)) {
                        File::makeDirectory($saveTosDirectoryPath, 0755, true);
                    }

                    $zipFileNameDownload = $folder_name.'.zip';
                    $zipFileNameSave = time().' '.$zipFileNameDownload;

                    $zipOrgFilePath = $saveTosDirectoryPath.'/'.$zipFileNameSave;
                    $zipFilePath = escapeshellarg($saveTosDirectoryPath.'/'.$zipFileNameSave);

                    $command = "cd " . $document_local_path . " && zip -r $zipFilePath '$folder_name'";

                    $output = shell_exec($command);
                    if ($output === null) {
                        abort(404, 'Failed to generate ZIP file.');
                    }else{
                        if (File::exists($zipOrgFilePath)) {
                            $headers = [
                                'Content-Type' => 'application/zip',
                            ];
                            return response()->download($zipOrgFilePath, $zipFileNameDownload, $headers)->deleteFileAfterSend(true);

                        } else {
                            abort(404, 'File not found');
                        }
                    }
                }else{
                    abort(404, 'File not found');
                }
            }
        }
    }

    public function readTextDocument($id, $isVersion)
    {
        $bool = filter_var($isVersion, FILTER_VALIDATE_BOOLEAN);
        if ($bool == true) {
            $file = DocumentVersions::findOrFail($id);
        } else {
            $file = Documents::findOrFail($id);
        }

        $fileupload = $file->url;

        if (Storage::disk('local')->exists($fileupload)) {
            $file_contents = Storage::disk('local')->get($fileupload);
            $response = ["result" => [$file_contents]];
            return response($response);
        }
    }

    public function fileUpload()
    {
        return view('fileUpload');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */

    public function uploadChunks(Request $request)
    {
        $file = $request->file('file');
        $chunkNumber = $request->input('chunkNumber');
        $totalChunks = $request->input('totalChunks');
        $filename = $request->input('filename');

        $chunkDirectory = 'temp/' . $filename . '_chunks';

        if (!$file->isValid()) {
            return response()->json(['message' => 'Invalid file'], 400);
        }

        // Create a directory for storing chunks if it doesn't exist
        Storage::disk('local')->makeDirectory($chunkDirectory);

        // Store the uploaded chunk
        $file->storeAs($chunkDirectory, $filename . '_chunk_' . $chunkNumber);

        // Check if all chunks have been uploaded
        if ($chunkNumber == $totalChunks) {
            if($request->upload_type == 'all'){
                $response = $this->saveDocument($filename, $totalChunks, $chunkDirectory,$request);
                if(isset($response['message'])){
                    return response()->json(['message' => $response['message']], 412);
                }
            }else{
                $response = $this->addDocumentToMe($filename, $totalChunks, $chunkDirectory,$request);
                if(isset($response['message'])){
                    return response()->json(['message' => $response['message']], 412);
                }
            }

            //return response()->json(['message' => 'All chunks uploaded']);
            $response = new StreamedResponse(function () {
                echo json_encode(['type' => 'UploadProgress', 'loaded' => 100]);
                ob_flush();
                flush();
            });

            return $response;
        }

        // return response()->json(['message' => 'Chunk uploaded']);
        // Emit progress event to the client
        $percentDone = round(($chunkNumber / $totalChunks) * 100);
        $response = new StreamedResponse(function () use ($percentDone) {
            echo json_encode(['type' => 'UploadProgress', 'loaded' => $percentDone]);
            ob_flush();
            flush();
        });

        return $response;
    }

    private function saveDocument($filename, $totalChunks, $chunkDirectory,$request)
    {
        //this flow will run in case of folder upload only
        $parentId = $request->parentId;
        if(!empty($request->localPath)){
            $folders_array = explode('/',$request->localPath);
            array_pop($folders_array);
            foreach($folders_array as $key => $folderName){
                $requestData = [
                    'documentId' => $parentId,
                    'type' => 'main',
                    'folderName' => ($key == 0 ? $request->mainFolder : $folderName),
                    'orgName' => $folderName,
                    'by_folder_upload' => true
                ];
                $response = $this->createFolder(new \Illuminate\Http\Request($requestData));
                $details = json_decode($response->getContent());
                if(!isset($details->message)){
                    $parentId = $details;
                    $request->request->add(['parentId' => $parentId]);
                }else{
                    $errors['message'] = $details->message;
                    return $errors;
                    die;
                }
            }
        }

        $category_details = Categories::where('name','Uncategorized')->first();
        if(!empty($category_details)){
            $request->merge(['categoryId' => $category_details->id]);
        }

        $filepath = 'documents';
        $is_main = 1;
        if($parentId  && $parentId != 'null' && $parentId != "undefined" ){
            $details = $this->getDocumentbyId($parentId,'without_assigned');
            $details = json_decode($details->getContent(), true);
            $filepath = $details['url'];
            $is_main = 0;
        }

        $namewithextension = $filename; //Name with extension 'filename.jpg'
        $namewithextensionArray = explode('.', $namewithextension);
        $extension = end($namewithextensionArray);
        $completeFilePath = $filepath . '/' . Uuid::uuid4() . '.' . $extension;

        $completeFile = fopen(storage_path('app/' . $completeFilePath), 'ab');

        for ($i = 1; $i <= $totalChunks; $i++) {
            $chunkPath = storage_path('app/' . $chunkDirectory . '/' . $filename . '_chunk_' . $i);
            $chunkContent = file_get_contents($chunkPath);
            fwrite($completeFile, $chunkContent);
            unlink($chunkPath); // Remove chunk after merging
        }

        fclose($completeFile);
        Storage::disk('local')->deleteDirectory($chunkDirectory); // Delete chunk directory


        $request->request->add(['is_main' => $is_main, 'document_type' => 2, 'name' => $filename]);
        $this->documentRepository->saveDocument($request, $completeFilePath);
    }

    public function updateDocument(Request $request, $id)
    {
        $model = Documents::where([['name', '=', $request->name], ['id', '<>', $id]])->first();

        if (!is_null($model)) {
            return response()->json([
                'message' => 'Document already exist.',
            ], 409);
        }
        return  response()->json($this->documentRepository->updateDocument($request, $id), 200);
    }

    public function deleteDocument($id)
    {
        $details = Documents::find($id);
        $userId = Auth::parseToken()->getPayload()->get('userId');
        if($userId !== $details['createdBy']){
            $errors['message'] = 'This document is owned by other';
            return response()->json($errors, 409);
        }

        $path = $details['url'];
        if (Storage::exists($path)) {
            if($details['document_type'] == 1){
                Storage::deleteDirectory($path);
            }else{
                Storage::delete($path);
            }
        }
        return response($this->documentRepository->delete($id), 204);
    }

    public function getDocumentMetatags($id)
    {
        return  response($this->documentMetaDataRepository->getDocumentMetadatas($id), 200);
    }

    public function assignedDocuments(Request $request)
    {
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
        if ($request->has('parentId')) {
            $this->queryString->parentId = $request->input('parentId');
        }
        if ($request->has('document_type')) {
            $this->queryString->document_type = $request->input('document_type');
        }
        if ($request->has('exclude_document')) {
            $this->queryString->exclude_document = $request->input('exclude_document');
        }
        $count = $this->documentRepository->assignedDocumentsCount($this->queryString);
        return response()->json($this->documentRepository->assignedDocuments($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
    }

    public function getDocumentsByCategoryQuery()
    {
        return response()->json($this->documentRepository->getDocumentByCategory());
    }

    public function addDocumentToMe($filename, $totalChunks, $chunkDirectory,$request)
    {
        //this flow will run in case of folder upload only
        $parentId = $request->parentId;
        if(!empty($request->localPath)){
            $folders_array = explode('/',$request->localPath);
            array_pop($folders_array);
            // $count = 0;
            foreach($folders_array as $key => $folderName){
                $requestData = [
                    'documentId' => $parentId,
                    'type' => 'main',
                    'folderName' => ($key == 0 ? $request->mainFolder : $folderName),
                    'orgName' => $folderName,
                    'by_folder_upload' => true
                ];
                $response = $this->createFolder(new \Illuminate\Http\Request($requestData));
                $details = json_decode($response->getContent());

                if(!isset($details->message)){
                    $parentId = $details;
                    $request->request->add(['parentId' => $parentId]);
                }else{
                    $errors['message'] = $details->message;
                    return $errors;
                    die;
                }
                // $count++;
            }
        }

        $category_details = Categories::where('name','Uncategorized')->first();
        if(!empty($category_details)){
            $request->merge(['categoryId' => $category_details->id]);
        }

        $filepath = 'documents';
        $is_main = 1;
        if(!empty($parentId)  && $parentId != 'null' && $parentId != "undefined" ){
            $details = Documents::find($request->parentId);
            $filepath = $details['url'];
            $is_main = 0;
        }
        $namewithextension = $filename; //Name with extension 'filename.jpg'
        $extensionArray = explode('.', $namewithextension);
        $extension = end($extensionArray);
        $completeFilePath = $filepath . '/' . Uuid::uuid4() . '.' . $extension;

        $completeFile = fopen(storage_path('app/' . $completeFilePath), 'ab');

        for ($i = 1; $i <= $totalChunks; $i++) {
            $chunkPath = storage_path('app/' . $chunkDirectory . '/' . $filename . '_chunk_' . $i);
            $chunkContent = file_get_contents($chunkPath);
            fwrite($completeFile, $chunkContent);
            unlink($chunkPath); // Remove chunk after merging
        }

        fclose($completeFile);
        Storage::disk('local')->deleteDirectory($chunkDirectory); // Delete chunk directory


        $request->request->add(['is_main' => $is_main, 'document_type' => 2, 'name' => $filename]);
        $this->documentRepository->addDocumentToMe($request, $completeFilePath);
    }

    public function getDocumentbyId($id,$type=null)
    {
        $this->userNotificationRepository->markAsReadByDocumentId($id);
        return response()->json($this->documentRepository->getDocumentbyId($id,$type));
    }

    public function createFolder(Request $request){
        $parentId = null;
        $is_main = 1;
        $errors = [];
        if(!empty($request->documentId) && $request->documentId != 'null' && $request->documentId != "undefined"){
            $parentId = $request->documentId;
            $details = Documents::find($request->documentId);
            $dirPath = $details['url'];
            $path = $dirPath.'/'.$request->folderName;

            $is_main = 0;
        }else{
            $dirPath = 'documents';
            $path = $dirPath .'/'.$request->folderName;
        }
        if (!Storage::exists($path)) {
            if(!Storage::makeDirectory($path)){
                $errors['message'] = 'Unable to create folder';
            }
        }else{
            if(isset($request->by_folder_upload) && $request->by_folder_upload){
                $folderData = Documents::where([['name', '=', $request->folderName], ['url', '=', $path]])->first();
                return response()->json($folderData->id);
            }
            $errors['message'] = 'This folder name is already inside this directory';
        }

        if(!empty($errors)){
            return response()->json($errors, 409);
            die;
        }
        $category = Categories::where('name', 'Uncategorized')->first();
        $folderOrgName = (isset($request->by_folder_upload)? $request->orgName : $request->folderName);
        $folderOrgName = preg_replace('/\s\d+$/', '', $folderOrgName);
        $request = new Request([
            'path'   => $path,
            'org_url'   => $dirPath.'/'.$folderOrgName,
            'categoryId' => $category->id,
            'name' => $request->folderName,
            'org_name' => $folderOrgName,
            'description' => null,
            'documentMetaDatas' => '[]',
            'mime_type' => null,
            'parentId' => $parentId,
            'is_main' => $is_main,
            'type' => $request->type,
            'document_type' => 1,
        ]);
        if($request->type == 'main'){
            return response()->json($this->documentRepository->saveDocument($request, $path));
        }else{
            return response()->json($this->documentRepository->addDocumentToMe($request, $path));
        }
    }

    public function getChildDocumentsOwner($id){
        $ownerArray = [];
        $result = $this->documentRepository->create_all_child_array($id);
        $userId = Auth::parseToken()->getPayload()->get('userId');
        if(!empty($result)){
            $ownerArray = array_column($result,'createdBy');
            return response()->json(['childOwners' => array_unique($ownerArray), 'loggedInUser' => $userId]);
        }else{
            return response()->json(['loggedInUser' => $userId]);
        }
    }

    public function getFileFolderLinkDetails($documentId){
        $userId = Auth::parseToken()->getPayload()->get('userId');
        $model = VerifyDocumentLinks::where([['documentId', '=', $documentId], ['createdBy', '=', $userId]])->first();

        $verify_link = '';

        $base_url = secure_url('/');
        //dd($base_url);
        /**need to remove this while live */
        //$base_url = 'http://localhost:4200';

        if (!is_null($model)) {
            $id = $model->id;
            $encrypted_id = Crypt::encryptString($id);

            $verify_link = $base_url.'/verify-password/'.$encrypted_id;
        }else{
            $data = [
                "documentId" => $documentId,
            ];
            $linkid = $this->verifydocumentlinkRepository->saveVerifyDocumentLink($data);

            $encrypted_id = Crypt::encryptString($linkid);
            $verify_link = $base_url.'/verify-password/'.$encrypted_id;

            $data = [
                "documentId" => $documentId,
                "link" => $verify_link,
                "createdBy" => $userId,
            ];
            $this->verifydocumentlinkRepository->updateVerifyDocumentLink($data);
        }
        $model = VerifyDocumentLinks::where([['documentId', '=', $documentId], ['createdBy', '=', $userId]])->first();
        $model['password'] = (!empty($model->password)) ? Crypt::decryptString($model->password) : null;
        return response()->json($model);

    }

    public function save_document_link_details(Request $request){
        $userId = Auth::parseToken()->getPayload()->get('userId');
        $model = VerifyDocumentLinks::where([['documentId', '=', $request->documentId], ['createdBy', '=', $userId]])->first();
        $request->request->add(['createdBy' => $userId]);
        if (!is_null($model)) {
            $this->verifydocumentlinkRepository->updateVerifyDocumentLink($request->all());
            return response(200);
        }else{
            return response(403);
        }
    }

    public function checkFolderExitence(Request $request){
        $localPath = $request->localPath;
        $folders_array = explode('/',$request->localPath);
        $mainFolder = $folderName = '';
        if(!empty($folders_array))
        {
            $folderName = $folders_array[0];
        }
        if(!empty($request->parentId) && $request->parentId != 'null' && $request->parentId != "undefined" && !empty($request->localPath)){
            $details = Documents::find($request->parentId);
            $path = $details['url'].'/'.$folderName;
        }else{
            $path = 'documents/'.$folderName;
        }
        if (Storage::exists($path)) {

            $folderData = Documents::where('org_name',$folderName)->where('org_url',trim($path))->get();
            if(empty($folderData) || count($folderData) == 0){

                $folderDataNew = Documents::where('name',$folderName)->where('url',trim($path))->orderBy('name','DESC')->first();
                if(!empty($folderDataNew)){
                    // $folderData = Documents::where('org_name',$folderDataNew->org_name)->where('org_url',trim($folderDataNew->org_url))->orderBy('name','DESC')->first();
                    $folderData = Documents::where('org_name',$folderDataNew->org_name)->where('org_url',trim($folderDataNew->org_url))->get();
                }
            }

            if(!empty($folderData) && count($folderData) > 0){
                $folderData = $folderData->toArray();
                $namesArray = array_column($folderData,'name');
                $numericValues = array_map(function ($item) {
                    $parts = explode(' ', $item);
                    if(count($parts) > 1){
                        return (int)end($parts);
                    }else{
                        return 0;
                    }
                    // Return the numeric part as an integer

                }, $namesArray);
                // Find the maximum value
                $maxValue = (!empty($numericValues) && count($numericValues) > 0 ? max($numericValues) : '' );
                $folderOrgName = $folderData[0]['org_name'];

                $folderNumber = 0;
                if(!empty($maxValue)){
                    $folderNumber = $maxValue++;
                }
                $folderNumber++;
                $mainFolder = $folderOrgName.' '.$folderNumber;
            }else{
                $mainFolder = $folderName;
            }
        }else{
            $mainFolder = $folderName;
        }
        return response()->json(['mainFolder' => $mainFolder]);
    }

    public function moveCopyDocument(Request $request){
        $details = Documents::find($request->documentId);
        $details->parentId = (!empty($details->parentId)) ? $details->parentId : null;
        $tofolder = (!empty($request->toFolder) && $request->toFolder != 'null') ? $request->toFolder : null;

        if($details->parentId == $tofolder && $request->type == 'MOVE'){
            $errors['message'] = 'You cannot move document to the same folder';
            return response()->json($errors, 409);
            die;
        }
        /**here we are getting the old parent folder path,
        *so that we can remove exact same from the document we are moving and add new one*/
        if(!empty($details->parentId)){
            $oldParentDetails = Documents::find($details->parentId);
            $oldParentUrl = $oldParentDetails->url;
        }else{
            $oldParentUrl = 'documents';
        }
        if(!empty($tofolder)){
            $toFolderDetails = Documents::find($tofolder);
            $toFolderPath = $toFolderDetails->url;
        }else{
            $toFolderPath = 'documents';
        }

        $documentPath = trim($details->url);
        // Trim trailing slashes from paths
        $sourceFolderPath = rtrim($documentPath, '/');
        $destinationFolderPath = rtrim($toFolderPath, '/');

        // Construct the full source and destination paths
        $sourcePath = storage_path("app/".$sourceFolderPath);
        $destinationPath = storage_path("app/".$destinationFolderPath);
        if($request->type == 'MOVE'){
            $newMovedName = '';
            if($details->document_type == 1){
                /**check if toFolder have same named folder already */
                $requestData = [
                    'parentId' => $tofolder,
                    'localPath' => $details->name,
                ];
                $response = $this->checkFolderExitence(new \Illuminate\Http\Request($requestData));
                $response_details = json_decode($response->getContent());
                $newName = $response_details->mainFolder;
                $newMovedName = trim($newName);
                $newMovedUrl = $toFolderPath.''.str_replace($oldParentUrl,'',$documentPath);
                //$newMovedUrl = str_replace($details->name,$newMovedName,$newMovedUrl);
                $newMovedUrl = preg_replace('/'.$details->name.'/', $newMovedName, $newMovedUrl, 1);
            }else{
                $urlArray = explode('/',$details->url);
                $newMovedName = trim(end($urlArray));
                $newMovedUrl = $toFolderPath.''.str_replace($oldParentUrl,'',$documentPath);
            }

            //dd($newMovedUrl);
            if (!Storage::exists($sourceFolderPath)) {
                $errors['message'] = "Source directory does not exist.";
                return response()->json($errors, 409);
                die;
            } else {
                try {
                    if($details->document_type == 1){
                        try {
                            $success = Storage::move(str_replace('\\','/',$sourceFolderPath), str_replace('\\','/',$destinationFolderPath.'/'.$newMovedName));
                        } catch (\Exception $e) {
                            $errors['message'] = "Move failed: ".$e->getMessage();;
                            return response()->json($errors, 409);
                            die;
                        }
                    }else{
                        $success = Storage::move($sourceFolderPath, $destinationFolderPath.'/'.$newMovedName);
                    }
                    if($success){
                        $details->parentId = (!empty($tofolder)) ? $toFolderDetails->id : null;
                        $details->url = $newMovedUrl;
                        $details->org_url = $toFolderPath.''.str_replace($oldParentUrl,'',trim($details->org_url));
                        $details->is_main = (!empty($details->parentId)) ? 0 : 1;
                        if($details->document_type == 1){
                            $detailsOldName = $details->name;
                            $details->name = $newMovedName;

                            $childResults = $this->documentRepository->create_all_child_array($details->id);
                            foreach($childResults as $childResult){
                                $childResultDetails = Documents::find($childResult['id']);
                                $childResultDetails->url = $toFolderPath.''.str_replace($oldParentUrl,'',$childResultDetails->url);
                                //$childResultDetails->url = str_replace($detailsOldName,$newMovedName,$childResultDetails->url);
                                $childResultDetails->url = preg_replace('/'.$detailsOldName.'/', $newMovedName, $childResultDetails->url, 1);
                                $childResultDetails->org_url = $toFolderPath.''.str_replace($oldParentUrl,'',$childResultDetails->org_url);
                                //$childResultDetails->org_url = str_replace($detailsOldName,$newMovedName,$childResultDetails->org_url);
                                $childResultDetails->org_url = preg_replace('/'.$detailsOldName.'/', $newMovedName, $childResultDetails->org_url, 1);
                                $childResultDetails->save();
                            }
                        }
                        /**check the move folder/file permission details
                         * and if it do not have details then we will check its old parent folders details to save that for it*/
                        if(empty($tofolder)){
                            /**check moved folder permissions */
                            $this->save_copy_move_document_permissions($details->id,$request->type);
                        }
                        $details->save();
                    }else{
                        $errors['message'] = "Move failed";
                        return response()->json($errors, 409);
                        die;
                    }
                } catch (\Exception $e) {
                    $errors['message'] = "Move failed: ".$e->getMessage();
                    return response()->json($errors, 409);
                    die;
                }
            }
        }else{
            $newCopyName = '';
            $newCopyNameDb = '';
            if($details->document_type == 1){

                 /**check if toFolder have same named file or folder already */
                 $requestData = [
                    'parentId' => $tofolder,
                    'localPath' => $details->name,
                ];
                $response = $this->checkFolderExitence(new \Illuminate\Http\Request($requestData));
                //$response = $this->checkFolderExitence(new \Illuminate\Http\Request($requestData));
                $response_details = json_decode($response->getContent());
                $newName = $response_details->mainFolder;

                $newCopyName = trim($newName);
                $newCopyNameDb = $newCopyName;

                $newMovedUrl = $toFolderPath.''.str_replace($oldParentUrl,'',$documentPath);
                //$newMovedUrl = str_replace($details->name,$newCopyName,$newMovedUrl);
                $newMovedUrl = preg_replace('/'.$details->name.'/', $newCopyName, $newMovedUrl, 1);
            }else{
                $urlArray = explode('/',$details->url);
                $newCopyName = trim(end($urlArray));
                $newCopyNameDb = $details->name;
                $newMovedUrl = $toFolderPath.''.str_replace($oldParentUrl,'',$documentPath);
            }


            if (!Storage::exists($sourceFolderPath)) {
                $errors['message'] = "Source directory does not exist.";
                return response()->json($errors, 409);
                die;
            } else {
                try {
                    if($details->document_type == 1){
                        $success = File::copyDirectory($sourcePath, $destinationPath.'/'.$newCopyName);
                    }else{
                        $success = Storage::copy($sourceFolderPath, $destinationFolderPath.'/'.$newCopyName);
                    }

                    if($success){
                        $request = new Request([
                            'path'   => $destinationFolderPath.'/'.$newCopyName,
                            'org_url'   => $destinationFolderPath.'/'.preg_replace('/\s\d+$/', '', $newCopyName),
                            'categoryId' => $details->categoryId,
                            'name' => $newCopyNameDb.(!empty($details->mime_type)? '.'.$details->mime_type : ''),
                            'org_name' => preg_replace('/\s\d+$/', '', $newCopyNameDb),
                            'description' => $details->description,
                            'documentMetaDatas' => '[]',
                            'mime_type' => $details->mime_type,
                            'parentId' => (!empty($tofolder))? $toFolderDetails->id : null,
                            'is_main' => (!empty($tofolder))? 0 : 1,
                            'document_type' => $details->document_type,
                        ]);
                        //dd($newCopyNameDb);
                        $savedNewCopyId = $this->documentRepository->saveDocument($request, $destinationFolderPath.'/'.$newCopyName);
                        if($details->document_type == 1){
                            $this->saveNewCopyIntoDB($details->id, $oldParentUrl, $toFolderPath, $savedNewCopyId, $newCopyNameDb, $details->name);
                        }
                        if(empty($tofolder)){
                            /**check moved folder permissions */
                            $this->save_copy_move_document_permissions($details->id,$request->type,$savedNewCopyId);
                        }
                    }else{
                        $errors['message'] = "Copy failed";
                        return response()->json($errors, 409);
                        die;
                    }
                } catch (\Exception $e) {
                    //dd($e);

                    //echo "Move failed: ".$e->getMessage();
                    $errors['message'] = "Copy failed: ".$e->getMessage();
                    return response()->json($errors, 409);
                    die;
                }
            }
        }
    }

    public function save_copy_move_document_permissions($documentId, $type, $savedNewCopyId = null){
        //dd($documentId);
        $permissionDetails = $this->documentPermissionRepository->getDocumentPermissionList($documentId);
        if(!empty($permissionDetails) && count($permissionDetails) > 0){
            if($type == 'COPY' && !empty($savedNewCopyId)){
                $permissionDetailsArray = $permissionDetails->toArray();
                foreach($permissionDetailsArray as $permissionDetail){
                    if($permissionDetail['type'] == 'Role'){
                        DocumentRolePermissions::create([
                            'documentId' => $savedNewCopyId,
                            'endDate' => $permissionDetail['endDate'],
                            'isAllowDownload' => $permissionDetail['isAllowDownload'],
                            'isTimeBound' => $permissionDetail['isTimeBound'],
                            'roleId' => $permissionDetail['roleId'],
                            'startDate' => $permissionDetail['startDate']
                        ]);
                    }elseif($permissionDetail['type'] == 'User'){
                        DocumentUserPermissions::create([
                            'documentId' => $savedNewCopyId,
                            'endDate' => $permissionDetail['endDate'],
                            'isAllowDownload' => $permissionDetail['isAllowDownload'],
                            'isTimeBound' => $permissionDetail['isTimeBound'],
                            'userId' => $permissionDetail['userId'],
                            'startDate' => $permissionDetail['startDate']
                        ]);
                    }
                }
            }
        }else{
            $parent_documents_array = [];
            if(!empty($documentId)){
                $parent_documents_array = $this->documentRepository->create_all_parent_array($documentId);
            }
            //dd($parent_documents_array);
            if(!empty($parent_documents_array) && count($parent_documents_array) > 1){
                $parent_documents_array = array_reverse($parent_documents_array);
                foreach($parent_documents_array as $parent_document){
                    $permissionDetails = $this->documentPermissionRepository->getDocumentPermissionList($parent_document);
                    if(!empty($permissionDetails) && count($permissionDetails) > 0){
                        $permissionDetailsArray = $permissionDetails->toArray();
                        foreach($permissionDetailsArray as $permissionDetail){
                            if($permissionDetail['type'] == 'Role'){
                                DocumentRolePermissions::create([
                                    'documentId' => (!empty($savedNewCopyId) ? $savedNewCopyId : $documentId),
                                    'endDate' => $permissionDetail['endDate'],
                                    'isAllowDownload' => $permissionDetail['isAllowDownload'],
                                    'isTimeBound' => $permissionDetail['isTimeBound'],
                                    'roleId' => $permissionDetail['roleId'],
                                    'startDate' => $permissionDetail['startDate']
                                ]);
                            }elseif($permissionDetail['type'] == 'User'){
                                DocumentUserPermissions::create([
                                    'documentId' => (!empty($savedNewCopyId) ? $savedNewCopyId : $documentId),
                                    'endDate' => $permissionDetail['endDate'],
                                    'isAllowDownload' => $permissionDetail['isAllowDownload'],
                                    'isTimeBound' => $permissionDetail['isTimeBound'],
                                    'userId' => $permissionDetail['userId'],
                                    'startDate' => $permissionDetail['startDate']
                                ]);
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    public function saveNewCopyIntoDB($oldParentId, $oldParentUrl, $toFolderPath, $newCopyId, $newCopyNameDb, $oldName){
        $oldParentDetails = Documents::where('parentId',$oldParentId)->get();

        if($oldParentDetails){
            foreach($oldParentDetails as $oldParentDetail){
                $newUrl = $toFolderPath.''.str_replace($oldParentUrl,'',$oldParentDetail->url);
                //$newUrl = str_replace($oldName,$newCopyNameDb,$newUrl);
                $newUrl = preg_replace('/'.$oldName.'/', $newCopyNameDb, $newUrl, 1);
                //dd($newUrl);
                $newName = $oldParentDetail->name.''.(!empty($oldParentDetail->mime_type) ? '.'.$oldParentDetail->mime_type : '');
                $request = new Request([
                    'path'   => $newUrl,
                    'org_url'   => $newUrl,
                    'categoryId' => $oldParentDetail->categoryId,
                    'name' => $newName,
                    'org_name' => preg_replace('/\s\d+$/', '', $newName),
                    'description' => $oldParentDetail->description,
                    'documentMetaDatas' => '[]',
                    'mime_type' => $oldParentDetail->mime_type,
                    'parentId' => $newCopyId,
                    'is_main' => 0,
                    'document_type' => $oldParentDetail->document_type,
                ]);

                $savedNewCopyId = $this->documentRepository->saveDocument($request, $newUrl);
                if($oldParentDetail->document_type == 1){
                    $this->saveNewCopyIntoDB($oldParentDetail->id, $oldParentUrl, $toFolderPath, $savedNewCopyId, $newCopyNameDb, $oldName);
                }
            }
        }
    }
}
