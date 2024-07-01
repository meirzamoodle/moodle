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

namespace core\task;

/**
 * An ad hoc task checks whether the not-unique index created concurrently was successfully created.
 *
 * The task uses a throw to fail the process so that it can be re-run until the retry threshold.
 * Then, it will send a notification (web and email) so it gets noticed by the admin.
 *
 * @package    core
 * @copyright  2024 Meirza <meirza.arson@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class concurrent_notunique_index_check_task extends adhoc_task {

    public function execute() {
        global $DB;
        $dbman = $DB->get_manager();

        $customdata = $this->get_custom_data();
        $tablename = $customdata->tablename;
        $indexname = $customdata->indexname;
        $indexfields = $customdata->indexfields;

        $table = new \xmldb_table($tablename);
        $index = new \xmldb_index($indexname, XMLDB_INDEX_NOTUNIQUE, $indexfields);

        // Call throw to fail the task if the index is in progress to create.
        if (!$dbman->index_exists($table, $index)) {
            // Send a different message when it is in progress or fails to create an index.
            if ($this->get_attempts_available() <= 1) {
                $message = <<<EOF

ERROR: There was a FAILURE in creating the index for '{$indexname}' in the {$DB->get_prefix()}{$tablename} table.
You might want to consider recreating the index manually.
EOF;
            } else {
                $message = <<<EOF

INFO: The index creation process for '{$indexname}' in the {$DB->get_prefix()}{$tablename} table is still ONGOING. Please wait.
EOF;
            }
            throw new \Exception($message);
        }

        mtrace("SUCCESS: Index '{$indexname}' in the {$DB->get_prefix()}{$tablename} table has been created.");
    }
}
