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

/**
 * Renderable for the Course Members block.
 *
 * @package    block_coursemembers
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_coursemembers\output;

use renderable;
use renderer_base;
use templatable;

/**
 * Renderable for the Course Members block.
 *
 * Aggregates all users enrolled in the current user's courses, grouped by
 * role archetype (editing teacher, non-editing teacher, student).
 * Users are deduplicated within each group across all courses.
 *
 * @package    block_coursemembers
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class main implements renderable, templatable {

    /** Fields required to render a user picture and full name. */
    const USER_FIELDS = 'u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic,
        u.middlename, u.alternatename, u.picture, u.imagealt, u.email';

    /**
     * Export data for the Mustache template.
     *
     * @param renderer_base $output
     * @return array
     */
    public function export_for_template(renderer_base $output): array {
        global $CFG;

        $courses = enrol_get_my_courses(['id'], 'fullname ASC');

        if (empty($courses)) {
            return ['groups' => [], 'nousers' => true];
        }

        $allroles = get_all_roles();

        // Map archetype name to list of role IDs that carry that archetype.
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

        // Collect users per archetype bucket, deduplicated by user ID.
        $buckets = [
            'editingteacher' => [],
            'teacher'        => [],
            'student'        => [],
        ];

        foreach ($courses as $course) {
            $context = \context_course::instance($course->id);
            foreach ($archetypemap as $archetype => $roleids) {
                foreach ($roleids as $roleid) {
                    $users = get_role_users($roleid, $context, false, self::USER_FIELDS);
                    foreach ($users as $user) {
                        if (!isset($buckets[$archetype][$user->id]) && user_can_view_profile($user)) {
                            $buckets[$archetype][$user->id] = $user;
                        }
                    }
                }
            }
        }

        // Build template groups in display order.
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
            $groups[] = [
                'label' => get_string($def['stringkey'], 'block_coursemembers'),
                'users' => $this->build_user_list($users, $output, $CFG->wwwroot),
            ];
        }

        return [
            'groups'   => $groups,
            'nousers'  => empty($groups),
        ];
    }

    /**
     * Build the template-ready user list for one role group.
     *
     * @param array         $users    Keyed by user ID.
     * @param renderer_base $output
     * @param string        $wwwroot
     * @return array
     */
    private function build_user_list(array $users, renderer_base $output, string $wwwroot): array {
        $list = [];
        foreach ($users as $user) {
            $list[] = [
                'fullname'    => fullname($user),
                'profileurl'  => $wwwroot . '/user/view.php?id=' . $user->id,
                'userpicture' => $output->user_picture($user, [
                    'size'                  => 35,
                    'link'                  => false,
                    'visibletoscreenreaders' => false,
                    'class'                 => 'userpicture align-middle',
                ]),
            ];
        }
        return $list;
    }
}
