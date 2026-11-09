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

namespace core_user\route\responses;

use core\router\schema\parameters\location;
use core\router\schema\response\content\payload_response_type;
use core_user\route\schema\user_creation_receipt;

/**
 * The response for a newly created user.
 *
 * @package    core_user
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class user_creation_receipt_response extends \core\router\schema\response\response {
    /**
     * Constructor.
     */
    public function __construct() {
        parent::__construct(
            statuscode: 201,
            description: 'The user was created. Fetch the user from the Location URL to get its full representation.',
            headers: [new location()],
            content: new payload_response_type(
                schema: new user_creation_receipt(),
            ),
        );
    }
}
