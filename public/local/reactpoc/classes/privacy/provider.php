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

namespace local_reactpoc\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

/**
 * Privacy provider for local_reactpoc.
 *
 * @package    local_reactpoc
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider {

    /**
     * Returns metadata about the data stored by this plugin.
     *
     * @param collection $collection
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table(
            'local_reactpoc_items',
            [
                'userid'      => 'privacy:metadata:local_reactpoc_items:userid',
                'title'       => 'privacy:metadata:local_reactpoc_items:title',
                'description' => 'privacy:metadata:local_reactpoc_items:description',
                'timecreated' => 'privacy:metadata:local_reactpoc_items:timecreated',
            ],
            'privacy:metadata:local_reactpoc_items'
        );

        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the given user.
     *
     * @param int $userid
     * @return contextlist
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        global $DB;

        $contextlist = new contextlist();

        if ($DB->record_exists('local_reactpoc_items', ['userid' => $userid])) {
            $contextlist->add_system_context();
        }

        return $contextlist;
    }

    /**
     * Get the list of users who have data within a context.
     *
     * @param userlist $userlist
     */
    public static function get_users_in_context(userlist $userlist): void {
        $context = $userlist->get_context();
        if (!$context instanceof \core\context\system) {
            return;
        }

        $sql = "SELECT userid FROM {local_reactpoc_items}";
        $userlist->add_from_sql('userid', $sql, []);
    }

    /**
     * Export all user data for the given approved contexts.
     *
     * @param approved_contextlist $contextlist
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        global $DB;

        $userid = $contextlist->get_user()->id;
        $records = $DB->get_records('local_reactpoc_items', ['userid' => $userid]);

        foreach ($records as $record) {
            $context = \core\context\system::instance();
            writer::with_context($context)->export_data(
                [get_string('pluginname', 'local_reactpoc'), $record->id],
                (object) [
                    'title'       => $record->title,
                    'description' => $record->description,
                    'timecreated' => \core_privacy\local\request\transform::datetime($record->timecreated),
                ]
            );
        }
    }

    /**
     * Delete all user data for the given context.
     *
     * @param \context $context
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        global $DB;

        if (!$context instanceof \core\context\system) {
            return;
        }

        $DB->delete_records('local_reactpoc_items');
    }

    /**
     * Delete all user data for the given user in the given contexts.
     *
     * @param approved_contextlist $contextlist
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        global $DB;

        $userid = $contextlist->get_user()->id;
        $DB->delete_records('local_reactpoc_items', ['userid' => $userid]);
    }

    /**
     * Delete multiple users' data within a single context.
     *
     * @param approved_userlist $userlist
     */
    public static function delete_data_for_users(approved_userlist $userlist): void {
        global $DB;

        $context = $userlist->get_context();
        if (!$context instanceof \core\context\system) {
            return;
        }

        [$insql, $inparams] = $DB->get_in_or_equal($userlist->get_userids(), SQL_PARAMS_NAMED);
        $DB->delete_records_select('local_reactpoc_items', "userid $insql", $inparams);
    }
}
