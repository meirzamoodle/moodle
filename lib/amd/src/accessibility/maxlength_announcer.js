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
 * Handles accessibility announcements when text inputs reach their maxlength.
 *
 * @module     core/accessibility/maxlength_announcer
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */
import {getString} from 'core/str';
import {prefetchStrings} from 'core/prefetch';
import ModalEvents from 'core/modal_events';

// Prefetch necessary strings for performance.
prefetchStrings('tiny_media', ['maxlengthreached']);

const ANNOUNCER_PREFIX = 'maxlength_announcer_';
const announcerIds = [`${ANNOUNCER_PREFIX}0`];

let isInitialized = false;
let currentAnnouncer = null;
let toggleSuffix = false;
let announcerCount = 1;

export default class {
    constructor() {
        this.setInitialAnnouncer();
        this.registerEvents();
    }

    static init() {
        if (isInitialized) {
            return;
        }
        isInitialized = true;
        new this();
    }

    setInitialAnnouncer() {
        const initialId = announcerIds[0];
        currentAnnouncer = document.querySelector(`[data-announcerid="${initialId}"]`);
    }

    registerEvents() {
        document.addEventListener('keyup', this.handleInputEvent);
        document.addEventListener(ModalEvents.shown, this.handleModalShown);
        document.addEventListener(ModalEvents.hidden, this.handleModalHidden);
    }

    /**
     * Handles input events and announces when maxlength is reached.
     *
     * @param {KeyboardEvent} event - The input event triggered on keyup.
     */
    handleInputEvent = async(event) => {
        const {target} = event;

        // Check if the target is a valid input element with maxlength attribute.
        if (!target.hasAttribute('maxlength') || !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
            return;
        }

        const maxLength = parseInt(target.getAttribute('maxlength'), 10);
        const currentLength = target.value.length;

        if (currentLength >= maxLength) {
            const message = await getString('maxlengthreached', 'core', maxLength);
            this.updateAnnouncer(message);
        }
    };

    /**
     * Handles the modal shown event.
     * Dynamically creates a new announcer inside the modal to ensure screen readers work properly.
     *
     * @param {CustomEvent} event - The modal shown event containing the modal element.
     */
    handleModalShown = (event) => {
        const newAnnouncerId = `${ANNOUNCER_PREFIX}${announcerCount}`;

        const newAnnouncer = document.createElement('div');
        newAnnouncer.setAttribute('data-announcerid', newAnnouncerId);
        newAnnouncer.setAttribute('aria-live', 'polite');
        newAnnouncer.setAttribute('aria-atomic', 'true');
        newAnnouncer.className = 'visually-hidden';

        const modalFooter = event.target.querySelector('.modal-footer');
        if (modalFooter) {
            modalFooter.appendChild(newAnnouncer);
            currentAnnouncer = newAnnouncer;
            announcerIds.push(newAnnouncerId);
            announcerCount++;
        }
    };

    /**
     * Handles the modal hidden event.
     * Cleans up announcer references to the previous context.
     */
    handleModalHidden = () => {
        announcerIds.pop();
        const lastAnnouncerId = announcerIds.at(-1);
        currentAnnouncer = document.querySelector(`[data-announcerid="${lastAnnouncerId}"]`);
    };

    /**
     * Updates the announcer element with the given message.
     * Toggles a suffix to force screen readers to re-announce.
     *
     * @param {string} message - The message to announce.
     */
    updateAnnouncer(message) {
        if (!currentAnnouncer) {
            return;
        }

        const suffix = toggleSuffix ? '.' : '..';
        currentAnnouncer.textContent = `${message}${suffix}`;
        toggleSuffix = !toggleSuffix;
    }
}
