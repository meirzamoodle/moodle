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
 * Handles accessibility announcements.
 *
 * @module     core/accessibility/live_announcer
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */

const SELECTORS = {
    announcer: '#liveannouncer',
};

class LiveAnnouncer {
    static isInitialized = false;

    constructor() {
        this.toggleSuffix = false;
        this.announcerElement = document.querySelector(SELECTORS.announcer);
    }

    static init() {
        if (this.isInitialized) {
            return;
        }
        this.isInitialized = true;
        new this();
    }

    /**
     * Updates the announcer element with the given message.
     * Toggles a suffix to force screen readers to re-announce.
     *
     * @param {string} message - The message to announce.
     * @param {boolean} [reAnnouncement=false] - Whether to force re-announcement by toggling a suffix.
     */
    updateAnnouncer(message, reAnnouncement = false) {
        if (!this.announcerElement) {
            return;
        }

        let suffix = '';
        if (reAnnouncement) {
            suffix = this.toggleSuffix ? '.' : '';
            this.toggleSuffix = !this.toggleSuffix;
        }

        this.announcerElement.textContent = `${message}${suffix}`;
    }
}

export default new LiveAnnouncer();
