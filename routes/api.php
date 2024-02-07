<?php


use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PagesController;
use App\Http\Controllers\ActionsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentCommentController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserClaimController;
use App\Http\Controllers\EmailSMTPSettingController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentPermissionController;
use App\Http\Controllers\DocumentVersionController;
use App\Http\Controllers\DocumentAuditTrailController;
use App\Http\Controllers\DocumentTokenController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\RoleUsersController;
use App\Http\Controllers\LoginAuditController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\UserNotificationController;
use App\Http\Controllers\VerfiyDocumentLinkController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::controller(AuthController::class)->group(function () {
    Route::post('auth/login', 'login');
    Route::post('auth/logout', 'logout');
});

Route::get('document/{id}/officeviewer', [DocumentController::class, 'officeviewer']);

Route::post('verify-document', [VerfiyDocumentLinkController::class, 'verify_document_password']);
Route::get('/link-docuemnts', [VerfiyDocumentLinkController::class, 'getDocuments']);
Route::get('/shared-document/{id}/download/{isVersion}/{toEmail}', [DocumentController::class, 'downloadDocument']);
Route::get('/link-docuemnt/{id}/{type?}', [VerfiyDocumentLinkController::class, 'getDocumentbyId']);
Route::get('/getverfiylinkDetailsById/{id}', [VerfiyDocumentLinkController::class, 'getverfiylinkDetailsById']);
Route::post('/documentAuditTrailAnonymous', [VerfiyDocumentLinkController::class, 'documentAuditTrailAnonymous']);
Route::get('/document/{id}/isDownloadFlag/isPermission/{isPermission}', [DocumentPermissionController::class, 'getIsDownloadFlag']);

Route::get('/document/{id}/download/{isVersion}', [DocumentController::class, 'downloadDocument']);

Route::middleware(['auth'])->group(function () {

    Route::post('auth/refresh', [AuthController::class, 'refresh']);

    Route::middleware('hasToken:USER_VIEW_USERS')->group(function () {
        Route::get('/user', [UserController::class, 'index']);
    });

    Route::middleware('hasToken:USER_CREATE_USER')->group(function () {
        Route::post('/user', [UserController::class, 'create']);
    });

    Route::middleware('hasToken:USER_EDIT_USER')->group(function () {
        Route::put('/user/{id}', [UserController::class, 'update']);
    });

    Route::middleware('hasToken:USER_DELETE_USER')->group(function () {
        Route::delete('/user/{id}', [UserController::class, 'destroy']);
    });

    Route::middleware('hasToken:USER_EDIT_USER')->group(function () {
        Route::get('/user/{id}', [UserController::class, 'edit']);
    });

    Route::middleware('hasToken:USER_RESET_PASSWORD')->group(function () {
        Route::post('/user/resetpassword', [UserController::class, 'submitResetPassword']);
    });


    Route::post('/user/changepassword', [UserController::class, 'changePassword']);

    Route::put('/users/profile', [UserController::class, 'updateUserProfile']);

    Route::middleware('hasToken:USER_ASSIGN_PERMISSION')->group(function () {
        Route::put('/userClaim/{id}', [UserClaimController::class, 'update']);
    });

    Route::middleware('hasToken:USER_VIEW_USERS')->group(function () {
        Route::get('/users', [UserController::class, 'get_users']);
    });

    Route::middleware('hasToken:DASHBOARD_VIEW_DASHBOARD')->group(function () {
        Route::get('/dashboard/dailyreminder/{month}/{year}', [DashboardController::class, 'getDailyReminders']);
        Route::get('/dashboard/weeklyreminder/{month}/{year}', [DashboardController::class, 'getWeeklyReminders']);
        Route::get('/dashboard/monthlyreminder/{month}/{year}', [DashboardController::class, 'getMonthlyReminders']);
        Route::get('/dashboard/quarterlyreminder/{month}/{year}', [DashboardController::class, 'getQuarterlyReminders']);
        Route::get('/dashboard/halfyearlyreminder/{month}/{year}', [DashboardController::class, 'getHalfYearlyReminders']);
        Route::get('/dashboard/yearlyreminder/{month}/{year}', [DashboardController::class, 'getYearlyReminders']);
        Route::get('/dashboard/onetimereminder/{month}/{year}', [DashboardController::class, 'getOneTimeReminder']);
        Route::get('/Dashboard/GetDocumentByCategory', [DocumentController::class, 'getDocumentsByCategoryQuery']);
    });

    Route::get('/category/dropdown', [CategoryController::class, 'GetAllCategoriesForDropDown']);
    Route::middleware('hasToken:DOCUMENT_CATEGORY_MANAGE_DOCUMENT_CATEGORY')->group(function () {
        Route::get('category', [CategoryController::class, 'index']);
        Route::post('/category', [CategoryController::class, 'create']);
        Route::put('/category/{id}', [CategoryController::class, 'update']);
        Route::delete('/category/{id}', [CategoryController::class, 'destroy']);
        Route::get('/category/{id}/subcategories', [CategoryController::class, 'subcategories']);
    });

    Route::get('/pages', [PagesController::class, 'index']);
    Route::post('/pages', [PagesController::class, 'create']);
    Route::put('/pages/{id}', [PagesController::class, 'update']);
    Route::delete('/pages/{id}', [PagesController::class, 'destroy']);


    Route::get('/actions', [ActionsController::class, 'index']);
    Route::post('/actions', [ActionsController::class, 'create']);
    Route::put('/actions/{id}', [ActionsController::class, 'update']);
    Route::delete('/actions/{id}', [ActionsController::class, 'destroy']);

    Route::middleware('hasToken:ROLE_VIEW_ROLES')->group(function () {
        Route::get('/role', [RoleController::class, 'index']);
    });

    Route::middleware('hasToken:ROLE_CREATE_ROLE')->group(function () {
        Route::post('/role', [RoleController::class, 'create']);
    });

    Route::middleware('hasToken:ROLE_EDIT_ROLE')->group(function () {
        Route::put('/role/{id}', [RoleController::class, 'update']);
    });

    Route::middleware('hasToken:ROLE_DELETE_ROLE')->group(function () {
        Route::delete('/role/{id}', [RoleController::class, 'destroy']);
    });

    Route::middleware('hasToken:ROLE_EDIT_ROLE')->group(function () {
        Route::get('/role/{id}', [RoleController::class, 'edit']);
    });

    Route::middleware('hasToken:EMAIL_MANAGE_SMTP_SETTINGS')->group(function () {
        Route::get('/emailSMTPSetting', [EmailSMTPSettingController::class, 'index']);
        Route::post('/emailSMTPSetting', [EmailSMTPSettingController::class, 'create']);
        Route::put('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'update']);
        Route::delete('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'destroy']);
        Route::get('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'edit']);
    });

    //Route::get('/document/{id}/download/{isVersion}', [DocumentController::class, 'downloadDocument']);
    Route::get('/document/{id}/readText/{isVersion}', [DocumentController::class, 'readTextDocument']);
    Route::middleware('hasToken:ALL_DOCUMENTS_VIEW_DOCUMENTS')->group(function () {
        Route::get('/documents', [DocumentController::class, 'getDocuments']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_CREATE_DOCUMENT')->group(function () {
        Route::post('/document', [DocumentController::class, 'saveDocument']);
        Route::post('/document/upload/chunks', [DocumentController::class, 'uploadChunks']);
        Route::post('/document/checkFolderExitence', [DocumentController::class, 'checkFolderExitence']);
    });


    Route::get('/getFileFolderLink/{id}', [DocumentController::class, 'getFileFolderLinkDetails']);

    Route::get('/document/assignedDocuments', [DocumentController::class, 'assignedDocuments']);

    Route::middleware('hasToken:ASSIGNED_DOCUMENTS_CREATE_DOCUMENT')->group(function () {
        Route::post('/document/assign', [DocumentController::class, 'addDocumentToMe']);
    });

    Route::get('/document/{id}/{type?}', [DocumentController::class, 'getDocumentbyId']);

    Route::get('/getChildDocumentsOwner/{id}', [DocumentController::class, 'getChildDocumentsOwner']);

    Route::middleware('hasToken:ALL_DOCUMENTS_EDIT_DOCUMENT')->group(function () {
        Route::get('/document/{id}/getMetatag', [DocumentController::class, 'getDocumentMetatags']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_EDIT_DOCUMENT')->group(function () {
        Route::put('/document/{id}', [DocumentController::class, 'updateDocument']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_DELETE_DOCUMENT')->group(function () {
        Route::delete('/document/{id}', [DocumentController::class, 'deleteDocument']);
    });
    Route::post('/create_folder', [DocumentController::class, 'createFolder']);
    Route::post('/save_document_link_details', [DocumentController::class, 'save_document_link_details']);
    Route::post('/movecopyDocument', [DocumentController::class, 'moveCopyDocument']);


    Route::middleware('hasToken:DOCUMENT_AUDIT_TRAIL_VIEW_DOCUMENT_AUDIT_TRAIL')->group(function () {
        Route::get('/documentAuditTrail', [DocumentAuditTrailController::class, 'getDocumentAuditTrails']);
    });

    Route::post('/documentAuditTrail', [DocumentAuditTrailController::class, 'saveDocumentAuditTrail']);

    Route::get('/documentComment/{documentId}', [DocumentCommentController::class, 'index']);

    Route::delete('/documentComment/{id}', [DocumentCommentController::class, 'destroy']);

    Route::post('/documentComment', [DocumentCommentController::class, 'saveDocumentComment']);

    Route::middleware('hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT')->group(function () {
        Route::get('/DocumentRolePermission/{id}', [DocumentPermissionController::class, 'edit']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT')->group(function () {
        Route::post('/documentRolePermission', [DocumentPermissionController::class, 'addDocumentRolePermission']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT')->group(function () {
        Route::post('/documentUserPermission', [DocumentPermissionController::class, 'addDocumentUserPermission']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT')->group(function () {
        Route::post('/documentRolePermission/multiple', [DocumentPermissionController::class, 'multipleDocumentsToUsersAndRoles']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT')->group(function () {
        Route::delete('/documentUserPermission/{id}', [DocumentPermissionController::class, 'deleteDocumentUserPermission']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT')->group(function () {
        Route::delete('/documentRolePermission/{id}', [DocumentPermissionController::class, 'deleteDocumentRolePermission']);
    });

    Route::middleware('hasToken:ALL_DOCUMENTS_SHARE_DOCUMENT')->group(function () {
        Route::post('/documentRolePermission/updateCopyMovePermission', [DocumentPermissionController::class, 'updateCopyMovePermission']);
    });


    Route::get('/documentversion/{documentId}', [DocumentVersionController::class, 'index']);

    Route::post('/documentversion', [DocumentVersionController::class, 'saveNewVersionDocument']);

    Route::post('/documentversion/{id}/restore/{versionId}', [DocumentVersionController::class, 'restoreDocumentVersion']);

    Route::get('/documentToken/{documentId}/token', [DocumentTokenController::class, 'getDocumentToken']);
    Route::delete('/documentToken/{token}', [DocumentTokenController::class, 'deleteDocumentToken']);
    Route::post('/reminder/document', [ReminderController::class, 'addReminder']);
    Route::get('/reminder/{id}/myreminder', [ReminderController::class, 'edit']);

    Route::middleware('hasToken:USER_ASSIGN_USER_ROLE')->group(function () {
        Route::get('/roleusers/{roleId}', [RoleUsersController::class, 'getRoleUsers']);
    });

    Route::middleware('hasToken:USER_ASSIGN_USER_ROLE')->group(function () {
        Route::put('/roleusers/{roleId}', [RoleUsersController::class, 'updateRoleUsers']);
    });

    Route::middleware('hasToken:LOGIN_AUDIT_VIEW_LOGIN_AUDIT_LOGS')->group(function () {
        Route::get('/loginAudit', [LoginAuditController::class, 'getLoginAudit']);
    });

    Route::middleware('hasToken:REMINDER_VIEW_REMINDERS')->group(function () {
        Route::get('/reminder/all', [ReminderController::class, 'getReminders']);
    });

    Route::middleware('hasToken:REMINDER_CREATE_REMINDER')->group(function () {
        Route::post('/reminder', [ReminderController::class, 'addReminder']);
    });

    Route::middleware('hasToken:REMINDER_EDIT_REMINDER')->group(function () {
        Route::get('/reminder/{id}', [ReminderController::class, 'edit']);
    });

    Route::middleware('hasToken:REMINDER_EDIT_REMINDER')->group(function () {
        Route::put('/reminder/{id}', [ReminderController::class, 'updateReminder']);
    });

    Route::middleware('hasToken:REMINDER_DELETE_REMINDER')->group(function () {
        Route::delete('/reminder/{id}', [ReminderController::class, 'deleteReminder']);
    });

    Route::get('/reminder/all/currentuser', [ReminderController::class, 'getReminderForLoginUser']);

    Route::delete('/reminder/currentuser/{id}', [ReminderController::class, 'deleteReminderCurrentUser']);

    Route::middleware('hasToken:EMAIL_MANAGE_SMTP_SETTINGS')->group(function () {
        Route::put('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'update']);
        Route::delete('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'destroy']);
        Route::get('/emailSMTPSetting/{id}', [EmailSMTPSettingController::class, 'edit']);
    });

    Route::get('/userNotification/notification', [UserNotificationController::class, 'index']);
    Route::get('/userNotification/notifications', [UserNotificationController::class, 'getNotifications']);
    Route::post('/userNotification/MarkAsRead', [UserNotificationController::class, 'markAsRead']);
    Route::post('/UserNotification/MarkAllAsRead', [UserNotificationController::class, 'markAllAsRead']);

    Route::post('/email', [EmailController::class, 'sendEmail']);

    Route::post('/email_with_file_link', [EmailController::class, 'send_document_link_via_Email']);

});
Route::get('/test_documents', [DocumentController::class, 'test_documents']);

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

