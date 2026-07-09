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
 * Activity icon rendered from the Moodle pix icon URL supplied by the
 * calendar Web Service. The named export and props interface are kept
 * compatible with @moodlehq/design-system ActivityIcon so the import
 * path in EventListItem.tsx is the only change needed if the design
 * system component is adopted later.
 *
 * @module     block_timeline/ActivityIcon
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

interface ActivityIconProps {
    iconurl: string;
    alt?: string;
    icon?: string;
    variant?: string;
    size?: string;
}

export function ActivityIcon({iconurl, alt = ''}: ActivityIconProps) {
    return <img src={iconurl} alt={alt} className="icon" />;
}
