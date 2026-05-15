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
 * Course Members block.
 *
 * @package    block_coursemembers
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Displays users enrolled in the current user's courses, grouped by role.
 *
 * @package    block_coursemembers
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class block_coursemembers extends block_base {

    /**
     * Initialise the block title.
     */
    public function init(): void {
        $this->title = get_string('pluginname', 'block_coursemembers');
    }

    /**
     * This block is only available on the dashboard / My home.
     *
     * @return array
     */
    public function applicable_formats(): array {
        return ['my' => true];
    }

    /**
     * Build and return the block content.
     *
     * @return stdClass|null
     */
    public function get_content(): ?stdClass {
        if (isset($this->content)) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->footer = '';
        $this->content->text = '';

        if (!isloggedin() || isguestuser()) {
            return $this->content;
        }

        $renderable = new block_coursemembers\output\main();
        $renderer = $this->page->get_renderer('block_coursemembers');

        $this->content->text = $renderer->render_main($renderable);

        return $this->content;
    }
}
