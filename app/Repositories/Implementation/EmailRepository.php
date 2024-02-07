<?php

namespace App\Repositories\Implementation;

use App\Repositories\Contracts\EmailRepositoryInterface;
use Illuminate\Support\Facades\Config;
use App\Models\EmailSMTPSettings;
use Illuminate\Support\Facades\Mail;


//use Your Model

/**
 * Class ActionsRepository.
 */
class EmailRepository  implements EmailRepositoryInterface
{
    /**
     * @var Model
     */
    protected $model;

    /**
     * BaseRepository constructor.
     *
     * @param Model $model
     */
    public static function model()
    {
        return Actions::class;
    }

    public function sendEmail($attribute)
    {
        $mail = EmailSMTPSettings::where('isDefault', 1)->first();

        if ($mail) {
            $config = array(
                'driver'     => 'smtp',
                'host'       => $mail->host,
                'port'       => $mail->port,
                'from'       => array('address' => $mail->userName, 'name' => $mail->userName),
                'encryption' => $mail->isEnableSSL ? 'ssl' : '',
                'username'   => $mail->userName,
                'password'   => $mail->password,
                'sendmail'   => '/usr/sbin/sendmail -bs',
                'pretend'    => false,
            );
            Config::set(
                'mail',
                $config
            );

            Mail::send([], [], function ($message) use ($attribute, $mail) {
                $message
                    ->from($mail->userName)
                    ->to($attribute['to_address'])
                    ->subject($attribute['subject'])
                    ->html($attribute['message']);

                if ($attribute['path'] != null) {
                    $message->attach(
                        $attribute['path'],
                        array(
                            'as' => $attribute['file_name'], // If you want you can chnage original name to custom name
                            'mime' => $attribute['mime_type']
                        )
                    );
                }
            });
        }
    }
}
