<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace core\task;

use core\api\token_manager;
use core\url;

/**
 * Tells a user that a personal access token was created on their account.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class personal_access_token_created_task extends adhoc_task {
    #[\Override]
    public function execute(): void {
        global $SITE, $USER;

        // The task runs as the owner, so the notice comes out in their language and time zone.
        $notice = $this->get_custom_data();
        $url = new url($notice->url);

        $message = new \core\message\message();
        $message->courseid = SITEID;
        $message->component = 'moodle';
        $message->name = 'personalaccesstokencreated';
        $message->userfrom = \core_user::get_noreply_user();
        $message->userto = $USER;
        $message->notification = 1;
        $message->subject = get_string('pat_creatednoticesubject', 'moodle', $notice->name);
        $message->fullmessageformat = FORMAT_HTML;
        $message->fullmessagehtml = get_string('pat_creatednoticebody', 'moodle', (object) [
            'name' => s($notice->name),
            'sitename' => format_string($SITE->fullname),
            'expiry' => token_manager::format_datetime($notice->expirytime),
            'url' => $url->out(),
        ]);
        $message->fullmessage = html_to_text($message->fullmessagehtml);
        $message->smallmessage = $message->subject;
        $message->contexturl = $url->out(false);
        $message->contexturlname = get_string('personalaccesstokens');

        message_send($message);
    }
}
