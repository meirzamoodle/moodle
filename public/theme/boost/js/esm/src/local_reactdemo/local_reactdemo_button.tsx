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
 * Boost theme eject of local_reactdemo_button.
 *
 * This is a full replacement — the original component is not imported.
 * Styled with Bootstrap classes available in Boost and adds a click counter.
 *
 * @module     theme_boost/local_reactdemo/local_reactdemo_button
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import React from 'react';
import {requireAmd} from '@moodle/lms/core/amd';

export type Props = {
    label: string;
    message?: string;
};

async function showMoodlePopup(message: string) {
    const Notification = await requireAmd('core/notification');
    Notification.alert(message);
}

export default function Button({
    label,
    message = 'Hello from local_reactdemo!',
}: Props) {
    const [clicks, setClicks] = React.useState(0);

    const handleClick = () => {
        setClicks((n) => n + 1);
        showMoodlePopup(message).catch(() => {
            window.alert(message);
        });
    };

    return (
        <span className="d-inline-flex align-items-center gap-2">
            <button
                type="button"
                className="btn btn-primary"
                onClick={handleClick}
            >
                {label}
            </button>
            {clicks > 0 && (
                <span className="badge bg-secondary">
                    {clicks} {clicks === 1 ? 'click' : 'clicks'}
                </span>
            )}
            <small className="text-muted fst-italic">boost theme</small>
        </span>
    );
}
