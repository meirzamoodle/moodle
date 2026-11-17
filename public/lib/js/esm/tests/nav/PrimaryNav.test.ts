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
 * Tests for core/nav/PrimaryNav, the module id the primary navigation template mounts.
 *
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import PrimaryNav from '@moodle/lms/core/nav/PrimaryNav';
import Nav from '@moodle/lms/core/nav/Nav';

// @moodlehq/design-system is ESM only, so Jest cannot resolve it from a CommonJS test bundle.
// Nothing is rendered here, so an empty stand-in is enough for Nav to load.
jest.mock('@moodlehq/design-system', () => ({NavPill: () => null}), {virtual: true});

describe('core/nav/PrimaryNav', () => {
    it('exports the shared core/nav/Nav component as its default', () => {
        expect(PrimaryNav).toBe(Nav);
    });
});
