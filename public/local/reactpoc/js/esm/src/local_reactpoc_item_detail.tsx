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
 * ItemDetailView — body content for the item detail Moodle modal.
 *
 * Renders description HTML, attachment link, and timestamps.
 * The modal chrome (title, close button) is provided by core/modal.
 *
 * @module     local_reactpoc/local_reactpoc_item_detail
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {type ItemDetail} from "./local_reactpoc_item_row";

export function ItemDetailView({
    item,
    strings,
}: {
    item: ItemDetail;
    strings: {
        noDescription: string;
        previewAttachment: string;
        previewCreated: string;
        previewModified: string;
    };
}) {
    return (
        <div>
            {item.description
                ? <div dangerouslySetInnerHTML={{__html: item.description}} />
                : <p className="text-muted fst-italic">{strings.noDescription}</p>
            }

            {item.files.length > 0 && (
                <div className="mt-3 pt-3 border-top">
                    <strong>{strings.previewAttachment}</strong>{" "}
                    <a
                        href={item.files[0].fileurl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {item.files[0].filename}
                    </a>
                </div>
            )}

            <div className="text-muted small mt-3">
                {strings.previewCreated} {item.timecreated}
                {" · "}
                {strings.previewModified} {item.timemodified}
            </div>
        </div>
    );
}
