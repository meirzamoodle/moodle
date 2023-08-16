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

import {getButtonImage} from 'editor_tiny/utils';
import {get_string as getString} from 'core/str';
import {component, buttonName, buttonIcon} from 'tiny_noautolink/common';
import {handleAction, toggleActiveState} from 'tiny_noautolink/noautolink';

/**
 * Tiny noautolink commands.
 *
 * @module      tiny_noautolink/commands
 * @copyright   2023 Meirza <meirza.arson@moodle.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export const getSetup = async() => {
    const [
        buttonText,
        errorInvalidURLMsg,
        infoEmptySelection,
        buttonImage,
    ] = await Promise.all([
        getString('buttontitle', component),
        getString('invalidurl', component),
        getString('emptyselection', component),
        getButtonImage('icon', component),
    ]);

    return (editor) => {
        // Register the Equation Icon.
        editor.ui.registry.addIcon(buttonIcon, buttonImage.html);

        // Register Link button.
        editor.ui.registry.addToggleButton(buttonName, {
            icon: buttonIcon,
            tooltip: buttonText,
            onAction: () => {
                handleAction(editor, errorInvalidURLMsg, infoEmptySelection);
            },
            onSetup: toggleActiveState(editor),
        });

        // Register the Link menu item.
        editor.ui.registry.addMenuItem(buttonName, {
            icon: buttonIcon,
            shortcut: 'Meta+N',
            text: buttonText,
            onAction: () => {
                handleAction(editor, errorInvalidURLMsg, infoEmptySelection);
            },
        });
    };
};
