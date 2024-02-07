<?php

namespace App\Http\Controllers;

use App\Http\Dto\ReminderResource;
use Illuminate\Http\Request;
use App\Repositories\Contracts\ReminderRepositoryInterface;

class ReminderController extends Controller
{
    private $reminderRepository;
    protected $queryString;

    public function __construct(ReminderRepositoryInterface $reminderRepository)
    {
        $this->reminderRepository = $reminderRepository;
    }

    public function getReminders(Request $request)
    {
        $this->queryString = new ReminderResource();

        if ($request->has('Fields')) {
            $this->queryString->fields = $request->input('Fields');
        }
        if ($request->has('OrderBy')) {
            $this->queryString->orderBy = $request->input('OrderBy');
        }
        if ($request->has('PageSize')) {
            $this->queryString->pageSize = $request->input('PageSize');
        }
        if ($request->has('subject')) {
            $this->queryString->subject = $request->input('subject');
        }
        if ($request->has('SearchQuery')) {
            $this->queryString->searchQuery = $request->input('SearchQuery');
        }
        if ($request->has('Skip')) {
            $this->queryString->skip = $request->input('Skip');
        }
        if ($request->has('message')) {
            $this->queryString->message = $request->input('message');
        }
        if ($request->has('frequency')) {
            $this->queryString->frequency = $request->input('frequency');
        }

        $count = $this->reminderRepository->getRemindersCount($this->queryString);
        return response()->json($this->reminderRepository->getReminders($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
    }

    public function getReminderForLoginUser(Request $request)
    {
        $this->queryString = new ReminderResource();

        if ($request->has('Fields')) {
            $this->queryString->fields = $request->input('Fields');
        }
        if ($request->has('OrderBy')) {
            $this->queryString->orderBy = $request->input('OrderBy');
        }
        if ($request->has('PageSize')) {
            $this->queryString->pageSize = $request->input('PageSize');
        }
        if ($request->has('subject')) {
            $this->queryString->subject = $request->input('subject');
        }
        if ($request->has('SearchQuery')) {
            $this->queryString->searchQuery = $request->input('SearchQuery');
        }
        if ($request->has('Skip')) {
            $this->queryString->skip = $request->input('Skip');
        }
        if ($request->has('message')) {
            $this->queryString->message = $request->input('message');
        }
        if ($request->has('frequency')) {
            $this->queryString->frequency = $request->input('frequency');
        }

        $count = $this->reminderRepository->getReminderForLoginUserCount($this->queryString);
        return response()->json($this->reminderRepository->getReminderForLoginUser($this->queryString))
            ->withHeaders(['totalCount' => $count, 'pageSize' => $this->queryString->pageSize, 'skip' => $this->queryString->skip]);
    }

    public function addReminder(Request $request)
    {
        return  response($this->reminderRepository->addReminders($request->all()), 201);
    }

    public function updateReminder(Request $request, $id)
    {
        return  response($this->reminderRepository->updateReminders($request, $id), 201);
    }

    public function edit($id)
    {
        return response()->json($this->reminderRepository->findReminder($id));
    }

    public function deleteReminder($id)
    {
        return response($this->reminderRepository->delete($id), 204);
    }

    public function deleteReminderCurrentUser($id)
    {
        return response($this->reminderRepository->deleteReminderCurrentUser($id));
    }
}
