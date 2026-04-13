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
 * Boost theme wrap of local_reactdemo_counter.
 *
 * Renders the original counter unchanged and adds a reset button below it.
 * The original is imported via @moodle-original/lms/ so this wrap always
 * delegates counting logic to upstream.
 *
 * @module     theme_boost/local_reactdemo/local_reactdemo_counter
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import React from 'react';
import type {Props} from '@moodle-original/lms/local_reactdemo/local_reactdemo_counter';
import OriginalCounter from '@moodle-original/lms/local_reactdemo/local_reactdemo_counter';

export default function Counter(props: Props) {
    const [key, setKey] = React.useState(0);

    return (
        <div>
            <OriginalCounter {...props} key={key} />
            <button
                type="button"
                className="btn btn-sm btn-outline-secondary mt-2"
                onClick={() => setKey((k) => k + 1)}
            >
                Reset
            </button>
            <small className="ms-2 text-muted fst-italic">boost theme wrap</small>
        </div>
    );
}
