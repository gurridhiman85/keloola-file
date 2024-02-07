<?php

namespace App\Http\Dto;

use App\Http\Dto\ResourceParameter;
use DateTime;

class DocumentResource extends ResourceParameter
{
    public ?string $name;
    public ?string $id;
    public ?string $categoryId;
    public ?DateTime $createDate;
    public ?string $createDateString;
    public ?string $createdBy;
    public ?string $metaTags;
}
