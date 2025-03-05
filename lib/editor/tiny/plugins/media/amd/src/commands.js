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
 * Tiny Media commands.
 *
 * @module      tiny_media/commands
 * @copyright   2022 Huong Nguyen <huongnv13@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getStrings} from 'core/str';
import {
    component,
    imageButtonName,
    videoButtonName,
    mediaManagerButtonName
} from './common';
import MediaImage from './image';
import MediaEmbed from './embed';
import MediaManager from './manager';
import {getButtonImage} from 'editor_tiny/utils';
import {getFilePicker} from 'editor_tiny/options';
import Selectors from './selectors';

const isImage = (node) => node.nodeName.toLowerCase() === 'img';
const isVideo = (node) => node.nodeName.toLowerCase() === 'video' || node.nodeName.toLowerCase() === 'audio';

const registerImageCommand = (editor, imageButtonText) => {
    const imageIcon = 'image';
    const handleImageAction = () => {
        const mediaImage = new MediaImage(editor);
        mediaImage.displayDialogue();
    };

    // Register the Menu Button as a toggle.
    // This means that when highlighted over an existing Media Image element it will show as toggled on.
    editor.ui.registry.addToggleButton(imageButtonName, {
        icon: imageIcon,
        tooltip: imageButtonText,
        onAction: handleImageAction,
        onSetup: api => {
            return editor.selection.selectorChangedWithUnbind(
                'img:not([data-mce-object]):not([data-mce-placeholder]),figure.image',
                api.setActive
            ).unbind;
        }
    });

    editor.ui.registry.addMenuItem(imageButtonName, {
        icon: imageIcon,
        text: imageButtonText,
        onAction: handleImageAction,
    });

    editor.ui.registry.addContextToolbar(imageButtonName, {
        predicate: isImage,
        items: imageButtonName,
        position: 'node',
        scope: 'node'
    });

    editor.ui.registry.addContextMenu(imageButtonName, {
        update: isImage,
    });

    // Let's check for image file at dragged and dropped
    // and add img-fluid class if it does't have it yet.
    editor.on('drop', function(e) {

        // Check if files are being dropped.
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault(); // Prevent the default drop behavior

            // Check if the editor allows dropping files.
            const options = getFilePicker(editor, 'image');
            const canDrop = (typeof options !== 'undefined') &&
                    Object.values(options.repositories).some(repository => repository.type === 'upload');
            // Fail if dropping is not allowed.
            if (!canDrop) {
                editor.notificationManager.open({
                    text: 'Dropping files is not permitted.',
                    type: 'error',
                });
                return;
            }

            const files = e.dataTransfer.files;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Check if the file is an image.
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();

                    reader.onload = (event) => {
                        const img = new Image();
                        img.src = event.target.result;

                        // Wait for the image to load.
                        img.onload = () => {
                            // Insert the image into the editor.
                            const imgHtml = `<img src="${img.src}" class="${Selectors.IMAGE.styles.responsive}" />`;
                            editor.insertContent(imgHtml);
                        };
                    };

                    reader.readAsDataURL(file);
                }
            }
        }
    });
};

const registerEmbedCommand = (editor, videoButtonText) => {
    const videoIcon = 'embed';
    const handleEmbedAction = () => {
        const mediaImage = new MediaEmbed(editor);
        mediaImage.displayDialogue();
    };

    // Register the Menu Button as a toggle.
    // This means that when highlighted over an existing Media Video element it will show as toggled on.
    editor.ui.registry.addToggleButton(videoButtonName, {
        icon: videoIcon,
        tooltip: videoButtonText,
        onAction: handleEmbedAction,
        onSetup: api => {
            return editor.selection.selectorChangedWithUnbind(
                'video:not([data-mce-object]):not([data-mce-placeholder]),' +
                'audio:not([data-mce-object]):not([data-mce-placeholder])',
                api.setActive
            ).unbind;
        }
    });

    editor.ui.registry.addMenuItem(videoButtonName, {
        icon: videoIcon,
        text: videoButtonText,
        onAction: handleEmbedAction,
    });

    editor.ui.registry.addContextMenu(videoButtonName, {
        update: isVideo,
    });

    editor.ui.registry.addContextToolbar(videoButtonName, {
        predicate: isVideo,
        items: videoButtonName,
        position: 'node',
        scope: 'node'
    });

};

const registerManagerCommand = (editor, mediaManagerButtonText, mediaManagerButtonImage) => {
    const mediaManagerIcon = 'filemanager';
    const handleMediaManager = () => {
        const mediaManager = new MediaManager(editor);
        mediaManager.displayDialogue();
    };

    // Register the Menu Button as a toggle.
    editor.ui.registry.addIcon(mediaManagerIcon, mediaManagerButtonImage.html);
    editor.ui.registry.addButton(mediaManagerButtonName, {
        icon: mediaManagerIcon,
        tooltip: mediaManagerButtonText,
        onAction: () => {
            handleMediaManager();
        }
    });

    editor.ui.registry.addMenuItem(mediaManagerButtonName, {
        icon: mediaManagerIcon,
        text: mediaManagerButtonText,
        onAction: () => {
            handleMediaManager();
        }
    });
};

export const getSetup = async() => {
    const [
        imageButtonText,
        mediaButtonText,
        mediaManagerButtonText
    ] = await getStrings(['imagebuttontitle', 'mediabuttontitle', 'mediamanagerbuttontitle'].map((key) => ({key, component})));

    const [
        mediaManagerButtonImage,
    ] = await Promise.all([
        getButtonImage('filemanager', component)
    ]);

    // Note: The function returned here must be synchronous and cannot use promises.
    // All promises must be resolved prior to returning the function.
    return (editor) => {
        registerImageCommand(editor, imageButtonText);
        registerEmbedCommand(editor, mediaButtonText);
        registerManagerCommand(editor, mediaManagerButtonText, mediaManagerButtonImage);
    };
};
