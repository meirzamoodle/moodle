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
 * Swizzle demo — React-only, no Mustache.
 *
 * Demonstrates that the swizzle system works without any Mustache template.
 * PHP outputs:
 *   1. A single <div id="local-reactdemo-app"> mount point.
 *   2. A <script type="module"> that loads the React app entry via the ESM
 *      controller, so the import map is honoured and theme overrides apply.
 *
 * The React app (local_reactdemo_app.tsx) reads M.cfg.userId (set by Moodle's
 * standard page output) for user context, imports each demo component via its
 * @moodle/lms/ specifier, and mounts the full UI — no data island, no
 * react_autoinit scan, no {{#react}} helper, no Mustache required.
 *
 * @package    local_reactdemo
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

require_login();

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new \core\url('/local/reactdemo/swizzle_demo_react.php'));
$PAGE->set_title('Swizzle demo — React-only');
$PAGE->set_heading('Swizzle demo — React-only');

echo $OUTPUT->header();

echo $PAGE->requires->react_mount('local_reactdemo/local_reactdemo_app', 'local-reactdemo-app');

echo $OUTPUT->footer();
