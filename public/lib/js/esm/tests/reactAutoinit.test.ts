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
 * Tests for the core/reactAutoinit ESM module.
 *
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import type {ComponentType} from 'react';
import {screen, waitFor} from '@testing-library/react';

// The browser resolves component specifiers through the import map, which jsdom does not have,
// so the loader is the one thing stood in; everything else runs for real.
const mockImportModule = jest.fn();
jest.mock('@moodle/lms/core/importModule', () => ({
    __esModule: true,
    default: (specifier: string) => mockImportModule(specifier),
}));

const WIDGET = '@moodle/lms/core/widget';
const PENDING_KEY = `reactAutoInit:${WIDGET}`;

const unmounted = jest.fn();

/** The component the stand-in loader returns, built by loadAutoinit against the module's own React. */
let Widget: ComponentType<Record<string, unknown>>;

let observers: MutationObserver[] = [];
let consoleSpies: Record<'log' | 'warn' | 'error', jest.SpyInstance>;

/**
 * Load a fresh copy of the module, which scans the page and starts observing as a side effect.
 *
 * @param mount A replacement for core/mount, for failures the real one cannot produce.
 */
const loadAutoinit = (mount?: object) => {
    jest.isolateModules(() => {
        // The isolated registry has its own React, so the component must use that copy for its hooks.
        const {createElement, useEffect} = require('react');
        Widget = (props: Record<string, unknown>) => {
            useEffect(() => unmounted, []);
            return createElement('p', null, `widget ${JSON.stringify(props)}`);
        };
        if (mount) {
            jest.doMock('@moodle/lms/core/mount', () => mount);
        }
        require('@moodle/lms/core/reactAutoinit');
    });
    jest.dontMock('@moodle/lms/core/mount');
};

/** Add a component placeholder to the page. */
const addPlaceholder = (component: string, props?: string): HTMLElement => {
    const element = document.createElement('div');
    element.dataset.reactComponent = component;
    if (props !== undefined) {
        element.dataset.reactProps = props;
    }
    document.body.append(element);
    return element;
};

/** Wait until the autoinit has finished handling a component, successfully or not. */
const settled = async (key = PENDING_KEY) => waitFor(() => expect(completeStack).toContain(key));

describe('core/reactAutoinit', () => {
    beforeEach(() => {
        mockImportModule.mockImplementation(async () => ({default: Widget}));
        unmounted.mockClear();

        // Keep hold of every observer a module copy installs, so the next test starts without it.
        const observe = MutationObserver.prototype.observe;
        jest.spyOn(MutationObserver.prototype, 'observe').mockImplementation(function(this: MutationObserver, ...args) {
            observers.push(this);
            return observe.apply(this, args);
        });

        consoleSpies = {
            log: jest.spyOn(console, 'log').mockImplementation(() => {}),
            warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
            error: jest.spyOn(console, 'error').mockImplementation(() => {}),
        };
        // The real core/mount profiles every render in developer mode; keep its timings out of the output.
        jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
        jest.spyOn(console, 'table').mockImplementation(() => {});
        jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
    });

    afterEach(() => {
        observers.forEach(observer => observer.disconnect());
        observers = [];
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    describe('page load', () => {
        it('mounts each placeholder already on the page with its props', async () => {
            const element = addPlaceholder(WIDGET, '{"title":"My Book"}');

            loadAutoinit();

            expect(await screen.findByText('widget {"title":"My Book"}')).toBeInTheDocument();
            expect(mockImportModule).toHaveBeenCalledWith(WIDGET);
            expect(element.dataset.reactMounted).toBe('1');
            await settled();
            expect(pendingStack).toContain(PENDING_KEY);
        });

        it('waits for DOMContentLoaded while the document is still loading', async () => {
            Object.defineProperty(document, 'readyState', {configurable: true, value: 'loading'});
            addPlaceholder(WIDGET);

            try {
                loadAutoinit();
                await Promise.resolve();

                expect(mockImportModule).not.toHaveBeenCalled();
            } finally {
                // Drop the own property so the jsdom getter on the prototype applies again.
                delete (document as any).readyState;
            }

            document.dispatchEvent(new Event('DOMContentLoaded'));

            expect(await screen.findByText('widget {}')).toBeInTheDocument();
        });
    });

    describe('props', () => {
        it.each([
            ['missing', undefined],
            ['empty', ''],
            ['not an object', '42'],
            ['null', 'null'],
        ])('passes no props when data-react-props is %s', async (_, props) => {
            addPlaceholder(WIDGET, props);

            loadAutoinit();

            expect(await screen.findByText('widget {}')).toBeInTheDocument();
            expect(consoleSpies.error).not.toHaveBeenCalled();
        });

        it('reports invalid JSON and mounts without props', async () => {
            addPlaceholder(WIDGET, '{not json');

            loadAutoinit();

            expect(await screen.findByText('widget {}')).toBeInTheDocument();
            expect(consoleSpies.error).toHaveBeenCalledWith('[reactAutoinit] invalid JSON', '{not json', expect.any(SyntaxError));
        });
    });

    describe('component resolution', () => {
        it('rejects a specifier outside @moodle/lms without importing it', async () => {
            addPlaceholder('mod_book/viewer');

            loadAutoinit();
            await settled('reactAutoInit:mod_book/viewer');

            expect(mockImportModule).not.toHaveBeenCalled();
            expect(consoleSpies.error).toHaveBeenCalledWith(expect.stringContaining('Invalid component format'), 'mod_book/viewer');
        });

        it('reports a module that fails to import', async () => {
            const failure = new Error('404');
            mockImportModule.mockRejectedValue(failure);
            const element = addPlaceholder(WIDGET);

            loadAutoinit();
            await settled();

            expect(consoleSpies.error).toHaveBeenCalledWith(`[reactAutoinit] Failed to import: ${WIDGET}`, failure);
            expect(consoleSpies.warn).toHaveBeenCalledWith('[reactAutoinit] Component not found:', WIDGET);
            expect(element.dataset.reactMounted).toBeUndefined();
            expect(element.dataset.reactMounting).toBeUndefined();
        });

        it('reports a module without a default export', async () => {
            mockImportModule.mockImplementation(async () => ({Widget}));
            const element = addPlaceholder(WIDGET);

            loadAutoinit();
            await settled();

            expect(consoleSpies.warn).toHaveBeenCalledWith('[reactAutoinit] Module has no default export:', WIDGET);
            expect(element).toBeEmptyDOMElement();
        });

        it('reports a mount that throws', async () => {
            const failure = new Error('render failed');
            const element = addPlaceholder(WIDGET);

            loadAutoinit({
                mountReactApp: () => {
                    throw failure;
                },
                unmountReactApp: jest.fn(),
            });
            await settled();

            expect(consoleSpies.error).toHaveBeenCalledWith('[reactAutoinit] Mount failed:', WIDGET, failure);
            expect(element.dataset.reactMounted).toBeUndefined();
        });
    });

    describe('skipped placeholders', () => {
        it('ignores a placeholder with an empty component name', async () => {
            addPlaceholder('');
            addPlaceholder(WIDGET);

            loadAutoinit();
            await settled();

            expect(mockImportModule).toHaveBeenCalledTimes(1);
            expect(pendingStack).toEqual([PENDING_KEY]);
        });

        it.each(['reactMounted', 'reactMounting'])('skips a placeholder already flagged %s', async flag => {
            addPlaceholder(WIDGET).dataset[flag] = '1';

            loadAutoinit();
            await Promise.resolve();

            expect(mockImportModule).not.toHaveBeenCalled();
            expect(pendingStack).toEqual([]);
        });
    });

    describe('dynamic content', () => {
        it('mounts a placeholder added after load', async () => {
            loadAutoinit();
            await Promise.resolve();

            addPlaceholder(WIDGET, '{"late":true}');

            expect(await screen.findByText('widget {"late":true}')).toBeInTheDocument();
        });

        it('mounts placeholders nested inside added content', async () => {
            loadAutoinit();
            await Promise.resolve();

            const fragment = document.createElement('section');
            fragment.innerHTML = `<div data-react-component="${WIDGET}" data-react-props='{"nested":1}'></div>`;
            document.body.append(fragment, document.createTextNode('ignored text'));

            expect(await screen.findByText('widget {"nested":1}')).toBeInTheDocument();
        });

        it('unmounts a placeholder when it is removed', async () => {
            const element = addPlaceholder(WIDGET);
            loadAutoinit();
            await screen.findByText('widget {}');

            element.remove();

            await waitFor(() => expect(unmounted).toHaveBeenCalledTimes(1));
            expect(element.dataset.reactMounted).toBeUndefined();
        });

        it('unmounts placeholders nested inside removed content', async () => {
            const wrapper = document.createElement('section');
            document.body.append(wrapper);
            wrapper.append(addPlaceholder(WIDGET));
            loadAutoinit();
            await screen.findByText('widget {}');

            wrapper.remove();
            document.body.append(document.createTextNode('text'));
            document.body.lastChild?.remove();

            await waitFor(() => expect(unmounted).toHaveBeenCalledTimes(1));
        });

        it('clears the flags of a removed placeholder that never mounted', async () => {
            mockImportModule.mockResolvedValue({});
            const element = addPlaceholder(WIDGET);
            loadAutoinit();
            await settled();

            element.dataset.reactMounted = '1';
            element.remove();

            await waitFor(() => expect(element.dataset.reactMounted).toBeUndefined());
            expect(consoleSpies.error).not.toHaveBeenCalled();
        });

        it('reports an unmount that throws and still clears the flags', async () => {
            const failure = new Error('unmount failed');
            const element = addPlaceholder(WIDGET);
            loadAutoinit({
                mountReactApp: () => () => {
                    throw failure;
                },
                unmountReactApp: jest.fn(),
            });
            await settled();

            element.remove();

            await waitFor(() => expect(consoleSpies.error).toHaveBeenCalledWith('[reactAutoinit] Error unmounting:', failure));
            expect(element.dataset.reactMounted).toBeUndefined();
        });
    });

    describe('profiling', () => {
        it('logs the lifecycle in developer mode', async () => {
            const element = addPlaceholder(WIDGET);

            loadAutoinit();
            await screen.findByText('widget {}');
            element.remove();
            await waitFor(() => expect(unmounted).toHaveBeenCalled());

            const messages = consoleSpies.log.mock.calls.map(([message]) => message);
            expect(messages).toEqual(expect.arrayContaining([
                '[reactAutoinit] Initializing (profiling enabled)...',
                '[reactAutoinit] Found 1 component(s) to mount',
                `[reactAutoinit] Loading: ${WIDGET}`,
                `[reactAutoinit] Mounted via default: ${WIDGET}`,
                `[reactAutoinit] Unmounted: ${WIDGET}`,
            ]));
        });

        it('logs nothing when profiling is disabled', async () => {
            (globalThis as any).M.cfg.jsrev = 1;
            const element = addPlaceholder(WIDGET);

            loadAutoinit();
            await screen.findByText('widget {}');
            element.remove();
            addPlaceholder(WIDGET);
            await waitFor(() => expect(unmounted).toHaveBeenCalled());
            await settled();

            expect(consoleSpies.log).not.toHaveBeenCalled();
        });
    });
});
