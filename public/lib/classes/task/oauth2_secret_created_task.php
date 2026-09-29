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

use core\event\oauth2_server_client_secret_created;
use core\oauth2\server\client_manager;
use core\output\html_writer;
use core\url;

/**
 * Tells everyone who can manage OAuth 2 clients that a client secret was created.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class oauth2_secret_created_task extends adhoc_task {
    /**
     * Queue the notice to everyone who can manage OAuth 2 clients, including whoever created the secret.
     *
     * @param oauth2_server_client_secret_created $event
     * @return void
     */
    public static function observe(oauth2_server_client_secret_created $event): void {
        global $DB;

        $client = \core\di::get(client_manager::class)->get_client_by_id($event->other['clientid']);

        // Site admins pass every capability check without holding a role, so they are not in the
        // capability query and have to be added to it.
        $capability = 'moodle/site:manageoauth2clients';
        $recipients = get_admins() + get_users_by_capability(\core\context\system::instance(), $capability, 'u.id');

        $task = new self();
        $task->set_custom_data([
            'recipientids' => array_keys($recipients),
            'creatorid' => $event->userid,
            'name' => $client->getName(),
            'expirytime' => $DB->get_field('oauth2_server_client_secrets', 'expirytime', ['id' => $event->objectid]),
            'url' => $event->get_url()->out(false),
        ]);

        // Sent later rather than now: anything message output prints would corrupt the JSON
        // response of the route that creates secrets.
        manager::queue_adhoc_task($task);
    }

    #[\Override]
    public function execute(): void {
        global $DB, $PAGE, $SITE;

        $notice = $this->get_custom_data();
        [$insql, $params] = $DB->get_in_or_equal($notice->recipientids, SQL_PARAMS_NAMED);
        $recipients = $DB->get_records_select('user', "id {$insql} AND deleted = 0", $params);

        // Nobody is logged in when a script creates the secret, so there may be no creator to name.
        $creator = \core_user::get_user($notice->creatorid);
        $url = new url($notice->url);
        $sitename = format_string($SITE->fullname);

        foreach ($recipients as $recipient) {
            // Acting as the recipient puts the notice in their language and the date in their time zone.
            \core\cron::setup_user($recipient);

            $linkname = get_string('oauth2server_managesecrets', 'admin');
            $output = $PAGE->get_renderer('core');
            $html = $output->render_from_template('core/credential_notice_email', [
                'logo' => $output->get_compact_logo_url(100, 100),
                'sitename' => $sitename,
                'greeting' => get_string('credentialnoticegreeting', 'moodle', $recipient->firstname),
                'message' => get_string('oauth2server_secretcreatednoticemessage', 'admin', (object) [
                    'creator' => s($creator ? fullname($creator) : get_string('unknownuser', 'message')),
                    'name' => s($notice->name),
                    'sitename' => $sitename,
                ]),
                'expiry' => userdate($notice->expirytime, get_string('strftimedatetime', 'langconfig')),
                'action' => get_string('oauth2server_secretcreatednoticeaction', 'admin', html_writer::link($url, $linkname)),
                'footer' => get_string('credentialnoticefooter'),
            ]);

            $message = new \core\message\message();
            $message->courseid = SITEID;
            $message->component = 'moodle';
            $message->name = 'oauth2clientsecretcreated';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = $recipient;
            $message->notification = 1;
            $message->subject = get_string('oauth2server_secretcreatednoticesubject', 'admin', $notice->name);
            $message->fullmessageformat = FORMAT_HTML;
            $message->fullmessagehtml = $html;
            $message->fullmessage = html_to_text($html);
            $message->smallmessage = $message->subject;
            $message->contexturl = $url->out(false);
            $message->contexturlname = $linkname;

            message_send($message);
        }

        \core\cron::setup_user();
    }
}
