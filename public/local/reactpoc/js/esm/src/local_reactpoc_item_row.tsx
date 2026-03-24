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
 * ItemRow — single row in the React demo item list table.
 *
 * @module     local_reactpoc/local_reactpoc_item_row
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import React from "react";

export type Item = {
    id: number;
    title: string;
    timecreated: string;
};

export type ItemDetail = Item & {
    description: string;
    timemodified: string;
    files: Array<{filename: string; filesize: number; fileurl: string}>;
};

export function ItemRow({
    item,
    strings,
    onView,
    onEdit,
    onDelete,
}: {
    item: Item;
    strings: {
        actionView: string;
        actionEdit: string;
        actionDelete: string;
    };
    // eslint-disable-next-line no-unused-vars
    onView: (id: number) => void;
    // eslint-disable-next-line no-unused-vars
    onEdit: (event: React.MouseEvent, id: number) => void;
    // eslint-disable-next-line no-unused-vars
    onDelete: (id: number) => void;
}) {
    return (
        <tr>
            <td>{item.title}</td>
            <td>{item.timecreated}</td>
            <td>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => onView(item.id)}
                >
                    {strings.actionView}
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary me-2"
                    onClick={(e) => onEdit(e, item.id)}
                >
                    {strings.actionEdit}
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onDelete(item.id)}
                >
                    {strings.actionDelete}
                </button>
            </td>
        </tr>
    );
}
