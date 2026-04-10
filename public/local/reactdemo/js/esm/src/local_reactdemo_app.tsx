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
 * React-only swizzle demo app entry point.
 *
 * Replaces the Mustache template approach: PHP outputs a single mount div;
 * this module bootstraps itself without any Mustache helper or react_autoinit
 * scan. User context is read from @moodle/lms/core/config (M.cfg).
 *
 * Each component is imported via its @moodle/lms/ specifier so theme overrides
 * via the import map apply automatically — the swizzle mechanism still works.
 *
 * @module     local_reactdemo/local_reactdemo_app
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {createRoot} from 'react-dom/client';
import {userId} from '@moodle/lms/core/config';
import Button from '@moodle/lms/local_reactdemo/local_reactdemo_button';
import Counter from '@moodle/lms/local_reactdemo/local_reactdemo_counter';
import Card from '@moodle/lms/local_reactdemo/local_reactdemo_card';
import Greeting from '@moodle/lms/local_reactdemo/local_reactdemo_greeting';

function SwizzleDemo() {
    const userid = userId;
    return (
        <>
            <h3>Swizzle demo</h3>
            <p>
                Each component below uses its <code>@moodle/lms/</code> specifier.
                When the active theme provides an override in its <code>js/esm/build/</code> directory,
                the import map automatically redirects to the theme&apos;s version — no PHP registration required.
                This page renders entirely from a React root with no Mustache template.
            </p>

            <h4>Button <code>@moodle/lms/local_reactdemo/local_reactdemo_button</code></h4>
            <div className="p-3 border rounded mb-4">
                <Button label="Click me" message="Hello from local_reactdemo!" />
            </div>

            <h4>Counter <code>@moodle/lms/local_reactdemo/local_reactdemo_counter</code></h4>
            <div className="p-3 border rounded mb-4">
                <Counter initial={0} />
            </div>

            <h4>Card <code>@moodle/lms/local_reactdemo/local_reactdemo_card</code></h4>
            <div className="mb-4">
                <Card
                    title="Example card"
                    body="This component is directory-based: index.tsx imports CardContent.tsx. Ejecting copies both files."
                    footer="local_reactdemo_card/index.tsx + CardContent.tsx"
                />
            </div>

            <h4>Greeting <code>@moodle/lms/local_reactdemo/local_reactdemo_greeting</code></h4>
            <div className="p-3 border rounded mb-4">
                <Greeting userid={userid} />
            </div>
        </>
    );
}

const container = document.getElementById('local-reactdemo-app');
if (container) {
    createRoot(container).render(<SwizzleDemo />);
}
