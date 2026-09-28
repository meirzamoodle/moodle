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
use core\api\token_manager;
use core\url;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for {@see personal_access_token_expiry_task}.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[CoversClass(personal_access_token_expiry_task::class)]
final class personal_access_token_expiry_task_test extends \advanced_testcase {
    /** @var int The fixed 'now' every token is minted at. */
    private const NOW = 1786000000;

    /** @var \frozen_clock The clock the task and the token code both read. */
    private \frozen_clock $clock;

    #[\Override]
    protected function setUp(): void {
        global $CFG;

        parent::setUp();
        $this->resetAfterTest();
        $this->clock = $this->mock_clock_with_frozen(self::NOW);

        // Owners hold the capability to create tokens, and the message provider requires it.
        assign_capability('moodle/api:createtoken', CAP_ALLOW, $CFG->defaultuserroleid, \context_system::instance());
    }

    /**
     * Mint a week-long token through the real manager, as the management page does.
     *
     * @param int $userid The owner.
     * @param string $name The token name.
     * @return int The token id.
     */
    private function issue_token(int $userid, string $name = 'Attendance export'): int {
        $manager = \core\di::make(token_manager::class, ['clock' => $this->clock]);
        $token = $manager->issue_token($name, $userid, ['core_grades:grade:read'], null, self::NOW + WEEKSECS);

        return \core\di::get(api_token_repository::class)->get_from_token($token)->get_id();
    }

    /**
     * Run the task and return what it sent.
     *
     * @return \stdClass[]
     */
    private function run_task(): array {
        $sink = $this->redirectMessages();
        (new personal_access_token_expiry_task())->execute();
        $messages = $sink->get_messages_by_component_and_type('moodle', 'personalaccesstokenexpiry');
        $sink->close();

        return $messages;
    }

    /**
     * Nothing is sent while a token is further from expiry than the "expiring soon" window.
     */
    public function test_no_notice_before_window(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->issue_token($user->id);

        $this->clock->set_to(self::NOW + WEEKSECS - (token_manager::EXPIRY_IMMINENT_DAYS * DAYSECS) - 1);

        $this->assertEmpty($this->run_task());
    }

    /**
     * A token inside the window warns its owner once, naming it and linking to the management page.
     */
    public function test_warns_once_inside_window(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->issue_token($user->id);

        $this->clock->set_to(self::NOW + WEEKSECS - DAYSECS);
        $messages = $this->run_task();

        $this->assertCount(1, $messages);
        $message = reset($messages);
        $this->assertEquals($user->id, $message->useridto);
        $this->assertStringContainsString('Attendance export', $message->subject);
        $this->assertStringContainsString(token_manager::format_datetime(self::NOW + WEEKSECS), $message->fullmessagehtml);
        $this->assertEquals((new url('/user/personalaccesstokens.php'))->out(false), $message->contexturl);

        $this->assertEmpty($this->run_task());
    }

    /**
     * Once a token has expired its owner is told once, with a different message to the warning.
     */
    public function test_expired_notice_sent_once_after_warning(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->issue_token($user->id);

        $this->clock->set_to(self::NOW + WEEKSECS - DAYSECS);
        $warning = $this->run_task();

        $this->clock->set_to(self::NOW + WEEKSECS);
        $expired = $this->run_task();

        $this->assertCount(1, $expired);
        $this->assertNotEquals(reset($warning)->subject, reset($expired)->subject);
        $this->assertStringContainsString('Attendance export', reset($expired)->subject);

        $this->assertEmpty($this->run_task());
    }

    /**
     * A token that lapses between two runs, never having been warned, gets only the expired notice.
     */
    public function test_expired_without_warning_sends_only_expired_notice(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->issue_token($user->id);

        $this->clock->set_to(self::NOW + WEEKSECS + DAYSECS);
        $messages = $this->run_task();

        $this->assertCount(1, $messages);
        $this->assertEmpty($this->run_task());
    }

    /**
     * Each token is its own notice, so two tokens expiring together send two.
     */
    public function test_one_notice_per_token(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->issue_token($user->id, 'First');
        $this->issue_token($user->id, 'Second');

        $this->clock->set_to(self::NOW + WEEKSECS - DAYSECS);
        $subjects = array_column($this->run_task(), 'subject');

        $this->assertCount(2, $subjects);
        $this->assertCount(1, array_filter($subjects, fn($subject) => str_contains($subject, 'First')));
        $this->assertCount(1, array_filter($subjects, fn($subject) => str_contains($subject, 'Second')));
    }

    /**
     * The token name is the owner's own text, so it is escaped in the HTML body.
     */
    public function test_token_name_is_escaped_in_html(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->issue_token($user->id, '<b>Nightly</b>');

        $this->clock->set_to(self::NOW + WEEKSECS - DAYSECS);
        $message = current($this->run_task());

        $this->assertStringContainsString('&lt;b&gt;Nightly&lt;/b&gt;', $message->fullmessagehtml);
        $this->assertStringNotContainsString('<b>Nightly</b>', $message->fullmessagehtml);
    }

    /**
     * A revoked token has already been dealt with by its owner, so it is never mentioned again.
     */
    public function test_revoked_token_is_not_notified(): void {
        $user = $this->getDataGenerator()->create_user();
        $id = $this->issue_token($user->id);
        \core\di::get(api_token_repository::class)->revoke_token($id);

        $this->clock->set_to(self::NOW + WEEKSECS - DAYSECS);
        $this->assertEmpty($this->run_task());

        $this->clock->set_to(self::NOW + WEEKSECS);
        $this->assertEmpty($this->run_task());
    }

    /**
     * An owner who can no longer create tokens cannot act on a notice, so none is sent.
     */
    public function test_owner_without_capability_is_not_notified(): void {
        global $CFG;

        $user = $this->getDataGenerator()->create_user();
        $this->issue_token($user->id);
        unassign_capability('moodle/api:createtoken', $CFG->defaultuserroleid, \context_system::instance());

        $this->clock->set_to(self::NOW + WEEKSECS - DAYSECS);

        $this->assertEmpty($this->run_task());
        // Skipped by the task, rather than refused by the message API with a debugging notice.
        $this->assertDebuggingNotCalled();
    }

    /**
     * Suspended and deleted owners are not sent anything.
     */
    public function test_inactive_owner_is_not_notified(): void {
        $suspended = $this->getDataGenerator()->create_user(['suspended' => 1]);
        $deleted = $this->getDataGenerator()->create_user();
        $this->issue_token($suspended->id);
        $this->issue_token($deleted->id);
        delete_user($deleted);

        $this->clock->set_to(self::NOW + WEEKSECS - DAYSECS);

        $this->assertEmpty($this->run_task());
    }
}
