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
 * ESM wrapper for the core/ajax AMD module.
 *
 * @module     core/ajax
 * @copyright  Andrew Lyons <andrew@nicols.co.uk>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {Suspense, use, useEffect} from 'react';
import String, {getString} from '@moodle/lms/core/String';

// UseEffect receives the resolved string because use() suspends
// the component before the body runs — by the time useEffect fires,
// label is already a string, not a Promise.
function TitleSetter() {
    const label = use(getString('activityclipboard'));

    useEffect(() => {
        document.title = label;
    }, [label]);

    return <p>document.title was set to: <strong>{label}</strong></p>;
}

// Aria-label requires a string — TypeScript accepts this because
// use() unwraps Promise<string> to string.
function AccessibleButton() {
    const label = use(getString('activityclipboard'));

    return <button aria-label={label}>{label}</button>;
}

export default function Example() {
    return (
        <div id="example">

            <h3>Basic rendering via &lt;String /&gt;</h3>
            <String identifier="activityclipboard" />
            <String identifier="activityclipboard" params="Here!!!" />
            <String identifier="allowstealthmodules_help">
                Some help content would go here.
            </String>

            <h3>useEffect receives the resolved string</h3>
            <Suspense fallback="Loading...">
                <TitleSetter />
            </Suspense>

            <h3>aria-label from a resolved string</h3>
            <Suspense fallback="Loading...">
                <AccessibleButton />
            </Suspense>

        </div>
    );
}
