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
 * Low-level bridge between the ESM module graph and Moodle's AMD/RequireJS ecosystem.
 *
 * Higher-level helpers live in their own modules:
 *   - @moodle/lms/core/string  — getStrings() for language strings
 *   - @moodle/lms/core/fetch   — get/post/put/patch/del for Router API calls
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
 * Call a Moodle web service method via core/ajax.
 *
 * @param methodname Web service method name (e.g. "local_reactdemo_get_greeting").
 * @param args       Arguments to pass to the web service method.
 * @returns The resolved response from the web service.
 */
export async function callAjax<T>(methodname: string, args: Record<string, unknown> = {}): Promise<T> {
    const ajax = await requireAmd('core/ajax');
    return ajax.call([{methodname, args}])[0] as Promise<T>;
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
