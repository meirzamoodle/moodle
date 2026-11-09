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

use core\authentication;
use core\authentication\password;
use core\exception\field_errors_exception;
use stdClass;

/**
 * Applies the authentication plugin and password policy to the credentials of a new user.
 *
 * @package    core_user
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class credential_provisioner {
    /**
     * Constructor.
     *
     * @param authentication $authentication
     * @param password $password
     */
    public function __construct(
        /** @var authentication The authentication plugin manager */
        protected authentication $authentication,
        /** @var password The password policy and hashing service */
        protected password $password,
    ) {
    }

    /**
     * Get the problems with the requested credentials.
     *
     * @param stdClass $user The new user record, with a valid auth
     * @param array $data The creation request
     * @return array[] One problem entry per problem, see field_errors_exception::error()
     */
    public function validate(stdClass $user, array $data): array {
        $generate = !empty($data['generatePassword']);
        $haspassword = isset($data['password']) && $data['password'] !== '';

        $problem = null;
        if (!$this->authentication->is_internal($user->auth)) {
            if ($haspassword || $generate) {
                $problem = [$haspassword ? 'password' : 'generatePassword', 'passwordnotsupported'];
            }
        } else if ($haspassword && $generate) {
            $problem = ['generatePassword', 'passwordconflict'];
        } else if (!$haspassword && !$generate) {
            $problem = ['password', 'passwordrequired'];
        } else if ($haspassword && !$this->password->check_policy($data['password'], $errmsg, $user)) {
            $problem = ['password', 'invalidpasswordpolicy', $errmsg];
        }

        $errors = [];
        if ($problem) {
            [$field, $code] = $problem;
            $errors[] = field_errors_exception::error($code, $problem[2] ?? get_string($code, 'error'), $field);
        }
        if (array_key_exists('sendPasswordEmail', $data) && !$generate) {
            $errors[] = field_errors_exception::error(
                'sendpasswordemailnotgenerated',
                get_string('sendpasswordemailnotgenerated', 'error'),
                'sendPasswordEmail',
            );
        }

        return $errors;
    }

    /**
     * Set the password of the new user record before it is saved.
     *
     * @param stdClass $user
     * @param array $data The creation request
     * @return bool Whether the authentication plugin must store the password when the user is saved
     */
    public function prepare(stdClass $user, array $data): bool {
        if (!$this->authentication->is_internal($user->auth)) {
            $user->password = AUTH_PASSWORD_NOT_CACHED;
            return false;
        }

        if ($this->should_email($data)) {
            // The password is set when it is emailed, after the user is saved.
            $user->password = '';
            return false;
        }

        // Nobody learns a generated password which is not emailed, so the user must reset it before they can log in.
        $user->password = empty($data['generatePassword']) ? $data['password'] : $this->password->generate();
        return true;
    }

    /**
     * Apply any policy which needs the saved user, within the same transaction.
     *
     * @param stdClass $user The saved user
     * @param array $data The creation request
     */
    public function after_insert(stdClass $user, array $data): void {
        if (!empty($data['generatePassword'])) {
            set_user_preference('auth_forcepasswordchange', 1, $user->id);
        }
    }

    /**
     * Email a generated password, once the user has been committed.
     *
     * @param stdClass $user The full saved user record
     * @param array $data The creation request
     * @return string|null The credentialEmailStatus, or null if no password was generated
     */
    public function deliver(stdClass $user, array $data): ?string {
        if (empty($data['generatePassword'])) {
            return null;
        }

        if (!$this->should_email($data)) {
            return 'notRequested';
        }

        return setnew_password_and_mail($user) ? 'sent' : 'failed';
    }

    /**
     * Whether a generated password should be emailed.
     *
     * @param array $data The creation request
     * @return bool
     */
    private function should_email(array $data): bool {
        return !empty($data['generatePassword']) && ($data['sendPasswordEmail'] ?? true);
    }
}
