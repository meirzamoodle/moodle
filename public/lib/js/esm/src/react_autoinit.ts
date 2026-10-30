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
 * Deprecated alias of core/reactAutoinit.
 *
 * @module     core/react_autoinit
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @deprecated since Moodle 6.0 MDL-89230 - use core/reactAutoinit instead.
 */

import "@moodle/lms/core/reactAutoinit";
import emitDeprecation from "@moodle/lms/core/deprecated";

emitDeprecation("core/react_autoinit", {
    replacement: "core/reactAutoinit",
    since: "6.0",
    mdl: "MDL-89230",
});
