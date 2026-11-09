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

namespace core_user\route\requests;

use core\router\schema\example;
use core\router\schema\request_body;
use core\router\schema\response\content\payload_response_type;
use core_user\route\schema\user_creation;

/**
 * The request body to create a user.
 *
 * @package    core_user
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class user_creation_request extends request_body {
    /**
     * Constructor.
     */
    public function __construct() {
        $required = ['username' => 'alice', 'firstName' => 'Alice', 'lastName' => 'Anderson', 'email' => 'alice@example.com'];

        parent::__construct(
            description: 'The account to create, with any initial standard profile values.',
            required: true,
            content: new payload_response_type(
                schema: new user_creation(),
                examples: [
                    new example(
                        name: 'explicitPassword',
                        summary: 'An account with a password chosen by the client',
                        value: $required + ['password' => 'Secret-Pass-1'],
                    ),
                    new example(
                        name: 'externalAuthentication',
                        summary: 'An account which authenticates elsewhere, so has no Moodle password',
                        value: $required + ['authenticationMethod' => 'ldap'],
                    ),
                    new example(
                        name: 'generatedPasswordWithProfile',
                        summary: 'A generated password emailed to the user, with standard profile values',
                        value: $required + [
                            'generatePassword' => true,
                            'profile' => [
                                'city' => 'Perth',
                                'country' => 'AU',
                                'institution' => 'Moodle',
                                'department' => 'Engineering',
                                'phone' => '+61 8 0000 0000',
                                'mobilePhone' => '+61 400 000 000',
                            ],
                        ],
                    ),
                    new example(
                        name: 'noEmailProvisioning',
                        summary: 'A generated password which is not emailed',
                        description: 'The user must reset their password before they can log in.',
                        value: $required + ['generatePassword' => true, 'sendPasswordEmail' => false],
                    ),
                    new example(
                        name: 'additionalFields',
                        summary: 'Additional names, identifiers and account flags',
                        value: $required + [
                            'password' => 'Secret-Pass-1',
                            'idnumber' => 'EMP-0042',
                            'firstNamePhonetic' => 'Ah-lis',
                            'lastNamePhonetic' => 'An-der-son',
                            'middleName' => 'Beth',
                            'alternateName' => 'Ally',
                            'language' => 'en',
                            'profileImageAlt' => 'Alice smiling',
                            'timeZonePreference' => 'Australia/Perth',
                            'confirmed' => true,
                            'suspended' => false,
                        ],
                    ),
                    new example(
                        name: 'serverDefaultTimeZone',
                        summary: 'An account which follows the server timezone',
                        value: $required + ['password' => 'Secret-Pass-1', 'timeZonePreference' => null],
                    ),
                ],
            ),
        );
    }
}
