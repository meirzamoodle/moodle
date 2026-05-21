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
 * Hello World block React component.
 *
 * Renders the greeting text on a red background.
 *
 * @module     block_hello_world/block_hello_world_helloworld
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

type Props = {
    greeting: string;
};

/**
 * Renders the Hello World greeting on a red background.
 *
 * @param {Props} props - Component props supplied by the Mustache mount point.
 * @returns A JSX element displaying the greeting.
 */
export default function BlockHelloWorldHelloworld({greeting}: Props) {
    return (
        <div style={{backgroundColor: 'red', padding: '1rem', color: '#fff', fontWeight: 'bold'}}>
            {greeting}
        </div>
    );
}
