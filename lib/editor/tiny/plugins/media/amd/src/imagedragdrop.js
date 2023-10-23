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
 * Tiny media plugin image drag and drop class for Moodle.
 *
 * @module      tiny_media/imagedragdrop
 * @copyright   2024 Meirza <meirza.arson@moodle.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Selectors from './selectors';
import {component} from "./common";
import {getStrings} from 'core/str';
import {prefetchStrings} from 'core/prefetch';

prefetchStrings('tiny_media', [
    'draganddrop',
    'droptoupload',
]);

export default class dragdrop {

    constructor(root, canShowFilePicker, handleUploadedFile) {
        this.canShowFilePicker = canShowFilePicker;
        this.handleUploadedFile = handleUploadedFile;

        // Elements.
        this.dropZoneEle = root.querySelector(Selectors.IMAGE.elements.dropzone);
        this.dropzoneLabelEle = root.querySelector(Selectors.IMAGE.elements.dropzoneLabel);
        this.dropzoneIconEle = root.querySelector(Selectors.IMAGE.elements.dropzoneIcon);
        this.dropZoneLabelIconEle = root.querySelector(Selectors.IMAGE.elements.dropzoneIconLabel);
        this.fileInput = root.querySelector(Selectors.IMAGE.elements.fileInput);
    }

    async init() {
        const langStringKeys = [
            'draganddrop',
            'droptoupload',
        ];
        const langStringvalues = await getStrings([...langStringKeys].map((key) => ({key, component})));

        // Convert array to object.
        this.langStrings = Object.fromEntries(langStringKeys.map((key, index) => [key, langStringvalues[index]]));

        await this.addEventListeners();
    }

    /**
     * Add event listeners to the drag and drop elements.
     */
    async addEventListeners() {
        // Drop zone event listeners.
        if (this.canShowFilePicker) {
            this.dropZoneEle.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.dropzoneLabelEle.innerHTML = this.langStrings.droptoupload;
                this.dropzoneIconEle.classList.add("text-primary");
                this.dropzoneIconEle.classList.remove("text-secondary");
            });
            this.dropZoneEle.addEventListener('dragleave', () => {
                this.dropzoneLabelEle.innerHTML = this.langStrings.draganddrop;
                this.dropzoneIconEle.classList.add("text-secondary");
                this.dropzoneIconEle.classList.remove("text-primary");
            });
            this.dropZoneEle.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handleUploadedFile(e.dataTransfer.files);
                this.dropzoneLabelEle.innerHTML = this.langStrings.draganddrop;
                this.dropzoneIconEle.classList.add("text-secondary");
                this.dropzoneIconEle.classList.remove("text-primary");
            });
            this.dropZoneLabelIconEle.addEventListener('click', () => {
                this.fileInput.click();
            });
       }
    }
}
