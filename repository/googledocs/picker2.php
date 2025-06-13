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
 * Ensemble Video repository plugin.
 *
 * @package    repository_googledocs
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use core\output\html_writer;
use core\url;

require(__DIR__.'/../../config.php');
require_once($CFG->dirroot . '/repository/lib.php');
require_once($CFG->dirroot . '/repository/googledocs/classes/googledocs_upload_form.php');

$repoid    = required_param('repo_id', PARAM_INT);
$contextid = required_param('context_id', PARAM_INT);

$repo = repository::get_instance($repoid);
if (!$repo) {
    throw new \exception('Invalid repository id');
}

require_login();
require_sesskey();

$returnurl = new url('/repository/repository_callback.php');
$returnurl->param('callback', 'yes');
$returnurl->param('repo_id', $repoid);
$returnurl->param('sesskey', sesskey());
$issuer = \core\oauth2\api::get_issuer(get_config('googledocs', 'issuerid'));
$client = \core\oauth2\api::get_user_oauth_client($issuer, $returnurl, 'https://www.googleapis.com/auth/drive.file', true);
if (!$client->is_logged_in()) {
    throw new \moodle_exception('invalidsesskey');
}

$clientid = $issuer->get('clientid');
$apikey = get_config('googledocs', 'apikey');

$context = context::instance_by_id($contextid, true);
// require_capability('repository/ensemble:view', $context);
$PAGE->set_pagelayout('embedded');
$PAGE->set_url(new url('/repository/googledocs/launch.php'));
$PAGE->set_context($context);
$PAGE->set_title(get_string('upload'));
$PAGE->set_heading(get_string('upload'));

// Create form instance.
$mform = new googledocs_upload_form(null, ['repo_id' => $repoid, 'context_id' => $contextid]);

// Form processing.
if ($mform->is_cancelled()) {
    $js = <<<EOD
    <script type="text/javascript">
    window.onload = function() {
        window.console.log(window.opener.M.core_filepicker.instances);
        const client_id = Object.keys(window.opener.M.core_filepicker.instances)[0];
        window.console.log(client_id);
        window.opener.M.core_filepicker.instances[client_id].list();
        window.self.close();
    }
    </script>
EOD;

header('Content-Type: text/html; charset=utf-8');
die($js);
}

if ($formdata = $mform->get_data()) {
    $tmp = make_request_directory();
    $tempfile = $tmp . '/' . rand();
    if ($mform->save_file('userfile', $tempfile, true)) {
        $filename = $mform->get_new_filename('userfile');
        $ha = new repository_googledocs($repoid, $context);
        $userauth = $ha->get_user_oauth_client();
        $userservice = new repository_googledocs\rest($userauth);
        $ha->upload_file($userservice, $tempfile, $filename, 'download', "root");
            $js = <<<EOD
    <script type="text/javascript">
    window.onload = function() {
        window.console.log(window.opener.M.core_filepicker.instances);
        const client_id = Object.keys(window.opener.M.core_filepicker.instances)[0];
        window.console.log(client_id);
        window.opener.M.core_filepicker.instances[client_id].list();
        window.self.close();
    }
    </script>
EOD;

header('Content-Type: text/html; charset=utf-8');
die($js);
    }
}

// Display the page.
echo $OUTPUT->header();
echo html_writer::start_div(attributes: ['class' => 'm-3']);
$mform->display();
echo html_writer::end_div();
echo $OUTPUT->footer();
