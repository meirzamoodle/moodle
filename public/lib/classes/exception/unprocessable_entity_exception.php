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

namespace core\exception;

/**
 * An exception for a well-formed request containing invalid field values.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class unprocessable_entity_exception extends field_errors_exception {
    /**
     * Constructor.
     *
     * @param array<array{pointer: string, code: string, detail: string}> $errors One entry per problem
     */
    public function __construct(array $errors) {
        parent::__construct($errors, 'unprocessableentity');
    }

    #[\Override]
    public function get_response_classname(): string {
        return \core\router\response\unprocessable_entity_response::class;
    }
}
