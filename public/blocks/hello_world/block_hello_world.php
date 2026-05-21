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
 * Hello World block class.
 *
 * Displays a static greeting via a React component rendered on a red background.
 *
 * @package    block_hello_world
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class block_hello_world extends block_base {

    /**
     * Initialise the block title.
     */
    public function init(): void {
        $this->title = get_string('pluginname', 'block_hello_world');
    }

    /**
     * Allow the block on all page types.
     *
     * @return array
     */
    public function applicable_formats(): array {
        return ['all' => true];
    }

    /**
     * Return the block content.
     *
     * @return stdClass|null
     */
    public function get_content(): ?stdClass {
        global $OUTPUT;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->footer = '';
        $this->content->text = $OUTPUT->render_from_template(
            'block_hello_world/helloworld',
            ['greeting' => get_string('helloworld', 'block_hello_world')]
        );

        return $this->content;
    }
}
