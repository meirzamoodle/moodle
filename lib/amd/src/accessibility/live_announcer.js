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

import ModalEvents from 'core/modal_events';

const SELECTORS = {
    announcer: 'liveannouncer',
};

class LiveAnnouncer {
    static isInitialized = false;

    constructor() {
        this.toggleSuffix = false;
        this.currentAnnouncer = null;
        this.announcerCount = 1;
        this.announcerIds = [`${SELECTORS.announcer}0`];
        this.currentAnnouncer = document.getElementById(this.announcerIds[0]);
        this.registerEvents();
    }

    static init() {
        if (this.isInitialized) {
            return;
        }
        this.isInitialized = true;
        new this();
    }

    registerEvents() {
        document.addEventListener(ModalEvents.shown, this.handleModalShown);
        document.addEventListener(ModalEvents.hidden, this.handleModalHidden);
    }

    /**
     * Handles the modal shown event.
     * Dynamically creates a new announcer inside the modal to ensure screen readers work properly.
     *
     * @param {CustomEvent} event - The modal shown event containing the modal element.
     */
    handleModalShown = (event) => {
        const newAnnouncerId = `${SELECTORS.announcer}${this.announcerCount}`;
        const newAnnouncer = document.createElement('div');
        newAnnouncer.setAttribute('id', newAnnouncerId);
        newAnnouncer.setAttribute('aria-live', 'polite');
        newAnnouncer.setAttribute('aria-atomic', 'true');
        newAnnouncer.className = 'visually-hidden';

        const modalFooter = event.target.querySelector('.modal-footer');
        if (modalFooter) {
            modalFooter.appendChild(newAnnouncer);
            this.currentAnnouncer = newAnnouncer;
            this.announcerIds.push(newAnnouncerId);
            this.announcerCount++;
        }
    };

    /**
     * Handles the modal hidden event.
     * Cleans up announcer references to the previous context.
     */
     handleModalHidden = () => {
        this.announcerIds.pop();
        const lastAnnouncerId = this.announcerIds.at(-1);
        this.currentAnnouncer = lastAnnouncerId ? document.getElementById(lastAnnouncerId) : null;
    };

    /**
     * Updates the announcer element with the given message.
     * Toggles a suffix to force screen readers to re-announce.
     *
     * @param {string} message - The message to announce.
     * @param {boolean} [reAnnouncement=false] - Whether to force re-announcement by toggling a suffix.
     */
    updateAnnouncer(message, reAnnouncement = false) {
        if (!this.currentAnnouncer) {
            return;
        }

        let suffix = '';
        if (reAnnouncement) {
            suffix = this.toggleSuffix ? '.' : '';
            this.toggleSuffix = !this.toggleSuffix;
        }

        this.currentAnnouncer.textContent = `${message}${suffix}`;
    }
}

export default new LiveAnnouncer();
