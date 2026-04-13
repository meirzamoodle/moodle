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
 * Internal sub-component for local_reactdemo_card.
 *
 * Not a swizzle entry point — imported only by index.tsx.
 * When a theme ejects local_reactdemo_card, this file is copied too.
 *
 * @module     local_reactdemo/local_reactdemo_card/CardContent
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export type Props = {
    body: string;
    footer?: string;
    styles: Record<string, string>;
};

export default function CardContent({body, footer, styles}: Props) {
    return (
        <div className={styles.body}>
            <p>{body}</p>
            {footer && <small className={styles.footer}>{footer}</small>}
        </div>
    );
}
