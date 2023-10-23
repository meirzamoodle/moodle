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
 * Tiny media plugin image helpers.
 *
 * @module      tiny_media/imagehelpers
 * @copyright   2024 Meirza <meirza.arson@moodle.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Templates from 'core/templates';
import * as Notification from 'core/notification';

export const bodyImageInsert = (templateContext, root) => {
    return Templates.renderForPromise('tiny_media/insert_image_modal_insert', {...templateContext})
    .then(({html, js}) => {
        Templates.replaceNodeContents(root.querySelector('.tiny_image_body_template'), html, js);
        return;
    })
    .catch(Notification.exception);
};

export const footerImageInsert = (templateContext, root) => {
    return Templates.renderForPromise('tiny_media/insert_image_modal_insert_footer', {...templateContext})
    .then(({html, js}) => {
        Templates.replaceNodeContents(root.querySelector('.tiny_image_footer_template'), html, js);
        return;
    })
    .catch(Notification.exception);
};

export const bodyImageDetails = (templateContext, root) => {
    return Templates.renderForPromise('tiny_media/insert_image_modal_details', {...templateContext})
    .then(({html, js}) => {
        Templates.replaceNodeContents(root.querySelector('.tiny_image_body_template'), html, js);
        return;
    })
    .catch(Notification.exception);
};

export const footerImageDetails = (templateContext, root) => {
    return Templates.renderForPromise('tiny_media/insert_image_modal_details_footer', {...templateContext})
    .then(({html, js}) => {
        Templates.replaceNodeContents(root.querySelector('.tiny_image_footer_template'), html, js);
        return;
    })
    .catch(Notification.exception);
};

/**
 * Show the element(s).
 *
 * @param {string|string[]} elements - The CSS selector for the elements to toggle.
 * @param {object} root - The CSS selector for the elements to toggle.
 */
export const showElements = (elements, root) => {
    if (elements instanceof Array) {
        elements.forEach((elementSelector) => {
            const element = root.querySelector(elementSelector);
            if (element) {
                element.classList.remove('d-none');
            }
        });
    } else {
        const element = root.querySelector(elements);
        if (element) {
            element.classList.remove('d-none');
        }
    }
};

/**
 * Hide the element(s).
 *
 * @param {string|string[]} elements - The CSS selector for the elements to toggle.
 * @param {object} root - The CSS selector for the elements to toggle.
 */
export const hideElements = (elements, root) => {
    if (elements instanceof Array) {
        elements.forEach((elementSelector) => {
            const element = root.querySelector(elementSelector);
            if (element) {
                element.classList.add('d-none');
            }
        });
    } else {
        const element = root.querySelector(elements);
        if (element) {
            element.classList.add('d-none');
        }
    }
};

export const isPercentageValue = (value) => {
    return value.match(/\d+%/);
};