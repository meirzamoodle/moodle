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

namespace core;

use core\api\repository\api_token_repository;
use core\exception\moodle_exception;
use core\oauth2\server\client_manager;
use core\task\adhoc_task;
use core\task\manager;
use core\task\oauth2_secret_created_task;
use core\task\personal_access_token_created_task;

/**
 * Queues a notice to the people responsible for a credential when it is created.
 *
 * The notices are sent later from ad hoc tasks rather than during the request: anything message
 * output prints would corrupt the JSON response of the route that creates secrets.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class credential_observer {
    /**
     * Queue the notice to the owner of a new personal access token.
     *
     * @param event\personal_access_token_created $event
     * @return void
     */
    public static function personal_access_token_created(event\personal_access_token_created $event): void {
        $token = di::get(api_token_repository::class)->get_by_id($event->objectid);

        $task = new personal_access_token_created_task();
        $task->set_custom_data([
            'name' => $token->get_name(),
            'expirytime' => $token->get_expirytime(),
            'url' => $event->get_url()->out(false),
        ]);
        self::queue_as($task, $event->relateduserid);
    }

    /**
     * Queue a notice to each person who can manage OAuth 2 clients, including whoever created the secret.
     *
     * @param event\oauth2_server_client_secret_created $event
     * @return void
     */
    public static function oauth2_server_client_secret_created(event\oauth2_server_client_secret_created $event): void {
        global $DB;

        $client = di::get(client_manager::class)->get_client_by_id($event->other['clientid']);
        $notice = [
            'creatorid' => $event->userid,
            'name' => $client->getName(),
            'expirytime' => $DB->get_field('oauth2_server_client_secrets', 'expirytime', ['id' => $event->objectid]),
            'url' => $event->get_url()->out(false),
        ];

        // Site admins pass every capability check without holding a role, so they are not in the
        // capability query and have to be added to it.
        $capability = 'moodle/site:manageoauth2clients';
        $recipients = get_admins() + get_users_by_capability(context\system::instance(), $capability, 'u.id');

        foreach (array_keys($recipients) as $userid) {
            $task = new oauth2_secret_created_task();
            $task->set_custom_data($notice);
            self::queue_as($task, $userid);
        }
    }

    /**
     * Queue a notice task to run as its recipient, skipping a recipient cron cannot act as.
     *
     * @param adhoc_task $task The notice task.
     * @param int $userid The recipient.
     * @return void
     */
    protected static function queue_as(adhoc_task $task, int $userid): void {
        $task->set_userid($userid);

        try {
            manager::queue_adhoc_task($task);
        } catch (moodle_exception $e) {
            // Queueing refuses a user cron could not run the task as, such as a suspended one. Only
            // that recipient is skipped, not everyone after them.
            return;
        }
    }
}
