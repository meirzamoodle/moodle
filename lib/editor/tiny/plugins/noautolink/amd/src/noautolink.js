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
 * Helper for Tiny noautolink plugin.
 *
 * @module      tiny_noautolink/noautolink
 * @copyright   2023 Meirza <meirza.arson@moodle.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Pending from 'core/pending';

const noautolinkClassName = 'nolink';
const noautolinkTagHTML = 'span';

/**
 * Handle action.
 *
 * @param {TinyMCE} editor
 * @param {String} errorMsg
 * @param {String} infoMsg
 */
export const handleAction = (editor, errorMsg, infoMsg) => {
    const toggleState = isInAnchor(editor, editor.selection.getNode());
    let urlString = editor.selection.getContent({format: 'text'}).trim();
    if (urlString !== '' && !toggleState) {
        // Check whether the string is an URL. Otherwise, show an error notification.
        if (isValidUrl(urlString)) {
            const pendingPromise = new Pending('tiny_noautolink/setNoautolink');
            // Add the link.
            setNoautolinkOnSelection(editor, urlString).then(pendingPromise.resolve);
        } else {
            editor.notificationManager.open({
                text: errorMsg,
                type: 'error',
                timeout: 3000
            });
        }
    } else if (toggleState) {
        const nodeString = editor.selection.getNode().outerHTML.trim();

        // Convert HTML string to DOM element to get nolink class.
        const wrapper = document.createElement('div');
        wrapper.innerHTML = nodeString;
        const tempElement = wrapper.firstChild;
        if (tempElement.classList.contains('nolink')) {
            const pendingPromise = new Pending('tiny_noautolink/setNoautolink');
            // Remove the link.
            unsetNoautolinkOnSelection(editor, nodeString).then(pendingPromise.resolve);
        }
    } else {
        editor.notificationManager.open({
            text: infoMsg,
            type: 'info',
            timeout: 5000
        });
    }
};

/**
 * Set new content on the selection.
 *
 * @param {TinyMCE} editor
 * @param {String} url URL the link will point to.
 */
const setNoautolinkOnSelection = async(editor, url) => {
    const newContent = `<${noautolinkTagHTML} class="${noautolinkClassName}">${url}</${noautolinkTagHTML}>`;
    editor.selection.setContent(newContent);

    // Highlight the new content.
    const currentNode = editor.selection.getNode();
    const currentDOM = editor.dom.select(`${noautolinkTagHTML}.${noautolinkClassName}`, currentNode);
    currentDOM.forEach(function(value, index) {
        if (value.outerHTML == newContent) {
            editor.selection.select(currentDOM[index]);
            return;
        }
    });
};

/**
 * Remove the nolink on the selection.
 *
 * @param {TinyMCE} editor
 * @param {String} url URL the link will point to.
 */
const unsetNoautolinkOnSelection = async(editor, url) => {
    const regex = new RegExp(`</?${noautolinkTagHTML}[^>]*>`, "g");
    url = url.replace(regex, "");
    const currentSpan = editor.dom.getParent(editor.selection.getNode(), noautolinkTagHTML);
    currentSpan.outerHTML = url;
};

/**
 * Check if given string is a valid URL.
 *
 * @param {String} urlString URL the link will point to.
 * @returns {boolean} True is valid, otherwise false.
 */
const isValidUrl = urlString => {
    const urlPattern = new RegExp('^(https?:\\/\\/)?' + // Validate protocol
                                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // Validate domain name
                                '((\\d{1,3}\\.){3}\\d{1,3}))' + // Validate OR ip (v4) address
                                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // Validate port and path
                                '(\\?[;&a-z\\d%_.~+=-]*)?' + // Validate query string
                                '(\\#[-a-z\\d_]*)?$', 'i'); // Validate fragment locator
    return !!urlPattern.test(urlString);
};

/**
 * Get anchor element.
 *
 * @param {TinyMCE} editor
 * @param {Element} selectedElm
 * @returns {Element}
 */
const getAnchorElement = (editor, selectedElm) => {
    selectedElm = selectedElm || editor.selection.getNode();
    return editor.dom.getParent(selectedElm, `${noautolinkTagHTML}.${noautolinkClassName}`);
};


/**
 * Check the current selected element is an anchor or not.
 *
 * @param {TinyMCE} editor
 * @param {Element} selectedElm
 * @returns {boolean}
 */
const isInAnchor = (editor, selectedElm) => getAnchorElement(editor, selectedElm) !== null;

/**
 * Change state of button.
 *
 * @param {TinyMCE} editor
 * @param {function()} toggler
 * @returns {function()}
 */
const toggleState = (editor, toggler) => {
    editor.on('NodeChange', toggler);
    return () => editor.off('NodeChange', toggler);
};

/**
 * Change the active state of button.
 *
 * @param {TinyMCE} editor
 * @returns {function(*): function(): *}
 */
export const toggleActiveState = (editor) => (api) => {
    const updateState = () => api.setActive(!editor.mode.isReadOnly() && isInAnchor(editor, editor.selection.getNode()));
    updateState();
    return toggleState(editor, updateState);
};