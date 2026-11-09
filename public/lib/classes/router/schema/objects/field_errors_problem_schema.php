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

namespace core\router\schema\objects;

use core\param;

/**
 * A problem response which also lists the request fields that caused the problem.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class field_errors_problem_schema extends problem_response_schema {
    /**
     * Constructor.
     *
     * @param mixed[] ...$extra
     */
    public function __construct(...$extra) {
        parent::__construct(...$extra);

        // An extension member, as in the RFC 9457 validation error example.
        $this->content['errors'] = new array_of_items(
            itemtype: new schema_object(
                content: [
                    'pointer' => new scalar_type(
                        param::RAW,
                        description: 'A JSON Pointer, in URI fragment form, to the request member.',
                    ),
                    'code' => new scalar_type(param::ALPHANUM, description: 'A machine-readable problem code.'),
                    'detail' => new scalar_type(param::RAW, description: 'A human-readable explanation.'),
                ],
            ),
        );
    }
}
