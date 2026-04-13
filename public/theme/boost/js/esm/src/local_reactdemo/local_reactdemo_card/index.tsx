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
 * Card component — swizzle entry point.
 *
 * Demonstrates a directory-based component: the swizzle unit is the whole
 * local_reactdemo_card/ directory. Ejecting copies both index.tsx and
 * CardContent.tsx so the theme has a fully self-contained copy.
 *
 * @module     local_reactdemo/local_reactdemo_card
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import CardContent from './CardContent';
import styles from './card.module.css';

export type Props = {
    title: string;
    body: string;
    footer?: string;
};

export default function Card({title, body, footer}: Props) {
    return (
        <div className={styles.card}>
            <div className={styles.title}>{title}</div>
            <CardContent body={body} footer={footer} styles={styles} />
        </div>
    );
}
