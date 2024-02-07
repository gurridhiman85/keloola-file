<?php
namespace  App\Http\Dto;

class ResourceParameter
{
    public ?int $maxPageSize = 100;
    public ?int $skip = 0;
    public ?string $searchQuery;
    public ?string $orderBy;
    public ?string $fields;
    public ?int $pageSize = 10;
}
