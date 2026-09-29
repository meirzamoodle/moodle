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

use core\url;

/**
 * Fired when a personal access token is created for a user.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class personal_access_token_created extends base {
    #[\Override]
    protected function init() {
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_OTHER;
        $this->data['objecttable'] = 'rest_api_tokens';
    }

    #[\Override]
    public static function get_name() {
        return get_string('eventpersonalaccesstokencreated');
    }

    #[\Override]
    public function get_description() {
        return "The user with id '{$this->userid}' created the personal access token with id '{$this->objectid}' " .
            "for the user with id '{$this->relateduserid}'.";
    }

    #[\Override]
    public function get_url() {
        return new url('/user/personalaccesstokens.php');
    }

    #[\Override]
    protected function validate_data() {
        parent::validate_data();

        if (!isset($this->relateduserid)) {
            throw new \coding_exception('The \'relateduserid\' must be set.');
        }
    }

    #[\Override]
    public static function get_objectid_mapping() {
        return ['db' => 'rest_api_tokens', 'restore' => base::NOT_MAPPED];
    }

    #[\Override]
    public static function get_other_mapping() {
        return false;
    }
}
