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

namespace core_user\route\schema;

use core\exception\unprocessable_entity_exception;
use core\router\schema\specification;

/**
 * Tests for the UserCreation request schema.
 *
 * @package    core_user
 * @category   test
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(user_creation::class)]
final class user_creation_test extends \advanced_testcase {
    /** @var array The smallest valid request */
    private const MINIMAL = [
        'username' => 'alice',
        'firstName' => 'Alice',
        'lastName' => 'Anderson',
        'email' => 'alice@example.com',
    ];

    /**
     * Get the problems raised when validating the data.
     *
     * @param array $data
     * @return array
     */
    private function get_errors(array $data): array {
        try {
            (new user_creation())->validate_data($data);
        } catch (unprocessable_entity_exception $e) {
            return array_map(fn (array $error): string => "{$error['pointer']}:{$error['code']}", $e->errors);
        }
        $this->fail('Expected the data to be rejected');
    }

    public function test_valid_data_is_returned(): void {
        $data = self::MINIMAL + [
            'confirmed' => false,
            'suspended' => false,
            'timeZonePreference' => null,
            'profile' => ['city' => 'Perth', 'phone' => '0123'],
        ];

        $this->assertSame($data, (new user_creation())->validate_data($data));
    }

    public function test_missing_required_fields(): void {
        $this->assertSame(['#/firstName:missingfield', '#/email:missingfield'], $this->get_errors([
            'username' => 'alice',
            'lastName' => 'Anderson',
        ]));
    }

    public function test_unknown_and_read_only_fields(): void {
        $readonly = ['id', 'fullName', 'profileImageUrl', 'profileImageUrlSmall', 'timeZone', 'deleted', 'customFields'];
        $this->assertSame(
            [...array_map(fn (string $field): string => "#/{$field}:unknownfield", $readonly), '#/profile/fax:unknownfield'],
            $this->get_errors(self::MINIMAL + array_fill_keys($readonly, 'x') + ['profile' => ['fax' => '123']]),
        );
    }

    public function test_invalid_values(): void {
        $this->assertSame(
            ['#/username:invalidvalue', '#/firstName:invalidvalue', '#/confirmed:invalidvalue', '#/suspended:invalidvalue',
                '#/profile:invalidvalue'],
            $this->get_errors([
                'username' => 'Not Valid',
                'firstName' => ['Alice'],
                'confirmed' => 'maybe',
                'suspended' => null,
                'profile' => 'Perth',
            ] + self::MINIMAL),
        );
    }

    public function test_openapi_contract(): void {
        $spec = new specification();
        $schema = new user_creation();

        $data = $schema->get_openapi_description($spec);

        $this->assertSame(['username', 'firstName', 'lastName', 'email'], $data->required);
        $this->assertFalse($data->additionalProperties);
        $this->assertFalse($data->properties->profile->additionalProperties);
        $this->assertSame(['string', 'null'], $data->properties->timeZonePreference->type);
        $this->assertTrue($data->properties->password->writeOnly);
        $this->assertSame('manual', $data->properties->authenticationMethod->default);
        $this->assertFalse($data->properties->generatePassword->default);
    }
}
