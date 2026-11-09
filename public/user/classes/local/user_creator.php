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

use core\dml\database_proxy;
use core\exception\conflict_exception;
use core\exception\field_errors_exception;
use core\exception\unprocessable_entity_exception;
use core_user\route\schema\user_creation;
use stdClass;

/**
 * Creates a user from a UserCreation request.
 *
 * @package    core_user
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class user_creator {
    /** @var string[] The user record property for each request field */
    private const FIELDS = [
        'username' => 'username',
        'firstName' => 'firstname',
        'lastName' => 'lastname',
        'email' => 'email',
        'idnumber' => 'idnumber',
        'firstNamePhonetic' => 'firstnamephonetic',
        'lastNamePhonetic' => 'lastnamephonetic',
        'middleName' => 'middlename',
        'alternateName' => 'alternatename',
        'language' => 'lang',
        'authenticationMethod' => 'auth',
        'confirmed' => 'confirmed',
        'suspended' => 'suspended',
        'profileImageAlt' => 'imagealt',
        'timeZonePreference' => 'timezone',
        'profile.city' => 'city',
        'profile.country' => 'country',
        'profile.institution' => 'institution',
        'profile.department' => 'department',
        'profile.address' => 'address',
        'profile.description' => 'description',
        'profile.phone' => 'phone1',
        'profile.mobilePhone' => 'phone2',
    ];

    /**
     * Constructor.
     *
     * @param database_proxy $db
     * @param credential_provisioner $credentials
     */
    public function __construct(
        /** @var database_proxy The database */
        protected database_proxy $db,
        /** @var credential_provisioner Applies the authentication and password policy */
        protected credential_provisioner $credentials,
    ) {
    }

    /**
     * Create a user.
     *
     * @param array $data A request which is valid against the UserCreation schema
     * @return array The UserCreationReceipt
     * @throws unprocessable_entity_exception If any value is not allowed
     * @throws conflict_exception If the username or email address is already in use
     */
    public function create(array $data): array {
        global $CFG;

        $data += user_creation::DEFAULTS;
        $user = $this->get_record($data);

        $errors = $this->validate($user);
        // The credential rules depend on the authentication plugin, so they can only be checked when it is valid.
        if (!in_array('#/authenticationMethod', array_column($errors, 'pointer'))) {
            $errors = array_merge($errors, $this->credentials->validate($user, $data));
        }
        if ($errors) {
            throw new unprocessable_entity_exception($errors);
        }

        $user->timezone ??= '99';
        $user->mnethostid = $CFG->mnet_localhost_id;
        // Two concurrent requests can both pass this check. The second then fails on the unique username index
        // with a 500 rather than a 409.
        $this->check_conflicts($user);

        $transaction = $this->db->start_delegated_transaction();
        try {
            $updatepassword = $this->credentials->prepare($user, $data);
            $user->id = \core\user::create_user($user, $updatepassword, false);
            $this->credentials->after_insert($user, $data);
            \core\event\user_created::create_from_userid($user->id)->trigger();
            $transaction->allow_commit();
        } catch (\Throwable $e) {
            $transaction->rollback($e);
        }

        $receipt = ['id' => (int) $user->id, 'username' => $user->username];
        $status = $this->credentials->deliver($this->db->get_record('user', ['id' => $user->id]), $data);
        if ($status !== null) {
            $receipt['credentialEmailStatus'] = $status;
        }

        return $receipt;
    }

    /**
     * Build the user record from the request.
     *
     * @param array $data
     * @return stdClass
     */
    private function get_record(array $data): stdClass {
        foreach ($data['profile'] ?? [] as $key => $value) {
            $data["profile.{$key}"] = $value;
        }

        $user = new stdClass();
        foreach (self::FIELDS as $field => $property) {
            if (array_key_exists($field, $data)) {
                $user->{$property} = $data[$field];
            }
        }
        $user->confirmed = (int) $user->confirmed;
        $user->suspended = (int) $user->suspended;

        return $user;
    }

    /**
     * Get the problems with the values of the user record.
     *
     * @param stdClass $user
     * @return array[] One problem entry per invalid field
     */
    private function validate(stdClass $user): array {
        // The same plugins as core_user_create_users: mnet users need a remote host, and webservice users are not created here.
        $auths = array_diff_key(\core_component::get_plugin_list('auth'), ['mnet' => true, 'webservice' => true]);
        $columns = $this->db->get_columns('user');

        $errors = [];
        foreach (self::FIELDS as $field => $property) {
            if (!isset($user->{$property})) {
                continue;
            }

            $value = $user->{$property};
            $valid = match ($property) {
                'auth' => array_key_exists($value, $auths),
                // The server default is chosen with null, so 99 is not an accepted name.
                'timezone' => array_key_exists($value, \core_date::get_list_of_timezones()),
                default => true,
            };
            $valid = $valid && \core\user::validate([$property => $value]) === true;
            $maxlength = $columns[$property]->max_length;
            if ($valid && is_string($value) && $maxlength > 0) {
                $valid = \core_text::strlen($value) <= $maxlength;
            }

            if (!$valid) {
                $errors[] = field_errors_exception::error(
                    'invalidvalue',
                    get_string('invalidvalue', 'error', $field),
                    ...explode('.', $field),
                );
            }
        }

        return $errors;
    }

    /**
     * Check that the username, and the email address where the site requires it, are not already in use.
     *
     * @param stdClass $user
     * @throws conflict_exception
     */
    private function check_conflicts(stdClass $user): void {
        global $CFG;

        $errors = [];
        if ($this->db->record_exists('user', ['username' => $user->username, 'mnethostid' => $user->mnethostid])) {
            $errors[] = field_errors_exception::error('usernameexists', get_string('usernameexists'), 'username');
        }

        if (empty($CFG->allowaccountssameemail)) {
            $select = $this->db->sql_equal('email', ':email', false) . ' AND mnethostid = :mnethostid';
            if ($this->db->record_exists_select('user', $select, ['email' => $user->email, 'mnethostid' => $user->mnethostid])) {
                $errors[] = field_errors_exception::error('emailexists', get_string('emailexists'), 'email');
            }
        }

        if ($errors) {
            throw new conflict_exception($errors);
        }
    }
}
