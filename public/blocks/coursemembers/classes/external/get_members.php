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

namespace block_coursemembers\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * External function returning course members grouped by role archetype.
 *
 * @package    block_coursemembers
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_members extends external_api {

    /** Fields required to render a user picture and full name. */
    const USER_FIELDS = 'u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic,
        u.middlename, u.alternatename, u.picture, u.imagealt, u.email';

    /**
     * No input parameters required.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * Return users enrolled in the current user's courses, grouped by role archetype.
     *
     * @return array
     */
    public static function execute(): array {
        global $CFG, $PAGE;

        self::validate_parameters(self::execute_parameters(), []);

        $context = \context_system::instance();
        self::validate_context($context);

        $courses = enrol_get_my_courses(['id'], 'fullname ASC');

        if (empty($courses)) {
            return ['groups' => []];
        }

        $allroles = get_all_roles();

        $archetypemap = [
            'editingteacher' => [],
            'teacher'        => [],
            'student'        => [],
        ];
        foreach ($allroles as $role) {
            if (array_key_exists($role->archetype, $archetypemap)) {
                $archetypemap[$role->archetype][] = $role->id;
            }
        }

        $buckets = [
            'editingteacher' => [],
            'teacher'        => [],
            'student'        => [],
        ];

        foreach ($courses as $course) {
            $coursecontext = \context_course::instance($course->id);
            foreach ($archetypemap as $archetype => $roleids) {
                foreach ($roleids as $roleid) {
                    $users = get_role_users($roleid, $coursecontext, false, self::USER_FIELDS);
                    foreach ($users as $user) {
                        if (!isset($buckets[$archetype][$user->id]) && user_can_view_profile($user)) {
                            $buckets[$archetype][$user->id] = $user;
                        }
                    }
                }
            }
        }

        $groupdefs = [
            ['archetype' => 'editingteacher', 'stringkey' => 'teachers'],
            ['archetype' => 'teacher',        'stringkey' => 'nonedtteachers'],
            ['archetype' => 'student',        'stringkey' => 'students'],
        ];

        $groups = [];
        foreach ($groupdefs as $def) {
            $users = $buckets[$def['archetype']];
            if (empty($users)) {
                continue;
            }

            $userlist = [];
            foreach ($users as $user) {
                $userpicture = new \user_picture($user);
                $userpicture->size = 35;

                $userlist[] = [
                    'fullname'   => fullname($user),
                    'profileurl' => (string) new \moodle_url('/user/view.php', ['id' => $user->id]),
                    'pictureurl' => $userpicture->get_url($PAGE)->out(false),
                ];
            }

            $groups[] = [
                'label' => get_string($def['stringkey'], 'block_coursemembers'),
                'users' => $userlist,
            ];
        }

        return ['groups' => $groups];
    }

    /**
     * Describes the return value.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'groups' => new external_multiple_structure(
                new external_single_structure([
                    'label' => new external_value(PARAM_TEXT, 'Role group label'),
                    'users' => new external_multiple_structure(
                        new external_single_structure([
                            'fullname'   => new external_value(PARAM_TEXT, 'Full name'),
                            'profileurl' => new external_value(PARAM_URL, 'Profile page URL'),
                            'pictureurl' => new external_value(PARAM_URL, 'Avatar image URL'),
                        ])
                    ),
                ])
            ),
        ]);
    }
}
