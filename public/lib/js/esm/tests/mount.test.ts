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
 * Tests for the core/mount ESM module.
 *
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {act, createElement} from 'react';
import {mountReactApp, unmountReactApp} from '@moodle/lms/core/mount';

const Greeting = ({text}: {text: string}) => createElement('p', null, text);

describe('core/mount', () => {
    let container: HTMLElement;
    let groupCollapsed: jest.SpyInstance;

    beforeAll(() => {
        // Tell React this environment supports act(), so it does not warn on every render.
        (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    });

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
        groupCollapsed = jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
        jest.spyOn(console, 'table').mockImplementation(() => {});
        jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
    });

    afterEach(() => {
        container.remove();
        jest.restoreAllMocks();
    });

    describe('mountReactApp', () => {
        it('renders the component with its props into the container', () => {
            act(() => {
                mountReactApp(container, Greeting, {text: 'Hello'});
            });

            expect(container).toHaveTextContent('Hello');
        });

        it('returns a function that unmounts the root', () => {
            let unmount: () => void = () => {};
            act(() => {
                unmount = mountReactApp(container, Greeting, {text: 'Hello'});
            });

            act(() => {
                unmount();
            });

            expect(container).toBeEmptyDOMElement();
        });

        it('reports React profiler timings under the supplied id', () => {
            act(() => {
                mountReactApp(container, Greeting, {text: 'Hello'}, {id: '@moodle/lms/core/greeting'});
            });

            expect(groupCollapsed).toHaveBeenCalledWith(expect.stringMatching(/^\[mount\] @moodle\/lms\/core\/greeting - /));
        });

        it('falls back to ReactApp as the profiler id for an anonymous component', () => {
            act(() => {
                mountReactApp(container, (() => () => null)(), {});
            });

            expect(groupCollapsed).toHaveBeenCalledWith(expect.stringMatching(/^\[mount\] ReactApp - /));
        });

        it('does not wrap the component in a profiler when profiling is disabled', () => {
            (globalThis as any).M.cfg.jsrev = 1;

            act(() => {
                mountReactApp(container, Greeting, {text: 'Hello'});
            });

            expect(container).toHaveTextContent('Hello');
            expect(groupCollapsed).not.toHaveBeenCalled();
        });
    });

    describe('unmountReactApp', () => {
        it('unmounts a root created by mountReactApp', () => {
            act(() => {
                mountReactApp(container, Greeting, {text: 'Hello'});
            });

            act(() => {
                unmountReactApp(container);
            });

            expect(container).toBeEmptyDOMElement();
        });

        it('is a no-op for a container that was never mounted', () => {
            container.textContent = 'Server rendered';

            expect(() => unmountReactApp(container)).not.toThrow();
            expect(container).toHaveTextContent('Server rendered');
        });
    });
});
