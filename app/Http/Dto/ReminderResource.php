<?php
namespace App\Http\Dto;

use App\Http\Dto\ResourceParameter;

class ReminderResource extends ResourceParameter
{
    public ?string $subject;
    public ?string $message;
    public ?int $frequency;
}
