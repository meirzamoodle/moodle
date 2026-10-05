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

use core\url;

/**
 * Tells one person who can manage OAuth 2 clients that a client secret was created.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class oauth2_secret_created_task extends adhoc_task {
    #[\Override]
    public function execute(): void {
        global $SITE, $USER;

        // The task runs as the recipient, so the notice comes out in their language and time zone.
        $notice = $this->get_custom_data();
        $url = new url($notice->url);

        // Nobody is logged in when a script creates the secret, so there may be no creator to name.
        $creator = \core_user::get_user($notice->creatorid);

        $message = new \core\message\message();
        $message->courseid = SITEID;
        $message->component = 'moodle';
        $message->name = 'oauth2clientsecretcreated';
        $message->userfrom = \core_user::get_noreply_user();
        $message->userto = $USER;
        $message->notification = 1;
        $message->subject = get_string('oauth2server_secretcreatednoticesubject', 'admin', $notice->name);
        $message->fullmessageformat = FORMAT_HTML;
        $message->fullmessagehtml = get_string('oauth2server_secretcreatednoticebody', 'admin', (object) [
            'creator' => s($creator ? fullname($creator) : get_string('unknownuser', 'message')),
            'name' => s($notice->name),
            'sitename' => format_string($SITE->fullname),
            'expiry' => userdate($notice->expirytime, get_string('strftimedatetime', 'langconfig')),
            'url' => $url->out(),
        ]);
        $message->fullmessage = html_to_text($message->fullmessagehtml);
        $message->smallmessage = $message->subject;
        $message->contexturl = $url->out(false);
        $message->contexturlname = get_string('oauth2server_managesecrets', 'admin');

        message_send($message);
    }
}
