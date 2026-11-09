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
use core\param;
use core\router\schema\objects\array_of_items;
use core\router\schema\objects\scalar_type;
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
     * Get the members of the response schema, with the errors extension member added.
     *
     * @return \core\router\schema\objects\type_base[]
     */
    #[\Override]
    protected static function get_response_schema_content(): array {
        return parent::get_response_schema_content() + [
            // An extension member, as in the RFC 9457 validation error example.
            'errors' => new array_of_items(
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
            ),
        ];
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
