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

namespace core_user\route\schema;

use core\param;
use core\router\schema\objects\scalar_type;
use core\router\schema\objects\schema_object;
use core\router\schema\referenced_object;
use core\router\schema\specification;

/**
 * The schema of the receipt returned when a user is created. It never contains a password.
 *
 * @package    core_user
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class user_creation_receipt extends schema_object implements referenced_object {
    /**
     * Constructor.
     *
     * @param mixed[] ...$extra
     */
    public function __construct(...$extra) {
        $extra['content'] = [
            'id' => new scalar_type(param::INT),
            'username' => new scalar_type(param::USERNAME),
            'credentialEmailStatus' => new scalar_type(param::ALPHA),
        ];

        parent::__construct(...$extra);
    }

    #[\Override]
    public function get_openapi_description(
        specification $api,
        ?string $path = null,
    ): ?\stdClass {
        $data = parent::get_openapi_description($api, $path);
        $data->required = ['id', 'username'];
        // Only present when a password was generated.
        $data->properties->credentialEmailStatus->enum = ['sent', 'failed', 'notRequested'];

        return $data;
    }
}
