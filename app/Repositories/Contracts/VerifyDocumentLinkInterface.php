<?php

namespace App\Repositories\Contracts;

use App\Repositories\Contracts\BaseRepositoryInterface;

interface VerifyDocumentLinkInterface extends BaseRepositoryInterface
{
    public function saveVerifyDocumentLink($data);
    public function updateVerifyDocumentLink($data);
}
