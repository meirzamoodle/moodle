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
 * ESM wrapper around the AMD core/fetch module for calling Moodle Router API endpoints.
 *
 * Exposes one named export per HTTP method so callers can import only what they need
 * rather than calling a generic fetchRoute() with a method option.
 *
 * URL pattern: /api/rest/v2/{component}/{action}
 *
 * @module     core/fetch
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {requireAmd} from './amd';

type FetchOptions = Record<string, unknown>;

/**
 * Perform a GET request against a Moodle Router API endpoint.
 *
 * @param component Frankenstyle component name (e.g. "local_reactdemo").
 * @param action    Endpoint path relative to the component (e.g. "items/42").
 * @param options   Optional query params forwarded to core/fetch.
 * @returns The parsed JSON payload.
 */
export async function get<T>(component: string, action: string, options: FetchOptions = {}): Promise<T> {
    const Fetch = await requireAmd('core/fetch');
    const response = await Fetch.performGet(component, action, options);
    return response.json() as Promise<T>;
}

/**
 * Perform a POST request against a Moodle Router API endpoint.
 *
 * @param component Frankenstyle component name.
 * @param action    Endpoint path relative to the component.
 * @param options   Optional body / params forwarded to core/fetch.
 * @returns The parsed JSON payload.
 */
export async function post<T>(component: string, action: string, options: FetchOptions = {}): Promise<T> {
    const Fetch = await requireAmd('core/fetch');
    const response = await Fetch.performPost(component, action, options);
    return response.json() as Promise<T>;
}

/**
 * Perform a PUT request against a Moodle Router API endpoint.
 *
 * @param component Frankenstyle component name.
 * @param action    Endpoint path relative to the component.
 * @param options   Optional body / params forwarded to core/fetch.
 * @returns The parsed JSON payload.
 */
export async function put<T>(component: string, action: string, options: FetchOptions = {}): Promise<T> {
    const Fetch = await requireAmd('core/fetch');
    const response = await Fetch.performPut(component, action, options);
    return response.json() as Promise<T>;
}

/**
 * Perform a PATCH request against a Moodle Router API endpoint.
 *
 * @param component Frankenstyle component name.
 * @param action    Endpoint path relative to the component.
 * @param options   Optional body / params forwarded to core/fetch.
 * @returns The parsed JSON payload.
 */
export async function patch<T>(component: string, action: string, options: FetchOptions = {}): Promise<T> {
    const Fetch = await requireAmd('core/fetch');
    const response = await Fetch.performPatch(component, action, options);
    return response.json() as Promise<T>;
}

/**
 * Perform a DELETE request against a Moodle Router API endpoint.
 *
 * @param component Frankenstyle component name.
 * @param action    Endpoint path relative to the component.
 * @param options   Optional body / params forwarded to core/fetch.
 * @returns The parsed JSON payload.
 */
export async function del<T>(component: string, action: string, options: FetchOptions = {}): Promise<T> {
    const Fetch = await requireAmd('core/fetch');
    const response = await Fetch.performDelete(component, action, options);
    return response.json() as Promise<T>;
}
