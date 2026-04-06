import {useEffect, useState} from 'react';
import {callAjax} from '@moodle/lms/core/amd';
import {getStrings} from '@moodle/lms/core/string';

/**
 * New type Props.
 */
type Props = {
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

/**
 * Fetches and displays a greeting for the given user via a Moodle web service.
 *
 * @param {Props} Props passed from template.
 * @returns A JSX.Element representing the component UI
 */
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
        <div>
            <strong>{strings.title}</strong>
            <div>
                {error && strings.error}
                {!error && name === null && strings.loading}
                {!error && name !== null && `Hello, ${name}!`}
            </div>
        </div>
    );
}
