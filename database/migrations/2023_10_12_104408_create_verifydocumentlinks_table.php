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
        Schema::create('verifydocumentlinks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('documentId')->nullable();
            $table->string('password')->nullable();
            $table->string('toEmail')->nullable();
            $table->uuid('createdBy')->nullable(false);
            $table->foreign('createdBy')->references('id')->on('users');
            $table->string('modifiedBy');
            $table->dateTime('createdDate');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('verifydocumentlinks');
    }
};
