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
 * This file contains two forms for adding/editing mnet hosts, used by peers.php
 *
 * @package    repository_googledocs
 * @copyright  Meirza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/formslib.php');

/**
 * The very basic first step add new host form - just wwwroot & application
 * The second form is loaded up with the information from this one.
 */
class googledocs_upload_form extends moodleform {
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        $mform->addElement('hidden', 'repo_id', $this->_customdata['repo_id']);
        $mform->setType('repo_id', PARAM_INT);
        $mform->addElement('hidden', 'context_id', $this->_customdata['context_id']);
        $mform->setType('context_id', PARAM_INT);

        $maxbytes = $CFG->userquota;
        $maxareabytes = $CFG->userquota;
        $mform->addElement('filepicker', 'userfile', get_string('file'), null,
                          array('maxbytes' => $maxbytes, 'areamaxbytes' => $maxareabytes, 'accepted_types' => '*', 'maxfiles' => 1));
        $mform->addRule('userfile', null, 'required', null, 'client');

        $this->add_action_buttons(true, get_string('upload'));
    }
}
