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
 * Tests that the string-fetching utilities are usable directly from stringUtils.ts,
 * without importing the React-dependent String.tsx module.
 *
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getString, getStrings, cacheStrings, getRequestedStrings} from '@moodle/lms/core/stringUtils';
import * as Ajax from '@moodle/lms/core/ajax';

describe('@moodle/lms/core/stringUtils', () => {
    beforeEach(() => {
        // Restore the real implementation — the global mock only simulates a
        // simplified stringMap lookup, not the M.str/promiseCache logic under test here.
        (getRequestedStrings as jest.Mock).mockRestore();
    });

    it('resolves a single string without importing the React String component', async() => {
        mockString('greeting', 'core', 'Hello World');

        await expect(getString('greeting', 'core')).resolves.toBe('Hello World');
    });

    it('resolves a batch of strings', async() => {
        mockString('yes', 'core', 'Yes');
        mockString('no', 'core', 'No');

        await expect(getStrings([
            {key: 'yes', component: 'core'},
            {key: 'no', component: 'core'},
        ])).resolves.toEqual(['Yes', 'No']);
    });

    it('serves pre-cached strings without a fetch', async() => {
        cacheStrings([
            {key: 'precached', component: 'mod_forum', value: 'Pre-cached'},
        ]);

        await expect(getString('precached', 'mod_forum')).resolves.toBe('Pre-cached');
    });

    it('fetches uncached strings without requiring login and without updating the session', async() => {
        const fetchManySpy = jest.spyOn(Ajax, 'fetchMany');
        fetchManySpy.mockImplementation((requests) => Promise.resolve(
            requests.map(() => 'Fetched value'),
        ));

        await expect(getString('uncached', 'core')).resolves.toBe('Fetched value');

        expect(fetchManySpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                loginrequired: false,
                nosessionupdate: true,
            }),
        );
    });

    describe('params', () => {
        it('substitutes a single numeric param into {$a}', async() => {
            mockString('itemcount', 'core', 'You have {$a} items');

            await expect(getString('itemcount', 'core', 5)).resolves.toBe('You have 5 items');
        });

        it('substitutes object params into named {$a->key} placeholders', async() => {
            mockString('greeting', 'core', 'Hello {$a->name}, you are {$a->age} years old');

            await expect(getString('greeting', 'core', {name: 'Bob', age: 30}))
                .resolves.toBe('Hello Bob, you are 30 years old');
        });

        it('leaves placeholders unchanged when no params are provided', async() => {
            mockString('unfilled', 'core', 'Value: {$a}');

            await expect(getString('unfilled', 'core')).resolves.toBe('Value: {$a}');
        });

        it('leaves placeholders unchanged when params is explicitly null', async() => {
            mockString('nullparam', 'core', 'Static text');

            await expect(getString('nullparam', 'core', null)).resolves.toBe('Static text');
        });

        it('treats different params as distinct cache entries for the same key', async() => {
            mockString('perishable', 'core', 'Hi {$a}');

            await expect(getString('perishable', 'core', 'First')).resolves.toBe('Hi First');
            await expect(getString('perishable', 'core', 'Second')).resolves.toBe('Hi Second');
        });
    });

    describe('failed fetches', () => {
        // Responses captured from service-nologin.php for core_get_string with stringid 'yes' and 'Bad Key!'.
        const yesResponse = {error: false, data: 'Yes'};
        const invalidParameterResponse = {
            error: true,
            exception: {
                message: 'Invalid parameter value detected',
                errorcode: 'invalidparameter',
                link: 'http://localhost/MDL-90057/',
                moreinfourl: 'https://docs.moodle.org/600/en/error/debug/invalidparameter',
            },
        };

        let fetchMock: jest.Mock;

        beforeEach(() => {
            (Ajax.fetchMany as jest.Mock).mockRestore();
            fetchMock = jest.fn();
            globalThis.fetch = fetchMock;
        });

        afterEach(() => {
            delete (globalThis as any).fetch;
        });

        const mockFetchResponse = (body: unknown): Response => ({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: () => Promise.resolve(body),
        } as Response);

        it('fetches the strings of a failed batch again on the next request', async() => {
            fetchMock
                .mockResolvedValueOnce(mockFetchResponse([yesResponse, invalidParameterResponse]))
                .mockResolvedValueOnce(mockFetchResponse([yesResponse]));

            await expect(getStrings([
                {key: 'yes', component: 'core'},
                {key: 'Bad Key!', component: 'core'},
            ])).rejects.toMatchObject({errorcode: 'invalidparameter'});

            await expect(getRequestedStrings([{key: 'yes'}])[0]).resolves.toBe('Yes');
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('fetches a string again after its fetch failed', async() => {
            fetchMock
                .mockResolvedValueOnce(mockFetchResponse([invalidParameterResponse]))
                .mockResolvedValueOnce(mockFetchResponse([yesResponse]));

            await expect(getRequestedStrings([{key: 'yes'}])[0]).rejects.toMatchObject({errorcode: 'invalidparameter'});
            await expect(getRequestedStrings([{key: 'yes'}])[0]).resolves.toBe('Yes');
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('returns the same rejected promise from getString so use() does not refetch', async() => {
            fetchMock.mockResolvedValue(mockFetchResponse([invalidParameterResponse]));

            const first = getString('yes', 'core');
            await expect(first).rejects.toMatchObject({errorcode: 'invalidparameter'});

            expect(getString('yes', 'core')).toBe(first);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });
});
