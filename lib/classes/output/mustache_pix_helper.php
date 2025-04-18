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

namespace core\output;

use Mustache_LambdaHelper;

/**
 * This class will call pix_icon with the section content.
 *
 * @package core
 * @copyright  2015 Damyon Wiese
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mustache_pix_helper {
    /** @var renderer_base $renderer A reference to the renderer in use */
    private $renderer;

    /**
     * Save a reference to the renderer.
     * @param renderer_base $renderer
     */
    public function __construct(renderer_base $renderer) {
        $this->renderer = $renderer;
    }

    /**
     * Read a pix icon name from a template and get it from pix_icon.
     *
     * {{#pix}}t/edit,component,Anything else is alt text{{/pix}}
     * {{#pix}}t/edit,component,{{#str}}edit{{/str}},{"aria-hidden":true}{{/pix}}
     *
     * The args are comma separated and only the first is required.
     *
     * @param string $text The text to parse for arguments.
     * @param Mustache_LambdaHelper $helper Used to render nested mustache variables.
     * @return string
     */
    public function pix($text, Mustache_LambdaHelper $helper) {
        $parts = $this->explode_text($text);
        $parts = array_pad($parts, 4, ''); // Fill missing values with empty strings.

        [$key, $component, $alttext, $attributes] = array_map('trim', $parts);

        // Split the text into an array of variables.
        $key = trim($helper->render($key));
        $component = trim($helper->render($component));
        if (!$component) {
            $component = '';
        }

        // Allow mustache tags in the last argument.
        $alttext = trim($helper->render($alttext));
        // The $text has come from a template, so HTML special
        // chars have been escaped. However, render_pix_icon
        // assumes the alt arrives with no escaping. So we need
        // ot un-escape here.
        $alttext = htmlspecialchars_decode($alttext, ENT_COMPAT);

        // Decode additional options if present.
        $attributes = trim($helper->render($attributes));
        $options = [];
        if (!empty($attributes)) {
            $options = json_decode($attributes, true);
            if (!is_array($options)) {
                throw new \moodle_exception('Invalid JSON format for pix_icon options');
            }
        }

        return trim($this->renderer->pix_icon($key, $alttext, $component, $options));
    }

    /**
     * Splits a string by commas while respecting nested Mustache tags.
     *
     * @param string $input The input string to be split.
     * @return array An array of strings split by commas, preserving nested Mustache tags.
     */
    private function explode_text(string $input): array {
        $result = [];
        $buffer = '';
        $depth = 0;

        foreach (explode(',', $input) as $part) {
            // Count mustache open/close blocks.
            $depth += substr_count($part, '{{#');
            $depth -= substr_count($part, '{{/');

            // Build token.
            $buffer .= ($buffer ? ',' : '') . $part;

            if ($depth === 0) {
                $result[] = trim($buffer);
                $buffer = '';
            }
        }

        // Push remaining buffer if any.
        if ($buffer !== '') {
            $result[] = trim($buffer);
        }

        return $result;
    }
}
