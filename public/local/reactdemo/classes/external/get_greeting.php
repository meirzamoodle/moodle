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

declare(strict_types=1);

namespace local_reactdemo\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * External function to return a greeting for a given user.
 *
 * @package    local_reactdemo
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_greeting extends external_api {

    /**
     * Describes the parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'ID of the user to greet'),
        ]);
    }

    /**
     * Returns the full name of the user.
     *
     * @param int $userid
     * @return array{name: string}
     */
    public static function execute(int $userid): array {
        global $DB;

        ['userid' => $userid] = self::validate_parameters(self::execute_parameters(), ['userid' => $userid]);

        $user = $DB->get_record('user', ['id' => $userid], 'id, firstname, lastname, firstnamephonetic, lastnamephonetic, middlename, alternatename', MUST_EXIST);

        return ['name' => fullname($user)];
    }

    /**
     * Describes the return value.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'name' => new external_value(PARAM_TEXT, 'Full name of the user'),
        ]);
    }
}
