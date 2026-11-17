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
 * Tests for core_course/ActivityDate.
 *
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {type ReactNode} from 'react';
import {render, screen} from '@testing-library/react';
import ActivityDate from '@moodle/lms/core_course/ActivityDate';

// @moodlehq/design-system is ESM only, so Jest cannot resolve it from a CommonJS test bundle.
// Stand Badge in with markup that renders its label as children, as the real one does, and exposes its styling props.
jest.mock('@moodlehq/design-system', () => ({
    Badge: ({label, variant, subtle}: {label: ReactNode; variant: string; subtle?: boolean}) => (
        <span data-testid="ds-badge" data-variant={variant} data-subtle={String(subtle)}>{label}</span>
    ),
}), {virtual: true});

describe('core_course/ActivityDate', () => {
    it('renders the label and the date as separate parts of one badge', () => {
        render(<ActivityDate label="Opens:" value="Monday, 1 January 2024, 12:00 AM" />);

        const badge = screen.getByTestId('ds-badge');
        expect(badge).toHaveTextContent('Opens: Monday, 1 January 2024, 12:00 AM');
        expect([...badge.children].map(part => part.textContent)).toEqual(['Opens:', 'Monday, 1 January 2024, 12:00 AM']);
    });

    it('uses the subtle secondary badge style', () => {
        render(<ActivityDate label="Due:" value="Tuesday, 2 January 2024, 12:00 AM" />);

        const badge = screen.getByTestId('ds-badge');
        expect(badge).toHaveAttribute('data-variant', 'secondary');
        expect(badge).toHaveAttribute('data-subtle', 'true');
    });
});
