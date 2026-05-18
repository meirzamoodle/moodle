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
 * PHPUnit tests for block_hello_world.
 *
 * @package    block_hello_world
 * @category   test
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_hello_world;

use advanced_testcase;
use block_hello_world;

/**
 * Tests for block_hello_world.
 *
 * @package    block_hello_world
 * @covers     \block_hello_world
 */
final class block_hello_world_test extends advanced_testcase {

    public static function setUpBeforeClass(): void {
        require_once(__DIR__ . '/../../moodleblock.class.php');
        require_once(__DIR__ . '/../block_hello_world.php');
        parent::setUpBeforeClass();
    }

    /**
     * Block content contains the greeting string rendered via template.
     */
    public function test_get_content_returns_greeting(): void {
        $this->resetAfterTest();

        $block = new block_hello_world();
        $block->_self_test();

        $content = $block->get_content();

        $this->assertNotNull($content);
        $this->assertStringContainsString('Hello, World!', $content->text);
        $this->assertSame('', $content->footer);
    }

    /**
     * Calling get_content() twice returns the same cached object.
     */
    public function test_get_content_is_cached(): void {
        $this->resetAfterTest();

        $block = new block_hello_world();
        $block->_self_test();

        $first  = $block->get_content();
        $second = $block->get_content();

        $this->assertSame($first, $second);
    }

    /**
     * Block allows multiple instances on a single page.
     */
    public function test_instance_allow_multiple(): void {
        $block = new block_hello_world();
        $this->assertTrue($block->instance_allow_multiple());
    }

    /**
     * Block is applicable to all page formats.
     */
    public function test_applicable_formats_all(): void {
        $block = new block_hello_world();
        $formats = $block->applicable_formats();
        $this->assertArrayHasKey('all', $formats);
        $this->assertTrue($formats['all']);
    }
}
