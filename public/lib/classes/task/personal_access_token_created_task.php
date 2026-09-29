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

use core\api\repository\api_token_repository;
use core\event\personal_access_token_created;
use core\output\html_writer;
use core\url;

/**
 * Tells a user that a personal access token was created on their account.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class personal_access_token_created_task extends adhoc_task {
    /**
     * Queue the notice to the token's owner.
     *
     * @param personal_access_token_created $event
     * @return void
     */
    public static function observe(personal_access_token_created $event): void {
        $token = \core\di::get(api_token_repository::class)->get_by_id($event->objectid);

        $task = new self();
        $task->set_custom_data([
            'userid' => $event->relateduserid,
            'name' => $token->get_name(),
            'expirytime' => $token->get_expirytime(),
            'url' => $event->get_url()->out(false),
        ]);

        // Sent later rather than now, so nothing message output prints can reach the page.
        manager::queue_adhoc_task($task);
    }

    #[\Override]
    public function execute(): void {
        global $DB, $PAGE, $SITE;

        $notice = $this->get_custom_data();
        $owner = $DB->get_record('user', ['id' => $notice->userid, 'deleted' => 0]);

        if (!$owner) {
            return;
        }

        // Acting as the owner puts the notice in their language and the date in their time zone.
        \core\cron::setup_user($owner);

        $url = new url($notice->url);
        $linkname = get_string('personalaccesstokens');
        $sitename = format_string($SITE->fullname);
        $output = $PAGE->get_renderer('core');
        $html = $output->render_from_template('core/credential_notice_email', [
            'logo' => $output->get_compact_logo_url(100, 100),
            'sitename' => $sitename,
            'greeting' => get_string('credentialnoticegreeting', 'moodle', $owner->firstname),
            'message' => get_string('pat_creatednoticemessage', 'moodle', (object) [
                'name' => s($notice->name),
                'sitename' => $sitename,
            ]),
            'expiry' => userdate($notice->expirytime, get_string('strftimedatetime', 'langconfig')),
            'action' => get_string('pat_creatednoticeaction', 'moodle', html_writer::link($url, $linkname)),
            'footer' => get_string('credentialnoticefooter'),
        ]);

        $message = new \core\message\message();
        $message->courseid = SITEID;
        $message->component = 'moodle';
        $message->name = 'personalaccesstokencreated';
        $message->userfrom = \core_user::get_noreply_user();
        $message->userto = $owner;
        $message->notification = 1;
        $message->subject = get_string('pat_creatednoticesubject', 'moodle', $notice->name);
        $message->fullmessageformat = FORMAT_HTML;
        $message->fullmessagehtml = $html;
        $message->fullmessage = html_to_text($html);
        $message->smallmessage = $message->subject;
        $message->contexturl = $url->out(false);
        $message->contexturlname = $linkname;

        message_send($message);

        \core\cron::setup_user();
    }
}
