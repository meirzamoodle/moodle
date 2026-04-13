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
 * Boost theme eject of local_reactdemo_greeting.
 *
 * Full replacement of the original greeting component. Displays the greeting
 * inside a Bootstrap alert card with a Boost-specific badge.
 *
 * @module     theme_boost/local_reactdemo/local_reactdemo_greeting
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {useEffect, useState} from 'react';
import {callAjax, getStrings} from '@moodle/lms/core/amd';

export type Props = {
    userid: number;
};

type Strings = {
    title: string;
    loading: string;
    error: string;
};

const STRING_KEYS: Array<{key: string; component: string}> = [
    {key: 'greeting_title', component: 'local_reactdemo'},
    {key: 'greeting_loading', component: 'local_reactdemo'},
    {key: 'greeting_error', component: 'local_reactdemo'},
];

export default function Greeting({userid}: Props) {
    const [name, setName] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [strings, setStrings] = useState<Strings | null>(null);

    useEffect(() => {
        getStrings(STRING_KEYS)
            .then(([title, loading, err]) => setStrings({title, loading, error: err}))
            .catch((e) => window.console.error('Failed to load strings', e));
    }, []);

    useEffect(() => {
        callAjax<{name: string}>('local_reactdemo_get_greeting', {userid})
            .then((response) => setName(response.name))
            .catch((e) => {
                window.console.error('Failed to load greeting', e);
                setError(true);
            });
    }, [userid]);

    if (!strings) {
        return null;
    }

    return (
        <div className={`alert ${error ? 'alert-danger' : 'alert-success'} d-flex align-items-center gap-2`}>
            <div>
                <strong>{strings.title}</strong>
                <div>
                    {error && strings.error}
                    {!error && name === null && <span className="text-muted">{strings.loading}</span>}
                    {!error && name !== null && `Hello, ${name}!`}
                </div>
            </div>
            <span className="badge bg-primary ms-auto">boost theme eject</span>
        </div>
    );
}
