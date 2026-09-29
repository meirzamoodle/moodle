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
use core\di;
use core\url;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for {@see personal_access_token_created_task}.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[CoversClass(personal_access_token_created_task::class)]
final class personal_access_token_created_task_test extends \advanced_testcase {
    /**
     * The owner hears about a new token on their account, and nobody else does.
     */
    public function test_token_created_notifies_owner(): void {
        $this->resetAfterTest();
        $owner = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->create_user();
        $this->setUser($owner);
        $sink = $this->redirectMessages();

        $token = di::get(token_manager::class)->issue_token(
            'Attendance export',
            $owner->id,
            ['core_admin:config:read'],
            null,
            time() + WEEKSECS,
        );
        $this->run_all_adhoc_tasks();

        $messages = $sink->get_messages_by_component_and_type('moodle', 'personalaccesstokencreated');
        $this->assertCount(1, $messages);
        $message = reset($messages);

        $this->assertEquals($owner->id, $message->useridto);
        $this->assertStringContainsString('Attendance export', $message->subject);
        $this->assertStringContainsString('Attendance export', $message->fullmessagehtml);
        $this->assertEquals((new url('/user/personalaccesstokens.php'))->out(false), $message->contexturl);

        // Neither the full token nor the secret half of it.
        [, $encoded] = explode('_', $token, 2);
        [, $secret] = explode('/', base64_decode($encoded), 2);
        $this->assertStringNotContainsString($token, json_encode($message, JSON_UNESCAPED_SLASHES));
        $this->assertStringNotContainsString($secret, json_encode($message, JSON_UNESCAPED_SLASHES));
    }

    /**
     * A token created on someone else's behalf is announced to its owner, not to its creator.
     */
    public function test_token_created_by_another_user_notifies_owner(): void {
        $this->resetAfterTest();
        $owner = $this->getDataGenerator()->create_user();
        $this->setAdminUser();
        $sink = $this->redirectMessages();

        di::get(token_manager::class)->issue_token('Sync', $owner->id, ['core_admin:config:read'], null, time() + WEEKSECS);
        $this->run_all_adhoc_tasks();

        $messages = $sink->get_messages_by_component_and_type('moodle', 'personalaccesstokencreated');
        $this->assertEquals([$owner->id], array_values(array_column($messages, 'useridto')));
    }
}
