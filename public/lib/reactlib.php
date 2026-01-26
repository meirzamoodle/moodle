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
 * This file is serving optimised JS for React.
 *
 * @package    core
 * @subpackage lib
 * @copyright  Meirza (meirza.arson@moodle.com)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Resolve a React module alias to a dirroot-relative JS build path.
 *
 * Example:
 *   "mod_book/travel" => "/mod/book/react/build/travel.js"
 *
 * @param string $identifier Alias like "mod_book/travel"
 * @return string Dirroot-relative path starting with "/"
 * @throws coding_exception If component not found or identifier invalid.
 */
function react_resolve_module_identifier(string $identifier): ?string {
    global $CFG;

    $modulepath = explode('/', $identifier);

    $modname = array_shift($modulepath);
    if ($modname === null || $modname === '' || empty($modulepath)) {
        return null;
    }

    if (!class_exists('\\core\\component')) {
        require_once($CFG->dirroot . '/lib/classes/component.php');
    }

    $dir = \core\component::get_component_directory($modname);
    if (is_null($dir)) {
        return null;
    }

    $scriptdir = explode($CFG->dirroot, $dir);
    if (!isset($scriptdir[1]) || $scriptdir[1] === '') {
        return null;
    }

    return $scriptdir[1] . '/react/build/' . implode('/', $modulepath) . '.js';
}

/**
 * Generate an ES module import stub for React modules.
 *
 * This creates a small ES module that imports the real built files
 * from their natural location so relative specifiers resolve correctly.
 *
 * @param array $jspaths Array of JavaScript file paths
 * @param int $rev Revision number
 * @return string The generated import stub content
 */
function react_generate_import_stub(array $jspaths, int $rev = -1): string {
    global $CFG;

    // Moodle may be installed in a subdir (e.g. /AE-103).
    $subdir = (string)parse_url($CFG->wwwroot, PHP_URL_PATH);
    $subdir = '/' . trim($subdir, '/');
    if ($subdir === '/') {
        $subdir = '';
    }

    $stub = "// Auto-generated import stub\n";

    foreach ($jspaths as $jspath) {
        $jspath = trim((string)$jspath);
        if ($jspath === '') {
            continue;
        }
        if ($jspath[0] !== '/') {
            $jspath = '/' . $jspath;
        }

        // Use an origin-relative import so we don't hard-code scheme/host.
        $spec = $subdir . $jspath;
        if ($rev > 0) {
            $spec .= '?rev=' . $rev;
        }
        $stub .= "import '" . $spec . "';\n";
    }

    return $stub;
}
