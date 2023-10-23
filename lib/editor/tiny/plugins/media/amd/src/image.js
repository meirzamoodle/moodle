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
 * Tiny Media plugin Image class for Moodle.
 *
 * @module      tiny_media/image
 * @copyright   2022 Huong Nguyen <huongnv13@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Notification from 'core/notification';
import Selectors from './selectors';
import ImageModal from './imagemodal';
import {getString} from 'core/str';
import {getImagePermissions} from './options';
import {getFilePicker} from 'editor_tiny/options';
import {ImageInsert} from 'tiny_media/imageinsert';
import {ImageDetails} from 'tiny_media/imagedetails';
import {
    bodyImageInsert,
    footerImageInsert,
    bodyImageDetails,
    footerImageDetails,
    showElements,
    hideElements,
    isPercentageValue
} from 'tiny_media/imagehelpers';

export default class MediaImage {
    canShowFilePicker = false;
    editor = null;
    currentModal = null;

    /**
     * The root element.
     *
     * @type {HTMLElement|null}
     */
    root = null;

    /**
     * The selected image.
     *
     * @type {HTMLImageElement|null}
     */
    selectedImage = null;

    /**
     * The current URL for the selected image.
     *
     * @type {string|null}
     */
    currentUrl = null;

    constructor(editor) {
        const permissions = getImagePermissions(editor);

        // Indicates whether the file picker can be shown.
        this.canShowFilePicker = permissions.filepicker && (typeof getFilePicker(editor, 'image') !== 'undefined');
        this.editor = editor;
    }

    async displayDialogue() {
        const currentImageData = await this.getCurrentImageData();
        this.currentModal = await ImageModal.create();

        this.root = this.currentModal.getRoot()[0];

        if (currentImageData && currentImageData.src) {
            this.loadImageDetails(currentImageData.src);
        } else {
            this.loadInsertImage();
        }
    }

    async getTemplateContext(data) {
        return {
            elementid: this.editor.id,
            showfilepicker: this.canShowFilePicker,
            ...data,
        };
    }

    async getCurrentImageData() {
        const selectedImageProperties = this.getSelectedImageProperties();
        if (!selectedImageProperties) {
            return {};
        }

        const properties = {...selectedImageProperties};

        if (properties.src) {
            properties.haspreview = true;
        }

        if (!properties.alt) {
            properties.presentation = true;
        }

        return properties;
    }

    loadInsertImage = async function() {
        const templateContext = {elementid: this.editor.id, showfilepicker: this.canShowFilePicker};

        Promise.all([bodyImageInsert(templateContext, this.root), footerImageInsert(templateContext, this.root)])
            .then(() => {
                const imageinsert = new ImageInsert(
                    this.root,
                    this.editor,
                    this.currentModal,
                    this.canShowFilePicker,
                );
                imageinsert.init();
                return;
            })
            .catch(Notification.exception);
    };

    loadImageDetails = async function(url) {
        this.startImageLoading();
        this.currentUrl = url;
        const image = new Image();
        image.src = url;
        image.addEventListener('error', () => {
            const urlWarningLabelEle = this.root.querySelector(Selectors.IMAGE.elements.urlWarning);
            urlWarningLabelEle.innerHTML = this.langStrings.imageurlrequired;
            showElements(Selectors.IMAGE.elements.urlWarning, this.root);
            this.stopImageLoading();
        });

        image.addEventListener('load', async() => {
            const currentImageData = await this.getCurrentImageData();
            let templateContext = await this.getTemplateContext(currentImageData);
            templateContext.sizecustomhelpicon = {text: getString('sizecustom_help', 'tiny_media')};

            Promise.all([bodyImageDetails(templateContext, this.root), footerImageDetails(templateContext, this.root)])
                .then(() => {
                    const imagedetails = new ImageDetails(
                        this.root,
                        this.editor,
                        this.currentModal,
                        this.canShowFilePicker,
                        this.currentUrl,
                        image,
                    );
                    imagedetails.init();
                    return;
                }).then(() => {
                    this.stopImageLoading();
                    return;
                })
                .catch(Notification.exception);
        });
    };

    getSelectedImageProperties() {
        const image = this.getSelectedImage();
        if (!image) {
            this.selectedImage = null;
            return null;
        }

        const properties = {
            src: null,
            alt: null,
            width: null,
            height: null,
            presentation: false,
            customStyle: '', // Custom CSS styles applied to the image.
        };

        const getImageHeight = (image) => {
            if (!isPercentageValue(String(image.height))) {
                return parseInt(image.height, 10);
            }

            return image.height;
        };

        const getImageWidth = (image) => {
            if (!isPercentageValue(String(image.width))) {
                return parseInt(image.width, 10);
            }

            return image.width;
        };

        // Get the current selection.
        this.selectedImage = image;

        properties.customStyle = image.style.cssText;

        const width = getImageWidth(image);
        if (width !== 0) {
            properties.width = width;
        }

        const height = getImageHeight(image);
        if (height !== 0) {
            properties.height = height;
        }

        properties.src = image.getAttribute('src');
        properties.alt = image.getAttribute('alt') || '';
        properties.presentation = (image.getAttribute('role') === 'presentation');

        return properties;
    }

    getSelectedImage() {
        const imgElm = this.editor.selection.getNode();
        const figureElm = this.editor.dom.getParent(imgElm, 'figure.image');
        if (figureElm) {
            return this.editor.dom.select('img', figureElm)[0];
        }

        if (imgElm && (imgElm.nodeName.toUpperCase() !== 'IMG' || this.isPlaceholderImage(imgElm))) {
            return null;
        }
        return imgElm;
    }

    isPlaceholderImage(imgElm) {
        if (imgElm.nodeName.toUpperCase() !== 'IMG') {
            return false;
        }

        return (imgElm.hasAttribute('data-mce-object') || imgElm.hasAttribute('data-mce-placeholder'));
    }

    /**
     * Displays the upload loader and disables UI elements while loading a file.
     */
    startImageLoading() {
        showElements(Selectors.IMAGE.elements.loaderIcon, this.root);
        hideElements(Selectors.IMAGE.elements.insertImage, this.root);
    }

    /**
     * Displays the upload loader and disables UI elements while loading a file.
     */
    stopImageLoading() {
        hideElements(Selectors.IMAGE.elements.loaderIcon, this.root);
        showElements(Selectors.IMAGE.elements.insertImage, this.root);
    }
}
