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

namespace core\router\response;

use core\exception\field_errors_exception;
use core\router\schema\objects\field_errors_problem_schema;
use core\router\schema\objects\schema_object;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Adds the errors of a field_errors_exception to a problem response.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
trait field_errors_response_trait {
    /**
     * Get the response schema, with the errors extension member.
     *
     * @return schema_object
     */
    #[\Override]
    protected static function get_response_schema(): schema_object {
        return new field_errors_problem_schema();
    }

    /**
     * Get the response payload data, with the errors of the exception added.
     *
     * @param \Exception $exception
     * @param ServerRequestInterface $request
     * @return array
     */
    #[\Override]
    protected static function get_response_payload(
        \Exception $exception,
        ServerRequestInterface $request,
    ): array {
        $data = parent::get_response_payload($exception, $request);
        if ($exception instanceof field_errors_exception) {
            $data['errors'] = $exception->errors;
        }

        return $data;
    }
}
