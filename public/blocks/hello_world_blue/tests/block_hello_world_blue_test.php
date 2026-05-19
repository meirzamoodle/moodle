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
 * PHPUnit tests for block_hello_world_blue.
 *
 * @package    block_hello_world_blue
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class block_hello_world_blue_test extends advanced_testcase {

    /**
     * Test that the block renders the greeting string.
     */
    public function test_get_content_returns_greeting(): void {
        $this->resetAfterTest();

        $block = $this->get_block_instance();
        $content = $block->get_content();

        $this->assertNotNull($content);
        $this->assertStringContainsString('Hello, World!', $content->text);
    }

    /**
     * Test that the block content contains the CSS class for blue styling.
     */
    public function test_get_content_has_blue_class(): void {
        $this->resetAfterTest();

        $block = $this->get_block_instance();
        $content = $block->get_content();

        $this->assertStringContainsString('block-hello-world-blue-greeting', $content->text);
    }

    /**
     * Test that calling get_content twice returns the same cached object.
     */
    public function test_get_content_is_cached(): void {
        $this->resetAfterTest();

        $block = $this->get_block_instance();
        $first  = $block->get_content();
        $second = $block->get_content();

        $this->assertSame($first, $second);
    }

    /**
     * Test that has_config returns false.
     */
    public function test_has_config_is_false(): void {
        $this->resetAfterTest();

        $block = $this->get_block_instance();
        $this->assertFalse($block->has_config());
    }

    /**
     * Return an initialised block instance for testing.
     *
     * @return block_hello_world_blue
     */
    private function get_block_instance(): block_hello_world_blue {
        global $CFG;
        require_once($CFG->dirroot . '/blocks/hello_world_blue/block_hello_world_blue.php');

        $block = new block_hello_world_blue();
        $block->init();

        return $block;
    }
}
