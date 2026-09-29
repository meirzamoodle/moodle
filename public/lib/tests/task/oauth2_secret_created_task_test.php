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

use core\di;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for {@see oauth2_secret_created_task}.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[CoversClass(oauth2_secret_created_task::class)]
final class oauth2_secret_created_task_test extends \advanced_testcase {
    /**
     * Everyone who can manage OAuth 2 clients hears about a new secret, including whoever created it.
     */
    public function test_client_secret_created_notifies_client_managers(): void {
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $manager = $generator->create_user(['firstname' => 'Maria', 'lastname' => 'Manager']);
        $generator->role_assign('manager', $manager->id, \core\context\system::instance()->id);
        $generator->create_user();
        $admin = get_admin();
        $this->setAdminUser();

        $clientmanager = di::get(\core\oauth2\server\client_manager::class);
        $client = $clientmanager->create_client(
            name: 'Reporting service',
            ownercontext: \core\context\system::instance(),
            granttypes: [\core\oauth2\server\entity\client_entity::GRANT_TYPE_CLIENT_CREDENTIALS],
        );
        $sink = $this->redirectMessages();

        $secret = $clientmanager->create_secret($client->get_id());

        // Nothing is sent during the request that created the secret, only from the queued task.
        $this->assertEmpty($sink->get_messages());
        $this->run_all_adhoc_tasks();

        $messages = $sink->get_messages_by_component_and_type('moodle', 'oauth2clientsecretcreated');
        $recipients = array_column($messages, 'useridto');
        sort($recipients);
        $this->assertEquals([$admin->id, $manager->id], $recipients);

        $secretsurl = \core\router\util::get_path_for_callable(
            [\core_admin\route\controller\oauth2\server\client_management::class, 'manage_client_secrets'],
            ['client' => $client->get_id()],
        );
        foreach ($messages as $message) {
            $this->assertStringContainsString('Reporting service', $message->subject);
            $this->assertStringContainsString(fullname($admin), $message->fullmessagehtml);
            $this->assertEquals($secretsurl->out(false), $message->contexturl);
            $this->assertStringNotContainsString($secret, json_encode($message, JSON_UNESCAPED_SLASHES));
        }
    }

    /**
     * Each admin and manager hears once, even an admin who also holds the manager role.
     */
    public function test_client_secret_created_notifies_each_recipient_once(): void {
        global $CFG;

        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $secondadmin = $generator->create_user();
        $CFG->siteadmins .= ',' . $secondadmin->id;
        $generator->role_assign('manager', $secondadmin->id, \core\context\system::instance()->id);
        $manager = $generator->create_user();
        $generator->role_assign('manager', $manager->id, \core\context\system::instance()->id);
        $this->setAdminUser();

        $clientmanager = di::get(\core\oauth2\server\client_manager::class);
        $client = $clientmanager->create_client(
            name: 'Reporting service',
            ownercontext: \core\context\system::instance(),
            granttypes: [\core\oauth2\server\entity\client_entity::GRANT_TYPE_CLIENT_CREDENTIALS],
        );
        $sink = $this->redirectMessages();

        $clientmanager->create_secret($client->get_id());
        $this->run_all_adhoc_tasks();

        $recipients = array_column($sink->get_messages_by_component_and_type('moodle', 'oauth2clientsecretcreated'), 'useridto');
        sort($recipients);
        $this->assertEquals([get_admin()->id, $secondadmin->id, $manager->id], $recipients);
    }

    /**
     * Names people can set themselves are escaped in the message body.
     */
    public function test_client_secret_created_escapes_names(): void {
        $this->resetAfterTest();
        $creator = $this->getDataGenerator()->create_user(['firstname' => 'Tom & Jerry']);
        $this->getDataGenerator()->role_assign('manager', $creator->id, \core\context\system::instance()->id);
        $this->setUser($creator);

        $clientmanager = di::get(\core\oauth2\server\client_manager::class);
        $client = $clientmanager->create_client(
            name: '<i>Reporting</i>',
            ownercontext: \core\context\system::instance(),
            granttypes: [\core\oauth2\server\entity\client_entity::GRANT_TYPE_CLIENT_CREDENTIALS],
        );
        $sink = $this->redirectMessages();

        $clientmanager->create_secret($client->get_id());
        $this->run_all_adhoc_tasks();

        $message = $sink->get_messages_by_component_and_type('moodle', 'oauth2clientsecretcreated')[0];
        $this->assertStringContainsString('Tom &amp; Jerry', $message->fullmessagehtml);
        $this->assertStringContainsString('&lt;i&gt;Reporting&lt;/i&gt;', $message->fullmessagehtml);
    }

    /**
     * A secret created with nobody logged in, as from a CLI script, is still announced.
     */
    public function test_client_secret_created_without_user_notifies_admins(): void {
        $this->resetAfterTest();
        $clientmanager = di::get(\core\oauth2\server\client_manager::class);
        $client = $clientmanager->create_client(
            name: 'Reporting service',
            ownercontext: \core\context\system::instance(),
            granttypes: [\core\oauth2\server\entity\client_entity::GRANT_TYPE_CLIENT_CREDENTIALS],
        );
        $sink = $this->redirectMessages();

        $clientmanager->create_secret($client->get_id());
        $this->run_all_adhoc_tasks();

        $messages = $sink->get_messages_by_component_and_type('moodle', 'oauth2clientsecretcreated');
        $this->assertEquals([get_admin()->id], array_values(array_column($messages, 'useridto')));
    }
}
