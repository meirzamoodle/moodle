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
     * Tests the rendering of a Mustache template with a pix helper.
     *
     * @dataProvider pix_provider
     *
     * @param array $mustachecontext The context data to be passed to the Mustache template.
     * @param string $expected The expected output of the rendered template.
     * @param string $actualtext The actual output of the rendered template to be compared.
     */
    public function test_pix(array $mustachecontext, string $expected, string $actualtext): void {
        $engine = new \Mustache_Engine();
        $context = new \Mustache_Context($mustachecontext);
        $lambdahelper = new \Mustache_LambdaHelper($engine, $context);

        $renderer = \core\di::get(\core\output\renderer_helper::class)->get_core_renderer();
        $pixhelper = new mustache_pix_helper($renderer);

        $this->assertEquals($expected, $pixhelper->pix($actualtext, $lambdahelper));
    }

    /**
     * Data provider for test_pix().
     *
     * @return array
     */
    public static function pix_provider(): array {
        return [
            'Test with string identifier only' => [
                'mustachecontext' => ['required' => 'Required'],
                'expected' => '<i class="icon fa fa-circle-exclamation text-danger fa-fw " aria-hidden="true"  ></i>',
                'actualtext' => 'req',
            ],
            'Test with without title/string' => [
                'mustachecontext' => ['required' => 'Required'],
                'expected' => '<i class="icon fa fa-circle-exclamation text-danger fa-fw " aria-hidden="true"  ></i>',
                'actualtext' => 'req, core',
            ],
            'Test with double brackets' => [
                'mustachecontext' => ['required' => 'Required'],
                'expected' => '<i class="icon fa fa-circle-exclamation text-danger fa-fw "  ' .
                    'title="Required" role="img" aria-label="Required"></i>',
                'actualtext' => 'req, core, {{required}}',
            ],
            'Test with triple brackets (unescaped HTML)' => [
                'mustachecontext' => ['requiredhtml' => '<b>Required</b>'],
                'expected' => '<i class="icon fa fa-circle-exclamation text-danger fa-fw "  ' .
                    'title="&lt;b&gt;Required&lt;/b&gt;" role="img" aria-label="&lt;b&gt;Required&lt;/b&gt;"></i>',
                'actualtext' => 'req, core, {{{requiredhtml}}}',
            ],
            'Test with str helper' => [
                'mustachecontext' => ['str' => function($section) {
                    [$identifier, $component] = array_map('trim', explode(',', $section));
                    return get_string($identifier, $component);
                }],
                'expected' => '<i class="icon fa fa-circle-exclamation text-danger fa-fw "  ' .
                    'title="Required" role="img" aria-label="Required"></i>',
                'actualtext' => 'req, core, {{#str}}required, core{{/str}}',
            ],
        ];
    }
}
