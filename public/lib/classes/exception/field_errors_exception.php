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
 * An exception describing one or more problems with individual fields of a request.
 *
 * @package    core
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
abstract class field_errors_exception extends moodle_exception implements response_aware_exception {
    /**
     * Constructor.
     *
     * @param array<array{pointer: string, code: string, detail: string}> $errors One entry per problem
     * @param string $errorcode The error string identifier
     */
    public function __construct(
        /** @var array<array{pointer: string, code: string, detail: string}> One entry per problem */
        public readonly array $errors,
        string $errorcode,
    ) {
        parent::__construct(errorcode: $errorcode);
    }

    /**
     * Build a single problem entry, in the shape of the RFC 9457 validation error example.
     *
     * @param string $code The machine-readable problem code
     * @param string $detail A human-readable explanation of the problem
     * @param string ...$path The names leading to the request member, for example 'profile', 'city'
     * @return array{pointer: string, code: string, detail: string}
     */
    public static function error(string $code, string $detail, string ...$path): array {
        // A JSON Pointer (RFC 6901) in URI fragment form, as the names may come from the client.
        $tokens = array_map(fn (string $name): string => rawurlencode(strtr($name, ['~' => '~0', '/' => '~1'])), $path);
        return ['pointer' => '#/' . implode('/', $tokens), 'code' => $code, 'detail' => $detail];
    }
}
