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
 * Swizzle PoC demo page.
 *
 * Renders @moodle/lms/local_reactdemo/local_reactdemo_button using the
 * standard specifier. If the active theme provides an override file at
 * theme/<name>/js/esm/build/local_reactdemo/local_reactdemo_button.js,
 * the import map automatically serves that instead — no PHP registration needed.
 *
 * To test: place a compiled override in the theme's build directory
 * (use `grunt swizzle` to generate and compile it), then reload this page.
 *
 * @package    local_reactdemo
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

require_login();

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new \core\url('/local/reactdemo/swizzle_demo.php'));
$PAGE->set_title('Swizzle demo');
$PAGE->set_heading('Swizzle demo');

echo $OUTPUT->header();

echo $OUTPUT->render_from_template('local_reactdemo/local_reactdemo_swizzle', [
    'userid' => $USER->id,
]);

echo $OUTPUT->footer();
