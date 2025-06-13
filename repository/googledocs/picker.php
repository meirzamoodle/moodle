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


require_once(dirname(dirname(dirname(__FILE__))) . '/config.php');
require_once(dirname(dirname(__FILE__)) . '/lib.php');

$repoid    = required_param('repo_id', PARAM_INT);
$contextid = required_param('context_id', PARAM_INT);

$repo = repository::get_instance($repoid);
if (!$repo) {
    error("Invalid repository id");
}

require_login();
require_sesskey();

$returnurl = new moodle_url('/repository/repository_callback.php');
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
$PAGE->set_url(new moodle_url('/repository/googledocs/launch.php'));
$PAGE->set_context($context);
echo $OUTPUT->header();

// echo $OUTPUT->render_from_template('core/settings_link_page', ['node' => $node, 'secondarynavigation' => $secondarynavigation]);
?>

<script>
      let tokenClient;
      let accessToken = null;
      let pickerInited = false;
      let gisInited = false;

      // Use the API Loader script to load google.picker
      function onApiLoad() {
        gapi.load('picker', onPickerApiLoad);
      }

      function onPickerApiLoad() {
        pickerInited = true;
      }

      function gisLoaded() {
            // TODO(developer): Replace with your client ID and required scopes.
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: '<?= $clientid ?>',
                scope: 'https://www.googleapis.com/auth/drive.file' ,
                callback: '', // defined later
            });
            isInited = true;
        }

        // Create and render a Google Picker object for selecting from Drive.
    function createPicker() {
        const UploadView = new google.picker.DocsUploadView();
        const showPicker = () => {
            const picker = new google.picker.PickerBuilder()
                .addView(UploadView)
                .setOAuthToken(accessToken)
                .setDeveloperKey('<?= $apikey ?>')
                .setCallback(pickerCallback)
                .setAppId('<?= $clientid ?>')
                .build();
            picker.setVisible(true);
        }

        // Request an access token.
        tokenClient.callback = async (response) => {
            if (response.error !== undefined) {
            throw (response);
            }
            accessToken = response.access_token;
            showPicker();
        };

        if (accessToken === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            tokenClient.requestAccessToken({prompt: ''});
        }
    }

    // 1. Define the callback FIRST
    function pickerCallback(data) {
        console.log('Picker response:', data);

        if (data.action === google.picker.Action.PICKED) {
            const file = data.docs[0];
            console.log('Selected file:', file);

            // Send back to Moodle
            if (window.opener) {
                window.opener.postMessage({
                    type: 'googleDriveFileSelected',
                    file: {
                        id: file.id,
                        name: file.name,
                        url: file.url,
                        mimeType: file.mimeType
                    }
                }, '*');
            }
            window.close();

        } else if (data.action === google.picker.Action.CANCEL) {
            console.log('User canceled');
            window.close();
        }
    }

    </script>
    <!-- Load the Google API Loader script. -->
    <script async defer src="https://apis.google.com/js/api.js" onload="onApiLoad()"></script>
    <script async defer src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>


    <div class="min-vh-100 d-flex justify-content-center align-items-center">
     <button onclick="createPicker()" class="btn btn-primary">Authorize to upload a file to Google Drive</button>
</div>


<?php

echo $OUTPUT->footer();
