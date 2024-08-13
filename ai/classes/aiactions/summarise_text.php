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

namespace core_ai\aiactions;

use core_ai\aiactions\responses\response_base;

/**
 * Summarise text class.
 *
 * @package    core_ai
 * @copyright  2024 Matt Porritt <matt.porritt@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class summarise_text extends base {
    /** @var int The user id requesting the action. */
    protected int $userid;

    /** @var string The prompt text used to generate the summary text */
    protected string $prompttext;

    /**
     * Configure the action.
     * It’s also responsible for performing any other setup tasks,
     * such as getting additional data from the database etc.
     *
     * @param int $contextid The context id the action was created in.
     * @param int $userid The user id making the request.
     * @param string $prompttext The prompt text used to generate the image.
     * @return void.
     */
    public function configure(
            int $contextid,
            int $userid,
            string $prompttext
    ): void {
        $this->contextid = $contextid;
        $this->userid = $userid;
        $this->prompttext = $prompttext;
    }

    /**
     * Store the action in the database.
     *
     * @param response_base $response The result of the action.
     * @return int The id of the stored action.
     * @throws \dml_exception
     */
    public function store(response_base $response): int {
        global $DB;

        $responsearr = $response->get_response();

        $tablename = 'ai_action_' . $this->get_basename(); // Table name should always be in this format.
        $record = new \stdClass();
        $record->prompt = $this->prompttext;
        $record->responseid = $responsearr['id']; // Can be null.
        $record->fingerprint = $responsearr['fingerprint']; // Can be null.
        $record->generatedcontent = $responsearr['generatedcontent']; // Can be null.
        $record->finishreason = $responsearr['finishreason']; // Can be null.
        $record->prompttokens = $responsearr['prompttokens']; // Can be null.
        $record->completiontoken = $responsearr['completiontokens']; // Can be null.

        return $DB->insert_record($tablename, $record);
    }
}
