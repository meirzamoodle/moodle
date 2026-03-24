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
 * AE-85 investigation: React list component for local_reactpoc items.
 * Uses Moodle web services via core/ajax for all data operations.
 *
 * @module     local_reactpoc/local_reactpoc_list
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {getStrings, fetchRoute, openModal, openModalForm} from "@moodle/lms/core/amd";
import {type Item, type ItemDetail, ItemRow} from "./local_reactpoc_item_row";
import {ItemDetailView} from "./local_reactpoc_item_detail";

const P = "local_reactpoc";

const STRING_REQUESTS = [
    {key: "action_delete", component: P},
    {key: "action_edit", component: P},
    {key: "action_view", component: P},
    {key: "addnew", component: P},
    {key: "confirm_delete", component: P},
    {key: "error_delete", component: P},
    {key: "error_loaditem", component: P},
    {key: "error_loaditems", component: P},
    {key: "error_openform", component: P},
    {key: "field_actions", component: P},
    {key: "field_timecreated", component: P},
    {key: "field_title", component: P},
    {key: "itemsheading", component: P},
    {key: "loading", component: "core"},
    {key: "modal_header", component: P},
    {key: "nodescription", component: P},
    {key: "noitems", component: P},
    {key: "preview_attachment", component: P},
    {key: "preview_created", component: P},
    {key: "preview_modified", component: P},
] as const;

type StringKey = typeof STRING_REQUESTS[number]["key"];
type Strings = Record<StringKey, string>;


/**
 * Main list component.
 */
function App({
    contextid = 1,
}: {
    contextid?: number;
}) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [s, setS] = useState<Strings | null>(null);

    useEffect(() => {
        // Load all strings in parallel before doing anything else, since they're needed in multiple places.
        getStrings([...STRING_REQUESTS])
            .then((values) => setS(
                Object.fromEntries(STRING_REQUESTS.map(({key}, i) => [key, values[i]])) as Strings
            ))
            .catch((err: unknown) => {
                window.console.error("[local_reactpoc] Failed to load strings", err);
            });

        // Initial load of the item list.
        reload();
    }, []);

    const reload = () => {
        setLoading(true);
        setError(null);
        fetchRoute<{items: Item[]}>("local_reactpoc", "items")
            .then((data) => setItems(data.items))
            .catch((err: unknown) => {
                window.console.error("[local_reactpoc] get_items failed", err);
                setError(s?.error_loaditems ?? "");
            })
            .finally(() => setLoading(false));
    };

    const handleOpenForm = (event: React.MouseEvent, itemid: number) => {
        openModalForm(
            "local_reactpoc\\item_form",
            {contextid, itemid},
            s?.modal_header ?? "",
            event.currentTarget,
            reload,
        ).catch((err: unknown) => {
            window.console.error("[local_reactpoc] Failed to open form", err);
        });
    };

    const handleView = async(id: number) => {
        setError(null);
        try {
            const data = await fetchRoute<{item: ItemDetail}>("local_reactpoc", `items/${id}`);
            const item = data.item;
            const modal = await openModal(item.title, '<div></div>');
            const mountEl = modal.getBody()[0].querySelector('div') as HTMLElement;
            createRoot(mountEl).render(
                <ItemDetailView
                    item={item}
                    strings={{
                        noDescription: s!.nodescription,
                        previewAttachment: s!.preview_attachment,
                        previewCreated: s!.preview_created,
                        previewModified: s!.preview_modified,
                    }}
                />
            );
        } catch (err: unknown) {
            window.console.error("[local_reactpoc] get_item failed", err);
            setError(s?.error_loaditem ?? "");
        }
    };

    const handleDelete = (id: number) => {
        // eslint-disable-next-line no-alert
        if (!window.confirm(s?.confirm_delete ?? "")) {
            return;
        }

        fetchRoute<{success: boolean}>("local_reactpoc", `items/${id}`, {method: "DELETE"})
            .then(() => reload())
            .catch((err: unknown) => {
                window.console.error("[local_reactpoc] delete_item failed", err);
                setError(s?.error_delete ?? "");
            });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">{s?.itemsheading}</h4>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={(e) => handleOpenForm(e, 0)}
                >
                    {s?.addnew}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {loading && <p className="text-muted">{s?.loading}</p>}

            {!loading && items.length === 0 && (
                <p className="text-muted">{s?.noitems}</p>
            )}

            {items.length > 0 && (
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th scope="col">{s?.field_title}</th>
                            <th scope="col">{s?.field_timecreated}</th>
                            <th scope="col">{s?.field_actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                strings={{
                                    actionView: s?.action_view ?? "",
                                    actionEdit: s?.action_edit ?? "",
                                    actionDelete: s?.action_delete ?? "",
                                }}
                                onView={handleView}
                                onEdit={handleOpenForm}
                                onDelete={handleDelete}
                            />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

/**
 * Default export consumed by react_autoinit.
 */
export default function init(props: {contextid?: number} = {}) {
    return <App {...props} />;
}
