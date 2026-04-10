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
 * Typed accessor for Moodle's global M.cfg object.
 *
 * M.cfg is set by PHP (page_requirements_manager::get_config_for_javascript)
 * before any <script type="module"> runs, so it is always available when ESM
 * modules execute. Import individual values from here rather than accessing
 * window.M.cfg directly in components.
 *
 * @module     core/config
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare const M: {
    cfg: {
        wwwroot: string;
        apibase: string;
        sesskey: string;
        theme: string;
        jsrev: number;
        admin: string;
        usertimezone: string;
        language: string;
        courseId: number;
        courseContextId: number;
        contextid: number;
        contextInstanceId: number;
        siteId: number;
        userId: number;
    };
};

export const {
    wwwroot,
    apibase,
    sesskey,
    theme,
    jsrev,
    admin,
    usertimezone,
    language,
    courseId,
    courseContextId,
    contextid,
    contextInstanceId,
    siteId,
    userId,
} = M.cfg;
