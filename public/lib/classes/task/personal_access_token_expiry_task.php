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

use core\api\entity\api_token_entity;
use core\api\repository\api_token_repository;
use core\api\token_manager;
use core\output\html_writer;
use core\url;

/**
 * Tells owners once when a personal access token is about to expire, and once when it has.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class personal_access_token_expiry_task extends scheduled_task {
    #[\Override]
    public function get_name(): string {
        return get_string('taskpersonalaccesstokenexpiry', 'admin');
    }

    #[\Override]
    public function execute(): void {
        $repository = \core\di::get(api_token_repository::class);

        $this->notify_owners(
            $repository->get_tokens_to_warn(),
            'pat_expiringnotice',
            fn(int $tokenid) => $repository->mark_expiry_warned($tokenid),
        );
        $this->notify_owners(
            $repository->get_expired_tokens_to_notify(),
            'pat_expirednotice',
            fn(int $tokenid) => $repository->mark_expired_notified($tokenid),
        );
    }

    /**
     * Send one notice per token to its owner, then mark the token as notified.
     *
     * @param api_token_entity[] $tokens The tokens to send a notice about.
     * @param string $stringprefix The prefix of the notice's subject, message and action strings.
     * @param callable $mark Records that a token's notice has been dealt with, given its id.
     * @return void
     */
    protected function notify_owners(array $tokens, string $stringprefix, callable $mark): void {
        global $DB, $PAGE, $SITE;

        if (empty($tokens)) {
            return;
        }

        $userids = array_unique(array_map(fn(api_token_entity $token) => $token->get_userid(), $tokens));
        [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
        $owners = $DB->get_records_select('user', "id {$insql} AND deleted = 0 AND suspended = 0", $params);

        $tokensurl = new url('/user/personalaccesstokens.php');
        $preferencesurl = new url('/message/notificationpreferences.php');
        $sitename = format_string($SITE->fullname);
        $systemcontext = \context_system::instance();

        foreach ($tokens as $token) {
            $owner = $owners[$token->get_userid()] ?? null;

            // The message provider requires the capability too, so an owner who has lost it is
            // skipped here rather than refused by message_send() with a debugging notice.
            if ($owner && has_capability('moodle/api:createtoken', $systemcontext, $owner)) {
                // Acting as the owner puts the notice in their language and the date in their time zone.
                \core\cron::setup_user($owner);
                $output = $PAGE->get_renderer('core');
                $tokenslink = html_writer::link($tokensurl, get_string('personalaccesstokens'));
                $preferenceslink = html_writer::link($preferencesurl, get_string('notificationpreferences', 'message'));

                $message = new \core\message\message();
                $message->courseid = SITEID;
                $message->component = 'moodle';
                $message->name = 'personalaccesstokenexpiry';
                $message->userfrom = \core_user::get_noreply_user();
                $message->userto = $owner;
                $message->notification = 1;
                $message->subject = get_string("{$stringprefix}subject", 'moodle', $token->get_name());
                $message->fullmessageformat = FORMAT_HTML;
                $message->fullmessagehtml = $output->render_from_template('core/api/token_expiry_email', [
                    'logo' => $output->get_compact_logo_url(100, 100),
                    'sitename' => $sitename,
                    'greeting' => get_string('pat_noticegreeting', 'moodle', $owner->firstname),
                    'message' => get_string("{$stringprefix}message", 'moodle', (object) [
                        'name' => s($token->get_name()),
                        'sitename' => $sitename,
                    ]),
                    'expiry' => token_manager::format_datetime($token->get_expirytime()),
                    'action' => get_string("{$stringprefix}action", 'moodle', $tokenslink),
                    'footer' => get_string('pat_noticefooter', 'moodle', $preferenceslink),
                ]);
                $message->fullmessage = html_to_text($message->fullmessagehtml);
                $message->smallmessage = $message->subject;
                $message->contexturl = $tokensurl->out(false);
                $message->contexturlname = get_string('personalaccesstokens');

                message_send($message);
            }

            // Marked even when there is no one to tell, so a suspended owner's token is not looked
            // at again on every run. Marked after sending, so a failed run repeats a notice rather
            // than losing one.
            $mark($token->get_id());
        }

        \core\cron::setup_user();
    }
}
