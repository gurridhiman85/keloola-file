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
        Schema::table('users', function (Blueprint $table) {
            $table->dateTime('createdDate')->after('accessFailedCount');
            $table->uuid('createdBy')->nullable(false)->after('createdDate');
            $table->dateTime('modifiedDate')->after('createdBy');
            $table->uuid('modifiedBy')->nullable(true)->after('modifiedDate');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('createdDate');
            $table->dropColumn('createdBy');
            $table->dropColumn('modifiedDate');
            $table->dropColumn('modifiedBy');
        });
    }
};
