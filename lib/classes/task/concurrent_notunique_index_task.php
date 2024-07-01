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
 * Adhoc task that performs create not-unique index concurrently.
 *
 * @package    core
 * @copyright  2024 Meirza <meirza.arson@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class concurrent_notunique_index_task extends adhoc_task {

    public function execute() {
        global $DB;

        $customdata = $this->get_custom_data();
        $query = $customdata->sqlarr;
        $tablename = $customdata->tablename;
        $indexname = $customdata->indexname;
        $indexfields = $customdata->indexfields;

        $ignoretransaction = false;

        // Not all concurrent index creation can be performed within a transaction block, like PostgreSQL.
        // Therefore, we need to add a condition that the query will not executed within the transaction.
        if (method_exists($DB, 'set_ignore_transaction')) {
            // Get the current state of the ignoretransaction property.
            $ignoretransaction = $DB->get_ignore_transaction();

            $DB->set_ignore_transaction(true);
        }

        try {
            $DB->change_database_structure($query);
        } catch (\ddl_change_structure_exception $e) {
            // There could be a problem with the index length related to the row format of the table.
            // If we are using utf8mb4 and the row format is 'compact' or 'redundant' then we need to change it over to
            // 'compressed' or 'dynamic'.
            if (method_exists($DB, 'convert_table_row_format')) {
                $DB->convert_table_row_format($tablename);
                $DB->change_database_structure($query);
            } else {
                // It's some other problem that we are currently not handling.
                throw $e;
            }
        }

        // Returning back to the previous state.
        if (method_exists($DB, 'set_ignore_transaction')) {
            $DB->set_ignore_transaction($ignoretransaction);
        }

        // Create an index check task to adhoc.
        $task = new \core\task\concurrent_notunique_index_check_task();
        $data = [
            "tablename" => $tablename,
            "indexname" => $indexname,
            "indexfields" => $indexfields,
        ];
        $task->set_custom_data($data);
        \core\task\manager::queue_adhoc_task($task, true);
    }
}
