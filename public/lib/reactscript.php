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
 * This file is serving ReactJS modules.
 *
 * @package    core
 * @subpackage lib
 * @copyright  Meirza (meirza.arson@moodle.com)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('NO_DEBUG_DISPLAY', true);
define('ABORT_AFTER_CONFIG', true);
require('../config.php');

require_once("$CFG->dirroot/lib/jslib.php");
require_once("$CFG->dirroot/lib/reactlib.php");

if ($slashargument = min_get_slash_argument()) {
    $slashargument = ltrim($slashargument, '/');
    if (substr_count($slashargument, '/') < 1) {
        header('HTTP/1.0 404 not found');
        die('Slash argument must contain both a revision and an alias');
    }
    // Alias must be last because it may contain "/".
    list($rev, $alias) = explode('/', $slashargument, 2);
    $rev  = min_clean_param($rev, 'INT');
    $alias = trim($alias);

} else {
    $rev  = min_optional_param('rev', -1, 'INT');
    $alias = min_optional_param('alias', '', 'RAW');
}

if (!min_is_revision_valid_and_current($rev)) {
    $rev = -1;
}

// Start.
$file = react_resolve_module_identifier($alias);
if ($file === null) {
    header('HTTP/1.0 404 not found');
    die('No valid javascript files found');
}
// End.


$jsfiles = [];
$jspaths = [];
$files = explode(',', $file);
foreach ($files as $fsfile) {
    $fsfile = trim($fsfile);
    if ($fsfile === '') {
        continue;
    }
    $jsfile = realpath($CFG->dirroot.$fsfile);
    if ($jsfile === false) {
        continue;
    }
    if ($CFG->dirroot === '/') {
        // Not supported, but allow JS when showing errors and warnings.
    } else if (strpos($jsfile, $CFG->dirroot . DIRECTORY_SEPARATOR) !== 0) {
        continue;
    }
    if (substr($jsfile, -3) !== '.js') {
        continue;
    }
    $jsfiles[] = $jsfile;
    $jspaths[] = $fsfile;
}

if (!$jsfiles) {
    header('HTTP/1.0 404 not found');
    die('No valid javascript files found');
}

$etag = sha1($rev.implode(',', $jsfiles));

if ($rev > 0) {
    $candidate = $CFG->localcachedir.'/js/'.$etag;

    if (file_exists($candidate)) {
        if (!empty($_SERVER['HTTP_IF_NONE_MATCH']) || !empty($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
            js_send_unmodified(filemtime($candidate), $etag);
        }
        js_send_cached($candidate, $etag);

    } else {
        define('ABORT_AFTER_CONFIG_CANCEL', true);

        define('NO_MOODLE_COOKIES', true);
        define('NO_UPGRADE_CHECK', true);

        require("$CFG->dirroot/lib/setup.php");

        // Do not rewrite generated bundles. Instead, serve a tiny ES module which imports
        // the real built file(s) from their natural location so relative specifiers resolve.
        $stub = react_generate_import_stub($jspaths, $rev);
        js_write_cache_file_content($candidate, $stub);
        clearstatcache();
        if (file_exists($candidate)) {
            js_send_cached($candidate, $etag);
        }
    }
}

$stub = react_generate_import_stub($jspaths);
js_send_uncached($stub);
