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

namespace local_reactpoc\local\hooks;

use context_system;
use core_user\hook\extend_user_menu as extend_user_menu_hook;
use stdClass;

/**
 * Hook listener that adds a React PoC link to the user profile dropdown.
 *
 * The link is only shown to users who hold the local/reactpoc:manage capability.
 *
 * @package    local_reactpoc
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class extend_user_menu {

    /**
     * Add the React PoC index link to the user menu.
     *
     * @param extend_user_menu_hook $hook
     */
    public static function callback(extend_user_menu_hook $hook): void {
        if (!has_capability('local/reactpoc:manage', context_system::instance())) {
            return;
        }

        $divider = new stdClass();
        $divider->itemtype = 'divider';
        $hook->add_navitem($divider);

        $item = new stdClass();
        $item->itemtype = 'link';
        $item->url = new \core\url('/local/reactpoc/index.php');
        $item->title = get_string('pluginname', 'local_reactpoc');
        $item->titleidentifier = 'pluginname,local_reactpoc';

        $hook->add_navitem($item);
    }
}
