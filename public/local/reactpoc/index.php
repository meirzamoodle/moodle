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
 * List page for local_reactpoc items (AE-85 investigation).
 *
 * Renders a React component that displays all stored items and allows
 * creating, editing, and deleting them via a ModalForm.
 *
 * Usage: /local/reactpoc/index.php
 *
 * @package    local_reactpoc
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

require_login();

$context = context_system::instance();
require_capability('local/reactpoc:manage', $context);
$PAGE->set_context($context);
$PAGE->set_url(new \core\url('/local/reactpoc/index.php'));
$PAGE->set_title(get_string('pluginname', 'local_reactpoc'));
$PAGE->set_heading(get_string('pluginname', 'local_reactpoc'));

echo $OUTPUT->header();

echo $OUTPUT->render_from_template('local_reactpoc/local_reactpoc_list', [
    'contextid' => $context->id,
]);

echo $OUTPUT->footer();
