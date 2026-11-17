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
 * Load an ESM module by specifier through the browser's import map.
 *
 * @module     core/importModule
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Import a module whose specifier is only known at runtime.
 *
 * @param specifier The module specifier, resolved through the Moodle import map.
 * @returns The imported module namespace.
 */
// Kept in its own module so Jest can stand it in: it cannot run a native import() of a mapped specifier.
const importModule = async (specifier: string): Promise<unknown> => import(specifier);

export default importModule;
