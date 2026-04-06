import {act} from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {callAjax} from '@moodle/lms/core/amd';
import {getStrings} from '@moodle/lms/core/string';
import Greeting from '@moodle/lms/local_reactdemo/local_reactdemo_greeting';

jest.mock('@moodle/lms/core/amd');
jest.mock('@moodle/lms/core/string');

const mockCallAjax = jest.mocked(callAjax);
const mockGetStrings = jest.mocked(getStrings);

/**
 * BeforeAll / afterAll run once for the entire suite.
 * Use these for expensive setup that can be shared across all tests,
 * such as seeding a test database, starting a server, or loading fixtures.
 */
beforeAll(() => {
    // Silence console.error for the entire suite — the Greeting component logs
    // errors on failure and we do not want those to pollute the test output.
    jest.spyOn(window.console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    // Restore console.error so it is not silenced in any other suite that runs
    // after this one. jest.restoreAllMocks() only restores spies, not jest.mock().
    jest.restoreAllMocks();
});

/**
 * BeforeEach / afterEach run once per test.
 * Use these to put each test into a known starting state.
 *
 * clearMocks: true (in jest.config.js) automatically clears mock.calls,
 * mock.instances, and mock.results before every test, so call counts never
 * bleed from one test into the next.  The stubs below are re-applied here
 * to give every test a sensible default that individual tests can override.
 */
beforeEach(() => {
    mockGetStrings.mockResolvedValue(['Greeting', 'Loading...', 'Failed to load greeting.']);
    mockCallAjax.mockResolvedValue({name: 'Alice'});
});

describe('Greeting — setUp and tearDown', () => {
    it('starts with a clean call count (clearMocks: true)', async() => {
        await act(async() => {
            render(<Greeting userid={1} />);
        });

        await waitFor(() => expect(screen.getByText('Hello, Alice!')).toBeInTheDocument());

        // Each test begins with zero prior calls because clearMocks resets the
        // history automatically — no manual jest.clearAllMocks() needed.
        expect(mockCallAjax).toHaveBeenCalledTimes(1);
    });

    it('call count is reset — previous test does not bleed through', async() => {
        await act(async() => {
            render(<Greeting userid={2} />);
        });

        await waitFor(() => expect(screen.getByText('Hello, Alice!')).toBeInTheDocument());

        // Still exactly 1, not 2 — proof the previous test's call was cleared.
        expect(mockCallAjax).toHaveBeenCalledTimes(1);
    });

    it('per-test override: a test can replace the default stub', async() => {
        mockCallAjax.mockResolvedValue({name: 'Bob'});

        await act(async() => {
            render(<Greeting userid={3} />);
        });

        await waitFor(() => expect(screen.getByText('Hello, Bob!')).toBeInTheDocument());
    });

    it('default stub is restored for the next test after an override', async() => {
        // MockCallAjax is back to returning {name: 'Alice'} from beforeEach.
        await act(async() => {
            render(<Greeting userid={4} />);
        });

        await waitFor(() => expect(screen.getByText('Hello, Alice!')).toBeInTheDocument());
    });

    it('error path is covered without leaking console.error suppression', async() => {
        mockCallAjax.mockRejectedValue(new Error('500'));

        await act(async() => {
            render(<Greeting userid={5} />);
        });

        // Console.error is silenced by beforeAll — no spyOn needed per test.
        await waitFor(() => expect(screen.getByText('Failed to load greeting.')).toBeInTheDocument());
    });
});
