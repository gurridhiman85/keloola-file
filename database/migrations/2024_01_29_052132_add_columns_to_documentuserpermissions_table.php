<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('documentUserPermissions', function (Blueprint $table) {
            $table->boolean('isAllowCopyMove')->after('isAllowDownload');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('documentUserPermissions', function (Blueprint $table) {
            $table->dropColumn('isAllowCopyMove');
        });
    }
};
