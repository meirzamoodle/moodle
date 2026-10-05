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

namespace core\event;

use core_admin\route\controller\oauth2\server\client_management;

/**
 * Fired when a secret is created for an OAuth 2 server client.
 *
 * @property-read array $other {
 *      - int clientid: The id of the client the secret belongs to.
 * }
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class oauth2_server_client_secret_created extends base {
    #[\Override]
    protected function init() {
        $this->context = \core\context\system::instance();
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_OTHER;
        $this->data['objecttable'] = 'oauth2_server_client_secrets';
    }

    #[\Override]
    public static function get_name() {
        return get_string('eventoauth2serverclientsecretcreated');
    }

    #[\Override]
    public function get_description() {
        return "The user with id '{$this->userid}' created the secret with id '{$this->objectid}' " .
            "for the OAuth 2 client with id '{$this->other['clientid']}'.";
    }

    #[\Override]
    public function get_url() {
        return \core\router\util::get_path_for_callable(
            [client_management::class, 'manage_client_secrets'],
            ['client' => $this->other['clientid']],
        );
    }

    #[\Override]
    protected function validate_data() {
        parent::validate_data();

        if (!isset($this->other['clientid'])) {
            throw new \coding_exception('The \'clientid\' value must be set in other.');
        }
    }

    #[\Override]
    public static function get_objectid_mapping() {
        return ['db' => 'oauth2_server_client_secrets', 'restore' => base::NOT_MAPPED];
    }

    #[\Override]
    public static function get_other_mapping() {
        return false;
    }
}
