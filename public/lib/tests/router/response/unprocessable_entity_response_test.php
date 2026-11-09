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

use core\exception\conflict_exception;
use core\exception\field_errors_exception;
use core\exception\unprocessable_entity_exception;
use core\router\response_handler;
use core\tests\router\route_testcase;
use GuzzleHttp\Psr7\ServerRequest;

/**
 * Tests for the problem responses which carry field-level errors.
 *
 * @package    core
 * @category   test
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(unprocessable_entity_response::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(conflict_response::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(exception_response::class)]
#[\PHPUnit\Framework\Attributes\CoversTrait(field_errors_response_trait::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(field_errors_exception::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(unprocessable_entity_exception::class)]
#[\PHPUnit\Framework\Attributes\CoversClass(conflict_exception::class)]
final class unprocessable_entity_response_test extends route_testcase {
    /**
     * Each exception is answered with its own status and carries the errors in the problem body.
     *
     * @param string $classname The exception class
     * @param int $status The expected status
     */
    #[\PHPUnit\Framework\Attributes\TestWith([unprocessable_entity_exception::class, 422])]
    #[\PHPUnit\Framework\Attributes\TestWith([conflict_exception::class, 409])]
    public function test_errors_in_problem_body(string $classname, int $status): void {
        $errors = [field_errors_exception::error('invalidemail', 'Invalid email address', 'email')];
        $handler = new response_handler(\core\di::get_container());

        $response = $handler->get_response_from_exception(new ServerRequest('POST', '/example'), new $classname($errors));

        $this->assertSame($status, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        $this->assertSame($status, $payload['status']);
        $this->assertSame(
            [['pointer' => '#/email', 'code' => 'invalidemail', 'detail' => 'Invalid email address']],
            $payload['errors'],
        );
    }

    public function test_error_pointer_is_escaped(): void {
        // RFC 6901 escapes ~ and / within a name, and RFC 3986 encodes the fragment.
        $error = field_errors_exception::error('unknownfield', '', 'profile', 'a/b~c d');

        $this->assertSame('#/profile/a~1b~0c%20d', $error['pointer']);
    }

    /**
     * Only the responses for exceptions which carry errors document the errors member.
     *
     * @param string $classname The response class
     * @param bool $expected Whether the schema has the errors member
     */
    #[\PHPUnit\Framework\Attributes\TestWith([unprocessable_entity_response::class, true])]
    #[\PHPUnit\Framework\Attributes\TestWith([conflict_response::class, true])]
    #[\PHPUnit\Framework\Attributes\TestWith([not_found_response::class, false])]
    public function test_schema_documents_errors(string $classname, bool $expected): void {
        $rcm = new \ReflectionMethod($classname, 'get_response_schema');

        $this->assertSame($expected, $rcm->invoke(null)->has('errors'));
    }
}
