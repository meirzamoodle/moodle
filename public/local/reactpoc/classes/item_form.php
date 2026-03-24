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

namespace local_reactpoc;

use context_system;
use core_form\dynamic_form;
use moodle_url;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->libdir . '/filelib.php');

/**
 * Dynamic form with a TinyMCE editor and a file picker.
 *
 * Saves data to the local_reactpoc_items table and persists files to the
 * Moodle file store. Supports both create (itemid=0) and edit (itemid>0).
 *
 * @package    local_reactpoc
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class item_form extends dynamic_form {

    /** @var string File area for TinyMCE description images. */
    private const FILEAREA_DESC = 'item_description';

    /** @var string File area for the attachment file picker. */
    private const FILEAREA_ATTACH = 'item_attachment';

    #[\Override]
    public function definition(): void {
        $mform = $this->_form;

        $mform->addElement('hidden', 'itemid');
        $mform->setType('itemid', PARAM_INT);

        $mform->addElement('text', 'title', get_string('eventname', 'calendar'), ['maxlength' => 255, 'size' => 48]);
        $mform->setType('title', PARAM_TEXT);
        $mform->addRule('title', get_string('required'), 'required', null, 'server');

        $mform->addElement(
            'editor',
            'description_editor',
            get_string('eventdescription', 'calendar'),
            null,
            $this->get_editor_options()
        );
        $mform->setType('description_editor', PARAM_RAW);

        $mform->addElement(
            'filepicker',
            'attachment',
            get_string('attachment', 'repository'),
            null,
            $this->get_filepicker_options()
        );
        $mform->setType('attachment', PARAM_INT);

        $mform->addElement('hidden', 'contextid');
        $mform->setType('contextid', PARAM_INT);
    }

    #[\Override]
    public function process_dynamic_submission(): array {
        global $DB, $USER;

        $data    = $this->get_data();
        $context = $this->get_context_for_dynamic_submission();
        $itemid  = (int)($data->itemid ?? 0);
        $opts    = $this->get_editor_options();

        if ($itemid > 0) {
            // Update existing record.
            $data->id           = $itemid;
            $data->timemodified = time();
            $data = file_postupdate_standard_editor(
                $data, 'description', $opts, $context, 'local_reactpoc', self::FILEAREA_DESC, $itemid
            );
            $DB->update_record('local_reactpoc_items', (object) [
                'id'                => $data->id,
                'title'             => $data->title,
                'description'       => $data->description,
                'descriptionformat' => $data->descriptionformat,
                'timemodified'      => $data->timemodified,
            ]);
        } else {
            // Insert new record — need the id before we can store files.
            $now     = time();
            $data->id = $DB->insert_record('local_reactpoc_items', (object) [
                'userid'            => $USER->id,
                'contextid'         => $context->id,
                'title'             => $data->title,
                'description'       => '',
                'descriptionformat' => FORMAT_HTML,
                'timecreated'       => $now,
                'timemodified'      => $now,
            ]);
            $itemid = $data->id;

            $data = file_postupdate_standard_editor(
                $data, 'description', $opts, $context, 'local_reactpoc', self::FILEAREA_DESC, $itemid
            );
            $DB->update_record('local_reactpoc_items', (object) [
                'id'                => $data->id,
                'description'       => $data->description,
                'descriptionformat' => $data->descriptionformat,
            ]);
        }

        // Persist attachment.
        if (!empty($data->attachment)) {
            file_save_draft_area_files(
                $data->attachment,
                $context->id,
                'local_reactpoc',
                self::FILEAREA_ATTACH,
                $itemid,
                $this->get_filepicker_options()
            );
        }

        // Return the saved file list for the React component.
        $fs          = get_file_storage();
        $storedfiles = [];
        foreach ($fs->get_area_files($context->id, 'local_reactpoc', self::FILEAREA_ATTACH, $itemid, '', false) as $file) {
            $fileurl       = \core\url::make_pluginfile_url(
                $context->id, 'local_reactpoc', self::FILEAREA_ATTACH, $itemid,
                $file->get_filepath(), $file->get_filename()
            );
            $storedfiles[] = [
                'filename' => $file->get_filename(),
                'filesize' => $file->get_filesize(),
                'filepath' => $file->get_filepath(),
                'fileurl'  => $fileurl->out(),
            ];
        }

        // Rewrite @@PLUGINFILE@@ tokens to real URLs so React can render images.
        $description = file_rewrite_pluginfile_urls(
            $data->description,
            'pluginfile.php',
            $context->id,
            'local_reactpoc',
            self::FILEAREA_DESC,
            $itemid
        );

        return [
            'id'                => $data->id,
            'title'             => $data->title,
            'description'       => $description,
            'descriptionformat' => $data->descriptionformat,
            'files'             => $storedfiles,
        ];
    }

    #[\Override]
    protected function get_context_for_dynamic_submission(): \context {
        $contextid = $this->optional_param('contextid', 0, PARAM_INT);
        return $contextid > 0
            ? \context::instance_by_id($contextid, MUST_EXIST)
            : context_system::instance();
    }

    #[\Override]
    protected function get_page_url_for_dynamic_submission(): moodle_url {
        return new moodle_url('/local/reactpoc/index.php');
    }

    #[\Override]
    protected function check_access_for_dynamic_submission(): void {
        require_login();
        require_capability('local/reactpoc:manage', $this->get_context_for_dynamic_submission());
    }

    #[\Override]
    public function set_data_for_dynamic_submission(): void {
        global $DB;

        $contextid = $this->optional_param('contextid', 0, PARAM_INT);
        $itemid    = $this->optional_param('itemid', 0, PARAM_INT);
        $context   = $this->get_context_for_dynamic_submission();
        $opts      = $this->get_editor_options();

        if ($itemid > 0 && $record = $DB->get_record('local_reactpoc_items', ['id' => $itemid])) {
            // Editing: populate from DB and prepare draft areas.
            $record = file_prepare_standard_editor(
                $record, 'description', $opts, $context, 'local_reactpoc', self::FILEAREA_DESC, $itemid
            );

            $attachdraftid = file_get_submitted_draft_itemid('attachment');
            file_prepare_draft_area(
                $attachdraftid, $context->id, 'local_reactpoc', self::FILEAREA_ATTACH, $itemid,
                $this->get_filepicker_options()
            );

            $this->set_data([
                'itemid'             => $itemid,
                'contextid'          => $contextid ?: $record->contextid,
                'title'              => $record->title,
                'description_editor' => $record->description_editor,
                'attachment'         => $attachdraftid,
            ]);
        } else {
            // Creating: fresh draft area for attachment.
            $draftitemid = file_get_submitted_draft_itemid('attachment');
            file_prepare_draft_area(
                $draftitemid, $context->id, 'local_reactpoc', self::FILEAREA_ATTACH, 0,
                $this->get_filepicker_options()
            );

            $this->set_data([
                'itemid'    => 0,
                'contextid' => $contextid,
                'attachment' => $draftitemid,
            ]);
        }
    }

    /**
     * Editor options for the description field.
     *
     * @return array
     */
    protected function get_editor_options(): array {
        return [
            'maxfiles' => -1,
            'maxbytes' => 0,
            'context'  => $this->get_context_for_dynamic_submission(),
        ];
    }

    /**
     * Filepicker options for the attachment field.
     *
     * @return array
     */
    protected function get_filepicker_options(): array {
        return [
            'accepted_types' => '*',
            'maxbytes'       => 0,
            'maxfiles'       => 1,
            'return_types'   => FILE_INTERNAL,
            'context'        => $this->get_context_for_dynamic_submission(),
        ];
    }
}
