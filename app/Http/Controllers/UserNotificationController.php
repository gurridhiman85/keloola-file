<?php

namespace App\Http\Controllers;

use App\Http\Dto\NotificationResource;
use App\Repositories\Contracts\UserNotificationRepositoryInterface;
use Illuminate\Http\Request;

class UserNotificationController extends Controller
{
    private $userNotificationRepository;
    protected $queryString;

    public function __construct(UserNotificationRepositoryInterface $userNotificationRepository)
    {
        $this->userNotificationRepository = $userNotificationRepository;
    }
    public function index()
    {
        return response()->json($this->userNotificationRepository->getTop10Notification());
    }

    public function getNotifications(Request $request)
    {
        $this->queryString = new NotificationResource();

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

        if ($request->has('name')) {
            $this->queryString->name = $request->input('name');
        }

        $count = $this->userNotificationRepository->getUserNotificaionCount($this->queryString);
        return response()->json($this->userNotificationRepository->getUserNotificaions($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
    }

    public function markAsRead(Request $request)
    {
        return  response()->json($this->userNotificationRepository->markAsRead($request), 200);
    }

    public function markAllAsRead()
    {
        return  response()->json($this->userNotificationRepository->markAllAsRead(), 200);
    }
}
