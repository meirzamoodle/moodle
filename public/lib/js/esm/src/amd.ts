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
 * Utilities for loading AMD modules and Moodle language strings from ESM/React code.
 *
 * Moodle's AMD ecosystem (RequireJS) is separate from the ESM import map.
 * These helpers wrap the global `require()` function so React components can
 * await AMD modules and language strings without coupling to RequireJS directly.
 *
 * @module     core/amd
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// eslint-disable-next-line no-unused-vars
declare const require: (deps: string[], resolve: (_mod: unknown) => void, reject: (_err: unknown) => void) => void;

/**
 * Load a single AMD module by name.
 *
 * @param moduleName AMD module name (e.g. "core_form/modalform").
 * @returns The resolved module export.
 */
export function requireAmd(moduleName: string): Promise<any> {
    return new Promise((resolve, reject) => {
        require([moduleName], resolve, reject);
    });
}

/**
 * Load multiple Moodle language strings in a single request via core/str.
 *
 * @param requests Array of {key, component} objects.
 * @returns Array of resolved strings in the same order as requests.
 */
export async function getStrings(requests: Array<{key: string; component: string}>): Promise<string[]> {
    const str = await requireAmd("core/str");
    return str.get_strings(requests);
}

/**
 * Call a Moodle Router API endpoint via the AMD core/fetch module.
 *
 * URL pattern: /api/rest/v2/{component}/{action}
 *
 * @param component Frankenstyle component name (e.g. "local_reactpoc").
 * @param action    Endpoint path relative to the component (e.g. "items" or "items/42").
 * @param options   Optional method (default GET), query params, and request body.
 * @returns The parsed JSON payload returned by the route controller.
 */
export async function fetchRoute<T>(
    component: string,
    action: string,
    options: {method?: string; params?: Record<string, unknown>; body?: unknown} = {},
): Promise<T> {
    const Fetch = await requireAmd("core/fetch");
    const response = await Fetch.request(component, action, options);
    return response.json() as Promise<T>;
}

/**
 * Open a plain Moodle modal (title + HTML body, no form) via core/modal_factory.
 *
 * @param title Modal title string.
 * @param body  HTML string rendered as the modal body.
 */
export async function openModal(title: string, body: string): Promise<any> {
    const Modal = await requireAmd("core/modal");
    const modal = await Modal.create({title, body});
    modal.show();
    return modal;
}

/**
 * Open a Moodle dynamic form inside a modal via the AMD core_form/modalform module.
 *
 * @param formClass   PHP class name of the dynamic form (e.g. "local_reactdemo\\simple2complex_form").
 * @param args        Arguments forwarded to the form's set_data_for_dynamic_submission().
 * @param title       Modal title string.
 * @param returnFocus Element to return focus to after the modal closes.
 * @param onSubmitted Callback invoked when FORM_SUBMITTED fires.
 */
export async function openModalForm(
    formClass: string,
    args: Record<string, unknown>,
    title: string,
    returnFocus: EventTarget | null,
    onSubmitted: () => void,
): Promise<void> {
    const ModalForm = await requireAmd("core_form/modalform");
    const form = new ModalForm({
        formClass,
        args,
        modalConfig: {title},
        returnFocus,
    });
    form.addEventListener(form.events.FORM_SUBMITTED, onSubmitted);
    form.show();
}
