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
 * Tests for the core/profiler ESM module.
 *
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {createElement} from 'react';
import {render} from '@testing-library/react';
import {
    getComponentId,
    getProfilerCallback,
    isProfilerEnabled,
    onRenderCallback,
    withProfiler,
} from '@moodle/lms/core/profiler';

/** Turn developer-mode profiling off; globalSetup restores jsrev to -1 before each test. */
const disableProfiling = () => {
    (globalThis as any).M.cfg.jsrev = 1;
};

const Named = () => createElement('p', null, 'Hello');

describe('core/profiler', () => {
    let consoleSpies: Record<'groupCollapsed' | 'table' | 'warn' | 'error' | 'groupEnd', jest.SpyInstance>;

    beforeEach(() => {
        consoleSpies = {
            groupCollapsed: jest.spyOn(console, 'groupCollapsed').mockImplementation(() => {}),
            table: jest.spyOn(console, 'table').mockImplementation(() => {}),
            warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
            error: jest.spyOn(console, 'error').mockImplementation(() => {}),
            groupEnd: jest.spyOn(console, 'groupEnd').mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getComponentId', () => {
        it('prefers the explicitly supplied name', () => {
            expect(getComponentId(Named, 'Explicit', 'Fallback')).toBe('Explicit');
        });

        it('falls back to displayName, then the function name', () => {
            const Displayed = () => null;
            Displayed.displayName = 'Shown';

            expect(getComponentId(Displayed, undefined, 'Fallback')).toBe('Shown');
            expect(getComponentId(Named, '', 'Fallback')).toBe('Named');
        });

        it('uses the fallback for an anonymous component', () => {
            expect(getComponentId((() => () => null)(), undefined, 'Fallback')).toBe('Fallback');
        });
    });

    describe('isProfilerEnabled', () => {
        it('is enabled in developer mode (jsrev -1)', () => {
            expect(isProfilerEnabled()).toBe(true);
        });

        it('is disabled when JS caching is on', () => {
            disableProfiling();

            expect(isProfilerEnabled()).toBe(false);
        });

        it('is disabled when M is absent', () => {
            const original = globalThis.M;
            globalThis.M = undefined;
            try {
                expect(isProfilerEnabled()).toBe(false);
            } finally {
                globalThis.M = original;
            }
        });
    });

    describe('onRenderCallback', () => {
        it('logs a collapsed group with a timing table', () => {
            onRenderCallback('Widget', 'mount', 5, 6, 7, 8);

            expect(consoleSpies.groupCollapsed).toHaveBeenCalledWith('[mount] Widget - 5.00ms');
            expect(consoleSpies.table).toHaveBeenCalledWith({
                Component: 'Widget',
                Phase: 'mount',
                'Duration (ms)': '5.00',
                'Base Duration (ms)': '6.00',
                'Start Time': '7.00',
                'Commit Time': '8.00',
            });
            expect(consoleSpies.groupEnd).toHaveBeenCalled();
            expect(consoleSpies.warn).not.toHaveBeenCalled();
            expect(consoleSpies.error).not.toHaveBeenCalled();
        });

        it('warns about a render over the 16ms frame budget', () => {
            onRenderCallback('Widget', 'update', 17, 0, 0, 0);

            expect(consoleSpies.warn).toHaveBeenCalledWith(expect.stringContaining('Slow render: 17.00ms'));
            expect(consoleSpies.error).not.toHaveBeenCalled();
        });

        it('errors about a render over 50ms', () => {
            onRenderCallback('Widget', 'update', 51, 0, 0, 0);

            expect(consoleSpies.warn).toHaveBeenCalled();
            expect(consoleSpies.error).toHaveBeenCalledWith(expect.stringContaining('Very slow render: 51.00ms'));
        });

        it('logs nothing when profiling is disabled', () => {
            disableProfiling();

            onRenderCallback('Widget', 'mount', 100, 0, 0, 0);

            Object.values(consoleSpies).forEach(spy => expect(spy).not.toHaveBeenCalled());
        });
    });

    describe('getProfilerCallback', () => {
        it('returns onRenderCallback when profiling is enabled', () => {
            expect(getProfilerCallback()).toBe(onRenderCallback);
        });

        it('returns undefined when profiling is disabled', () => {
            disableProfiling();

            expect(getProfilerCallback()).toBeUndefined();
        });
    });

    describe('withProfiler', () => {
        it('returns the component unchanged when profiling is disabled', () => {
            disableProfiling();

            expect(withProfiler(Named)).toBe(Named);
        });

        it('names the wrapper after the resolved component id', () => {
            expect(withProfiler(Named).displayName).toBe('withProfiler(Named)');
            expect(withProfiler(Named, 'Custom').displayName).toBe('withProfiler(Custom)');
        });

        it('renders the component and reports React profiler timings under its id', () => {
            const Wrapped = withProfiler(({text}: {text: string}) => createElement('p', null, text), 'Greeting');

            const {getByText} = render(createElement(Wrapped, {text: 'Hi there'}));

            expect(getByText('Hi there')).toBeInTheDocument();
            expect(consoleSpies.groupCollapsed).toHaveBeenCalledWith(expect.stringMatching(/^\[mount\] Greeting - /));
        });
    });
});
