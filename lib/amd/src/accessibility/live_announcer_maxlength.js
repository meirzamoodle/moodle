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
 * @module     core/accessibility/live_announcer_maxlength
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */
import {getString} from 'core/str';
import {prefetchStrings} from 'core/prefetch';
import liveAnnouncer from 'core/accessibility/live_announcer';

// Prefetch necessary strings for performance.
prefetchStrings('tiny_media', ['maxlengthreached']);

export default class {
    static isInitialized = false;

    constructor() {
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
        document.addEventListener('keyup', this.handleInputEvent);
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
            const reAnnouncement = true; // Force re-announcement.
            liveAnnouncer.updateAnnouncer(message, reAnnouncement);
        }
    };
}
