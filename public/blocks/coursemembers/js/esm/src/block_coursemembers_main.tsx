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
 * Course Members block — React entry point.
 *
 * Fetches enrolled users grouped by role via the block_coursemembers_get_members
 * web service and renders them as an avatar + name list.
 *
 * @module     block_coursemembers/block_coursemembers_main
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {useEffect, useState} from 'react';
import {callAjax} from '@moodle/lms/core/amd';
import {getStrings} from '@moodle/lms/core/string';

type User = {
    fullname: string;
    profileurl: string;
    pictureurl: string;
};

type Group = {
    label: string;
    users: User[];
};

type Strings = {
    loading: string;
    nousers: string;
};

const STRING_KEYS = [
    {key: 'loading', component: 'core'},
    {key: 'nousers', component: 'block_coursemembers'},
];

/**
 * Renders the Course Members block content.
 *
 * @returns A JSX.Element representing the grouped member list.
 */
export default function BlockCoursemembersMain() {
    const [groups, setGroups] = useState<Group[] | null>(null);
    const [error, setError] = useState(false);
    const [strings, setStrings] = useState<Strings | null>(null);

    useEffect(() => {
        getStrings(STRING_KEYS)
            .then(([loading, nousers]) => setStrings({loading, nousers}))
            .catch((e) => window.console.error('block_coursemembers: failed to load strings', e));
    }, []);

    useEffect(() => {
        callAjax<{groups: Group[]}>('block_coursemembers_get_members', {})
            .then(({groups: g}) => setGroups(g))
            .catch((e) => {
                window.console.error('block_coursemembers: failed to load members', e);
                setError(true);
            });
    }, []);

    if (!strings || groups === null) {
        return <p className="text-muted">{strings?.loading ?? '…'}</p>;
    }

    if (error || groups.length === 0) {
        return <p className="text-muted">{strings.nousers}</p>;
    }

    return (
        <>
            {groups.map((group) => (
                <div key={group.label}>
                    <h6 className="mb-1 mt-2">{group.label}</h6>
                    <ul className="list-unstyled mb-2">
                        {group.users.map((user) => (
                            <li key={user.profileurl} className="d-flex align-items-center py-1">
                                <img
                                    src={user.pictureurl}
                                    alt=""
                                    width={35}
                                    height={35}
                                    className="rounded-circle"
                                />
                                <a href={user.profileurl} className="ms-2">
                                    {user.fullname}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </>
    );
}
