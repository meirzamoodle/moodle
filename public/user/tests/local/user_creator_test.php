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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace core_user\local;

use core\exception\conflict_exception;
use core\exception\field_errors_exception;
use core\exception\unprocessable_entity_exception;

/**
 * Tests for the user creator.
 *
 * @package    core_user
 * @category   test
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(user_creator::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(credential_provisioner::class)]
final class user_creator_test extends \advanced_testcase {
    /** @var array A valid request with an explicit password */
    private const REQUEST = [
        'username' => 'alice',
        'firstName' => 'Alice',
        'lastName' => 'Anderson',
        'email' => 'alice@example.com',
        'password' => 'Secret-Pass-1',
    ];

    #[\Override]
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
    }

    /**
     * Create a user from the request.
     *
     * @param array $data
     * @return array The receipt
     */
    private function create(array $data): array {
        return \core\di::get(user_creator::class)->create($data);
    }

    /**
     * Get the problems reported by the exception thrown when creating a user from the request.
     *
     * @param array $data
     * @param string $classname The exception expected
     * @return string[] Each problem as field:code
     */
    private function get_problems(array $data, string $classname = unprocessable_entity_exception::class): array {
        try {
            $this->create($data);
        } catch (field_errors_exception $e) {
            $this->assertInstanceOf($classname, $e);
            return array_map(fn (array $error): string => "{$error['pointer']}:{$error['code']}", $e->errors);
        }
        $this->fail('Expected the request to be rejected');
    }

    public function test_explicit_password_with_defaults(): void {
        global $CFG, $DB;

        $events = $this->redirectEvents();
        $emails = $this->redirectEmails();

        $receipt = $this->create(self::REQUEST);

        $user = $DB->get_record('user', ['id' => $receipt['id']]);
        $this->assertSame(['id' => (int) $user->id, 'username' => 'alice'], $receipt);
        $this->assertEquals(
            ['auth' => 'manual', 'confirmed' => 1, 'suspended' => 0, 'mnethostid' => $CFG->mnet_localhost_id, 'timezone' => '99'],
            array_intersect_key((array) $user, array_flip(['auth', 'confirmed', 'suspended', 'mnethostid', 'timezone'])),
        );
        $this->assertTrue(validate_internal_user_password($user, 'Secret-Pass-1'));
        $this->assertNull(get_user_preferences('auth_forcepasswordchange', null, $user));
        $this->assertSame(0, $emails->count());

        $created = array_values(array_filter($events->get_events(), fn ($e) => $e instanceof \core\event\user_created));
        $this->assertCount(1, $created);
        $this->assertEquals($user->id, $created[0]->objectid);
    }

    public function test_all_fields_are_saved(): void {
        global $DB;

        $receipt = $this->create(self::REQUEST + [
            'idnumber' => 'A-1',
            'firstNamePhonetic' => 'Al',
            'lastNamePhonetic' => 'An',
            'middleName' => 'Beth',
            'alternateName' => 'Ally',
            'language' => 'en',
            'confirmed' => false,
            'suspended' => true,
            'profileImageAlt' => 'A smiling face',
            'timeZonePreference' => 'Australia/Perth',
            'profile' => [
                'city' => 'Perth',
                'country' => 'AU',
                'institution' => 'Moodle',
                'department' => 'Engineering',
                'address' => '1 Main Street',
                'description' => 'Hello',
                'phone' => '0123',
                'mobilePhone' => '0456',
            ],
        ]);

        $this->assertEquals([
            'idnumber' => 'A-1',
            'firstnamephonetic' => 'Al',
            'lastnamephonetic' => 'An',
            'middlename' => 'Beth',
            'alternatename' => 'Ally',
            'lang' => 'en',
            'confirmed' => 0,
            'suspended' => 1,
            'imagealt' => 'A smiling face',
            'timezone' => 'Australia/Perth',
            'city' => 'Perth',
            'country' => 'AU',
            'institution' => 'Moodle',
            'department' => 'Engineering',
            'address' => '1 Main Street',
            'description' => 'Hello',
            'phone1' => '0123',
            'phone2' => '0456',
        ], (array) $DB->get_record('user', ['id' => $receipt['id']], implode(',', [
            'idnumber', 'firstnamephonetic', 'lastnamephonetic', 'middlename', 'alternatename', 'lang', 'confirmed',
            'suspended', 'imagealt', 'timezone', 'city', 'country', 'institution', 'department', 'address', 'description',
            'phone1', 'phone2',
        ])));
    }

    public function test_timezone_preference_survives_forced_timezone(): void {
        global $DB;

        set_config('forcetimezone', 'Europe/London');

        $receipt = $this->create(self::REQUEST + ['timeZonePreference' => 'Australia/Perth']);

        $this->assertSame('Australia/Perth', $DB->get_field('user', 'timezone', ['id' => $receipt['id']]));
    }

    public function test_explicit_null_timezone_is_server_default(): void {
        global $DB;

        $receipt = $this->create(self::REQUEST + ['timeZonePreference' => null]);

        $this->assertSame('99', $DB->get_field('user', 'timezone', ['id' => $receipt['id']]));
    }

    public function test_generated_password_is_emailed(): void {
        global $DB;

        $emails = $this->redirectEmails();
        $request = self::REQUEST;
        unset($request['password']);

        $receipt = $this->create($request + ['generatePassword' => true]);

        $user = $DB->get_record('user', ['id' => $receipt['id']]);
        $this->assertSame('sent', $receipt['credentialEmailStatus']);
        $this->assertSame(1, $emails->count());
        $this->assertSame('alice@example.com', $emails->get_messages()[0]->to);
        $this->assertNotEmpty($user->password);
        $this->assertEquals(1, get_user_preferences('auth_forcepasswordchange', null, $user));
    }

    public function test_generated_password_without_email(): void {
        global $DB;

        $emails = $this->redirectEmails();
        $request = self::REQUEST;
        unset($request['password']);

        $receipt = $this->create($request + ['generatePassword' => true, 'sendPasswordEmail' => false]);

        $user = $DB->get_record('user', ['id' => $receipt['id']]);
        $this->assertSame('notRequested', $receipt['credentialEmailStatus']);
        $this->assertSame(0, $emails->count());
        $this->assertNotEmpty($user->password);
        $this->assertEquals(1, get_user_preferences('auth_forcepasswordchange', null, $user));
    }

    public function test_email_failure_keeps_the_account(): void {
        global $DB;

        $this->redirectHook(
            \core\hook\email\before_email_to_user::class,
            fn ($hook) => $hook->email->add_block_reason('Testing a failure'),
        );
        $request = self::REQUEST;
        unset($request['password']);

        $receipt = $this->create($request + ['generatePassword' => true]);
        $this->assertDebuggingCalled();

        $this->assertSame('failed', $receipt['credentialEmailStatus']);
        $this->assertTrue($DB->record_exists('user', ['id' => $receipt['id']]));
    }

    public function test_external_authentication_has_no_password(): void {
        global $DB;

        $request = self::REQUEST;
        unset($request['password']);

        $receipt = $this->create($request + ['authenticationMethod' => 'ldap']);

        $this->assertSame(AUTH_PASSWORD_NOT_CACHED, $DB->get_field('user', 'password', ['id' => $receipt['id']]));
    }

    /**
     * Credential combinations which are rejected.
     *
     * @return array
     */
    public static function invalid_credentials_provider(): array {
        $request = self::REQUEST;
        unset($request['password']);

        return [
            'Both password options' => [self::REQUEST + ['generatePassword' => true], ['#/generatePassword:passwordconflict']],
            'No password' => [$request, ['#/password:passwordrequired']],
            'Explicit false generation and no password' => [
                $request + ['generatePassword' => false],
                ['#/password:passwordrequired'],
            ],
            'Email without generation' => [
                self::REQUEST + ['sendPasswordEmail' => true],
                ['#/sendPasswordEmail:sendpasswordemailnotgenerated'],
            ],
            'Password for external authentication' => [
                self::REQUEST + ['authenticationMethod' => 'ldap'],
                ['#/password:passwordnotsupported'],
            ],
            'Generation for external authentication' => [
                $request + ['authenticationMethod' => 'ldap', 'generatePassword' => true],
                ['#/generatePassword:passwordnotsupported'],
            ],
            'Password policy' => [['password' => 'a'] + self::REQUEST, ['#/password:invalidpasswordpolicy']],
        ];
    }

    /**
     * Credential combinations are rejected.
     *
     * @param array $request
     * @param string[] $expected
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('invalid_credentials_provider')]
    public function test_invalid_credentials(array $request, array $expected): void {
        $this->assertSame($expected, $this->get_problems($request));
    }

    public function test_invalid_values(): void {
        global $DB;

        $this->assertSame([
            '#/idnumber:invalidvalue',
            '#/language:invalidvalue',
            '#/authenticationMethod:invalidvalue',
            '#/timeZonePreference:invalidvalue',
            '#/profile/country:invalidvalue',
        ], $this->get_problems([
            'idnumber' => str_repeat('x', 256),
            'language' => 'xx',
            'authenticationMethod' => 'mnet',
            'timeZonePreference' => '99',
            'profile' => ['country' => 'ZZ'],
        ] + self::REQUEST));
        $this->assertFalse($DB->record_exists('user', ['username' => 'alice']));
    }

    public function test_unknown_timezone_is_rejected(): void {
        $this->assertSame(
            ['#/timeZonePreference:invalidvalue'],
            $this->get_problems(self::REQUEST + ['timeZonePreference' => 'Mars/Olympus_Mons']),
        );
    }

    public function test_username_and_email_conflicts(): void {
        $this->getDataGenerator()->create_user(['username' => 'alice', 'email' => 'Alice@Example.com']);

        $this->assertSame(
            ['#/username:usernameexists', '#/email:emailexists'],
            $this->get_problems(self::REQUEST, conflict_exception::class),
        );
    }

    public function test_duplicate_email_allowed_by_site_policy(): void {
        set_config('allowaccountssameemail', 1);
        $this->getDataGenerator()->create_user(['email' => 'alice@example.com']);

        $this->assertSame('alice', $this->create(self::REQUEST)['username']);
    }

    public function test_failure_leaves_no_account(): void {
        global $DB;

        // The test must not run inside a transaction of its own, or the rollback cannot be seen.
        $this->preventResetByRollback();
        $provisioner = $this->getMockBuilder(credential_provisioner::class)
            ->setConstructorArgs([\core\di::get(\core\authentication::class), \core\di::get(\core\authentication\password::class)])
            ->onlyMethods(['after_insert'])
            ->getMock();
        $provisioner->method('after_insert')->willThrowException(new \RuntimeException('Failure after saving'));
        \core\di::set(credential_provisioner::class, $provisioner);

        try {
            $this->create(self::REQUEST + ['profile' => ['city' => 'Perth']]);
            $this->fail('Expected the failure to be thrown');
        } catch (\RuntimeException $e) {
            $this->assertSame('Failure after saving', $e->getMessage());
        }

        $this->assertFalse($DB->record_exists('user', ['username' => 'alice']));
    }
}
