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

namespace local_reactdemo\route\api;

use core\param;
use core\router\require_login;
use core\router\route;
use core\router\schema\parameters\path_parameter;
use core\router\schema\response\payload_response;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Route API handler for greetings.
 *
 * Exposes: GET /api/rest/v2/local_reactdemo/greeting/{userid}
 *
 * @package    local_reactdemo
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[require_login]
class greeting {

    /**
     * Return the full name of a user as a greeting.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param int $userid
     * @return payload_response
     */
    #[route(
        path: '/greeting/{userid}',
        title: 'Get a greeting for a user',
        description: 'Returns the full name of the given user.',
        pathtypes: [
            new path_parameter(
                name: 'userid',
                type: param::INT,
                description: 'ID of the user to greet',
            ),
        ],
    )]
    public function get_greeting(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $userid,
    ): payload_response {
        global $DB;

        $user = $DB->get_record('user', ['id' => $userid], 'id, firstname, lastname, firstnamephonetic, lastnamephonetic, middlename, alternatename', MUST_EXIST);

        return new payload_response(['name' => fullname($user)], $request, $response);
    }
}
