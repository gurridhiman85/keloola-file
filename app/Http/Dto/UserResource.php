<?php

namespace App\Http\Dto;

use App\Http\Dto\ResourceParameter;
use DateTime;

class UserResource extends ResourceParameter
{
    // public ?string $name;
    // public ?string $id;
    // public ?DateTime $createDate;
    // public ?string $createDateString;
    // public ?string $createdBy;

    public ?string $name = null;
    public ?string $id = null;
    public ?DateTime $createDate = null;
    public ?string $createDateString = null;
    public ?string $createdBy = null;
    public ?string $role = null;
    public ?string $orderBy = null;
    public ?string $userName = null;


    // Constructor (optional)
    public function __construct(
        ?string $name = null,
        ?string $id = null,
        ?DateTime $createDate = null,
        ?string $createDateString = null,
        ?string $createdBy = null,
        ?string $role = null,
        ?string $orderBy = null,
        ?string $userName = null
    ) {
        $this->name = $name;
        $this->id = $id;
        $this->createDate = $createDate;
        $this->createDateString = $createDateString;
        $this->createdBy = $createdBy;
        $this->role = $role;
        $this->orderBy = $orderBy;
        $this->userName = $userName;
    }
}
