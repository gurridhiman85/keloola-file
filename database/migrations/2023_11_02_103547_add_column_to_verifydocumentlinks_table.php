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
            $table->string('documentPath')->nullable()->after('documentId');
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
            $table->dropColumn('documentPath');
        });
    }
};
