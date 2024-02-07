<?php

namespace App\Http\Controllers;

use App\Models\EmailSMTPSettings;
use App\Repositories\Contracts\SendEmailRepositoryInterface;
use App\Repositories\Contracts\EmailRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use App\Repositories\Exceptions\RepositoryException;
use Illuminate\Http\Request;
use App\Models\Documents;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use App\Repositories\Contracts\VerifyDocumentLinkInterface;
use Illuminate\Support\Str;
use Illuminate\Routing\UrlGenerator;
use App\Models\VerifyDocumentLinks;
use Ramsey\Uuid\Uuid;
use Illuminate\Support\Facades\Storage;
use ZipArchive;


class EmailController extends Controller
{
    private $sendEmailRepository;
    private $emailRepository;
    private $verifydocumentlinkRepository;

    public function __construct(
        SendEmailRepositoryInterface $sendEmailRepository,
        EmailRepositoryInterface $emailRepository,
        VerifyDocumentLinkInterface $verifydocumentlinkRepository
    )
    {
        $this->sendEmailRepository = $sendEmailRepository;
        $this->emailRepository = $emailRepository;
        $this->verifydocumentlinkRepository = $verifydocumentlinkRepository;
    }

    public function sendEmail(Request $request)
    {
        $defaultSMTP = EmailSMTPSettings::where('isDefault', 1)->first();
        if ($defaultSMTP == null) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Default SMTP configuration does not exist.',
            ], 422);
        }

        $email = Auth::parseToken()->getPayload()->get('email');

        if ($email == null) {
            throw new RepositoryException('Email does not exist.');
        }

        $request['fromEmail'] = $email;
        $request['isSend'] = false;
        return  response($this->sendEmailRepository->create($request->all()), 201);
    }

    public function send_document_link_via_Email(Request $request){

        $documentId = $request->documentId;
        $toEmail = $request->email;
        $subject = $request->subject;

        /**check if document is existing or not*/
        $documentDetails = Documents::where('id',$documentId)->first();
        if ($documentDetails == null) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Unable to found document.',
            ], 422);
        }

        /**check if document is file or folder */
        if($documentDetails->mime_type == null){
            $document_local_path = storage_path('app/'.$documentDetails->url);
            $zip = new ZipArchive;
            $zipFileName = time().' '.$documentDetails->name.'.zip';

            if (!Storage::exists('documents_zip')) {
                Storage::makeDirectory('documents_zip');
            }

            if ($zip->open(storage_path('app/documents_zip/' . $zipFileName), ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
                $files = Storage::Files($documentDetails->url);
                if(!empty($files)){
                    foreach ($files as $file) {
                        $filePath = Storage::path($file);
                        $zip->addFile($filePath, $documentDetails->name .'/'. basename($file));
                    }
                }

                $directories = Storage::allDirectories($documentDetails->url);
                if(!empty($directories)){
                    foreach ($directories as $directory) {
                        $relativePath = str_replace($documentDetails->url, $documentDetails->name, $directory);

                        if (empty(Storage::allFiles($directory))) {
                            $zip->addEmptyDir($relativePath);
                        } else {
                            $files = Storage::allFiles($directory);
                            foreach ($files as $file) {
                                $filePath = Storage::path($file);
                                $zip->addFile($filePath, $relativePath . '/' . basename($file));
                            }
                        }
                    }
                }
                if(count($files) === 0 && count($directories) === 0){
                    $zip->addEmptyDir($documentDetails->name);
                }

                $zip->close();;
            }
            $path = 'documents_zip/'.$zipFileName;
        }else{
            $path = $documentDetails->url;
        }
        $password =Str::random(8);
        $hashed_password = Hash::make($password);
        $data = [
            "documentId" => $documentId,
            "password" => $hashed_password,
            "toEmail" => $toEmail,
            "documentPath" => $path
        ];

        $model = VerifyDocumentLinks::where([['documentId', '=', $documentId], ['toEmail', '=', $toEmail]])->first();

        if (!is_null($model)) {
            $id = $model->id;
            $this->verifydocumentlinkRepository->updateVerifyDocumentLink($data);
        }else{
            $id = $this->verifydocumentlinkRepository->saveVerifyDocumentLink($data);
        }

        $encrypted_id = Crypt::encryptString($id);
        $base_url = url()->to('/');
        /**need to remove this while live */
        //$base_url = 'http://localhost:4200';

        $verify_link = $base_url.'/verify-password/'.$encrypted_id;

        $message = 'Hi '.$toEmail.', you can download the document file using the button given below <br><a href="'.$verify_link.'" class="btn btn-success"><button style="font-size: 14px; margin: 10px 0px;border-radius: 14px;padding: 6px 15px 6px 15px;border: 1px #747775 solid;background: #fff; cursor: pointer;">Download</button></a><br> And this the access password for link. <br>Password : '.$password;

        $this->emailRepository->sendEmail(['to_address' => $toEmail,'subject' => $subject, 'message' => $message,'path' => null]);
    }
}
