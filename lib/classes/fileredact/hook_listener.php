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

namespace core\fileredact;

use core\hook\filestorage\before_file_created;
use core\fileredact\manager;

/**
 * Allow the plugin to call as soon as possible before the file is created.
 *
 * @package   core
 * @copyright Meirza <meirza.arson@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class hook_listener {
    /**
     * Execute the available services before creating the file.
     *
     * @param before_file_created $hook
     */
    public static function redact_before_file_created(before_file_created $hook): void {
        $filerecord = $hook->filerecord;
        $extra = $hook->extra;

        // The file mime-type and the pathname must be present. Otherwise, bypass the process.
        if (!isset($filerecord->mimetype) || !isset($extra['pathname'])) {
            return;
        }

        $manager = new manager($filerecord, $extra);
        $manager->execute();

        // Iterates through the errors returned by the manager and outputs each error message.
        foreach ($manager->get_errors() as $e) {
            debugging($e->getMessage());
        }
    }
}

