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

namespace core\output;

/**
 * Unit tests for the mustache_pix_helper class.
 *
 * @package   core
 * @category  test
 * @copyright Meirza <meirza.arson@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 * @covers \core\output\mustache_pix_helper
 */
final class mustache_pix_helper_test extends \basic_testcase {

    /**
     * Test the pix().
     */
    public function test_pix(): void {
        $engine = new \Mustache_Engine();
        $context = new \Mustache_Context([
            'required' => 'Required',
            'requiredhtml' => '<b>Required</b>',
            'str' => function($section) {
                [$identifier, $component] = array_map('trim', explode(',', $section));
                return get_string($identifier, $component);
            },
        ]);
        $lambdahelper = new \Mustache_LambdaHelper($engine, $context);

        $renderer = \core\di::get(\core\output\renderer_helper::class)->get_core_renderer();
        $pixhelper = new mustache_pix_helper($renderer);

        // Test with without title/string.
        $this->assertEquals(
            '<i class="icon fa fa-circle-exclamation text-danger fa-fw " aria-hidden="true"  ></i>',
            $pixhelper->pix('req, core', $lambdahelper));

        // Test with double brackets.
        $this->assertEquals(
            '<i class="icon fa fa-circle-exclamation text-danger fa-fw "  title="Required" role="img" aria-label="Required"></i>',
            $pixhelper->pix('req, core, {{required}}', $lambdahelper));

        // Test with triple brackets (unescaped HTML).
        $this->assertEquals(
            '<i class="icon fa fa-circle-exclamation text-danger fa-fw "  ' .
                'title="&lt;b&gt;Required&lt;/b&gt;" role="img" aria-label="&lt;b&gt;Required&lt;/b&gt;"></i>',
            $pixhelper->pix('req, core, {{{requiredhtml}}}', $lambdahelper));

        // Test with str helper.
        $this->assertEquals(
            '<i class="icon fa fa-circle-exclamation text-danger fa-fw "  title="Required" role="img" aria-label="Required"></i>',
            $pixhelper->pix('req, core, {{#str}}required, core{{/str}}', $lambdahelper));
    }
}
