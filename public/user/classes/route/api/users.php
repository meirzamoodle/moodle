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

namespace core_user\route\api;

use core\current_user;
use core\exception\access_denied_exception;
use core\exception\not_found_exception;
use core\router\conditional_request;
use core\router\response\access_denied_response;
use core\router\response\conflict_response;
use core\router\response\unprocessable_entity_response;
use core\router\parameters\path_user;
use core\router\pagination_request;
use core\router\schema\response\payload_response;
use core\router\require_login;
use core\router\route;
use core\router\schema\collection;
use core\router\schema\parameters\query_parameter;
use core\router\schema\response\collection_response;
use core\router\schema\etag;
use core\router\scope\scopeset;
use core\router\util;
use core_user\local\user_creator;
use core_user\local\user_representation;
use core_user\local\user_scope_check_trait;
use core_user\local\visible_user_finder;
use core_user\route\requests\user_creation_request;
use core_user\route\responses\user_collection_response;
use core_user\route\responses\user_creation_receipt_response;
use core_user\route\responses\user_response;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * User collection API handler.
 *
 * @package    core_user
 * @copyright  Andrew Lyons <andrew@nicols.co.uk>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[route(
    path: '/users',
    requirelogin: new require_login(),
)]
class users {
    use user_scope_check_trait;

    /**
     * Constructor.
     *
     * @param visible_user_finder $finder
     * @param user_representation $representation
     * @param current_user $currentuser
     * @param user_creator $creator
     */
    public function __construct(
        /** @var visible_user_finder Finds the users which the current user can see */
        protected visible_user_finder $finder,
        /** @var user_representation Builds the representation of a user */
        protected user_representation $representation,
        /** @var current_user The user making the request */
        protected current_user $currentuser,
        /** @var user_creator Creates new users */
        protected user_creator $creator,
    ) {
    }

    /**
     * List the users which the current user is allowed to see.
     *
     * @param ResponseInterface $response
     * @param ServerRequestInterface $request
     * @return collection_response
     */
    #[route(
        title: 'List users',
        description: 'List the users visible to the current user. A token with only the read:self scope lists just the current user.',
        method: ['GET'],
        queryparams: [
            new query_parameter(
                name: 'search',
                type: \core\param::TEXT,
                description: 'Only return users whose name, or any visible identity field, contains this value.',
            ),
        ],
        responses: [
            new user_collection_response(),
        ],
    )]
    // Attributes cannot call functions. The sortable fields must match visible_user_finder::SORT_COLUMNS.
    #[collection(sortable: ['firstname', 'lastname'])]
    #[scopeset(
        new \core_user\route\scope\user\read_self(),
    )]
    #[scopeset(
        new \core_user\route\scope\user\read(),
    )]
    public function list_users(
        ResponseInterface $response,
        ServerRequestInterface $request,
    ): collection_response {
        global $PAGE;

        $PAGE->set_context(\core\context\system::instance());

        $result = $this->finder->get_page(
            pagination: pagination_request::from_request($request),
            search: trim($request->getQueryParams()['search'] ?? ''),
            onlyself: $this->is_read_limited_to_current_user($request),
        );

        $items = [];
        $courses = null;
        foreach ($result['users'] as $user) {
            $item = $this->representation->get_core_visible($user, $courses);
            if ($item !== null) {
                $items[] = $item;
            }
        }

        return new collection_response($items, $result['total'], $result['hasmore'], $request, $response);
    }

    /**
     * Fetch a single user.
     *
     * @param ResponseInterface $response
     * @param ServerRequestInterface $request
     * @param \stdClass $user
     * @return payload_response
     */
    #[route(
        path: '/{userId}',
        title: 'Fetch a user',
        description: 'Fetch the key information about one user.',
        method: ['GET'],
        pathtypes: [
            new path_user(name: 'userId'),
        ],
        responses: [
            new user_response(),
        ],
    )]
    #[etag]
    #[scopeset(
        new \core_user\route\scope\user\read_self(),
    )]
    #[scopeset(
        new \core_user\route\scope\user\read(),
    )]
    public function get_user(
        ResponseInterface $response,
        ServerRequestInterface $request,
        \stdClass $userId,
    ): payload_response {
        global $PAGE;

        $PAGE->set_context(\core\context\system::instance());

        $this->require_read_scope_for($request, $userId);

        $item = $this->representation->get_core_visible($userId);
        if ($item === null) {
            // Do not reveal the existence of users which the current user cannot see.
            throw new not_found_exception('user', (string) $userId->id);
        }

        return conditional_request::respond($request, $response, $item);
    }

    /**
     * Create a user.
     *
     * @param ResponseInterface $response
     * @param ServerRequestInterface $request
     * @return payload_response
     */
    #[route(
        title: 'Create a user',
        description: 'Create a Moodle account, with any initial standard profile values. This provisions the Moodle account'
            . ' only, and does not create an account with any external identity provider. Retrying a request which may'
            . ' have succeeded can create a second account, or fail with a conflict.',
        method: ['POST'],
        requestbody: new user_creation_request(),
        responses: [
            new user_creation_receipt_response(),
            new access_denied_response(),
            new conflict_response(),
            new unprocessable_entity_response(),
        ],
    )]
    #[scopeset(
        new \core_user\route\scope\user\create(),
    )]
    public function create_user(
        ResponseInterface $response,
        ServerRequestInterface $request,
    ): payload_response {
        global $PAGE;

        $PAGE->set_context(\core\context\system::instance());

        // The router answers a required_capability_exception with a 500, so deny access with a 403 instead.
        if (!$this->currentuser->has_capability('moodle/user:create', \core\context\system::instance())) {
            throw new access_denied_exception('nopermissions', 'error', '', get_capability_string('moodle/user:create'));
        }

        $receipt = $this->creator->create($request->getParsedBody());
        $location = util::get_path_for_callable([self::class, 'get_user'], ['userId' => $receipt['id']]);

        return new payload_response(
            $receipt,
            $request,
            $response->withStatus(201)->withHeader('Location', $location->out(false)),
        );
    }
}
