<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Dto\LoginAuditResource;
use App\Repositories\Contracts\LoginAuditRepositoryInterface;

class LoginAuditController extends Controller
{
    private $loginAuditRepository;
    protected $queryString;

    public function __construct(LoginAuditRepositoryInterface $loginAuditRepository)
    {
        $this->loginAuditRepository = $loginAuditRepository;
    }

    public function getLoginAudit(Request $request)
    {
        $this->queryString = new LoginAuditResource();

        if ($request->has('Fields')) {
            $this->queryString->fields = $request->input('Fields');
        }
        if ($request->has('OrderBy')) {
            $this->queryString->orderBy = $request->input('OrderBy');
        }
        if ($request->has('PageSize')) {
            $this->queryString->pageSize = $request->input('PageSize');
        }
        if ($request->has('SearchQuery')) {
            $this->queryString->searchQuery = $request->input('SearchQuery');
        }
        if ($request->has('Skip')) {
            $this->queryString->skip = $request->input('Skip');
        }
        if ($request->has('userName')) {
            $this->queryString->userName = $request->input('userName');
        }

        $count = $this->loginAuditRepository->getLoginAuditsCount($this->queryString);
        return response()->json($this->loginAuditRepository->getLoginAudits($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
    }

}
