<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Dto\DocumentResource;
use App\Models\Documents;
use App\Repositories\Contracts\DocumentAuditTrailRepositoryInterface;
use Illuminate\Support\Facades\Storage;


class DocumentAuditTrailController extends Controller
{
    private $documentAuditTrailRepository;
    protected $queryString;

    public function __construct(DocumentAuditTrailRepositoryInterface $documentAuditTrailRepository)
    {
        $this->documentAuditTrailRepository = $documentAuditTrailRepository;
    }

    public function getDocumentAuditTrails(Request $request)
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
        if ($request->has('createdDate')) {
            $this->queryString->createDate = $request->input('createdDate');
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
        if ($request->has('createdBy')) {
            $this->queryString->createdBy = $request->input('createdBy');
        }
        if ($request->has('id')) {
            $this->queryString->id = $request->input('id');
        }
        $count = $this->documentAuditTrailRepository->getDocumentAuditTrailsCount($this->queryString);
        return response()->json($this->documentAuditTrailRepository->getDocumentAuditTrails($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
    }

    public function downloadDocument($id)
    {
        $file = Documents::findOrFail($id);
        $fileupload = $file->url;

        if (Storage::disk('local')->exists($fileupload)) {
            $file_contents = Storage::disk('local')->get($fileupload);
            $fileType = Storage::mimeType($fileupload);

            $fileExtension = explode('.', $file->url);
            return response($file_contents)
                ->header('Cache-Control', 'no-cache private')
                ->header('Content-Description', 'File Transfer')
                ->header('Content-Type', $fileType)
                ->header('Content-length', strlen($file_contents))
                ->header('Content-Disposition', 'attachment; filename=' . $file->name . '.' . $fileExtension[1])
                ->header('Content-Transfer-Encoding', 'binary');
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
    public function saveDocumentAuditTrail(Request $request)
    {
        return response()->json($this->documentAuditTrailRepository->saveDocumentAuditTrail($request));
    }

    public function deleteDocument($id)
    {
        return response($this->documentAuditTrailRepository->delete($id), 204);
    }
}
