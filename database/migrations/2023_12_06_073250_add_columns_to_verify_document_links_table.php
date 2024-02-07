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
        Schema::table('verifydocumentlinks', function (Blueprint $table) {
            $table->dateTime('startDate')->after('link');
            $table->dateTime('endDate')->after('startDate');
            $table->boolean('isTimeBound')->after('endDate');
            $table->boolean('allowPassword')->after('endDate');
            $table->tinyInteger('allowType')->default(1)->after('allowPassword');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('verifydocumentlinks', function (Blueprint $table) {
            $table->dropColumn('startDate');
            $table->dropColumn('endDate');
            $table->dropColumn('isTimeBound');
            $table->dropColumn('allowPassword');
            $table->dropColumn('allowType');
        });
    }
};
