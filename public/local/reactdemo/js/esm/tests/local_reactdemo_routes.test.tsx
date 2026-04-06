import {act} from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {get} from '@moodle/lms/core/fetch';
import {getStrings} from '@moodle/lms/core/string';
import User from '@moodle/lms/local_reactdemo/local_reactdemo_user';

jest.mock('@moodle/lms/core/fetch');
jest.mock('@moodle/lms/core/string');

const mockGet = jest.mocked(get);
const mockGetStrings = jest.mocked(getStrings);

// Strings are not the focus here — stub them so the component renders.
beforeEach(() => {
    mockGetStrings.mockResolvedValue(['Greeting', 'Loading...', 'Failed to load user.']);
});

describe('User — Router API route', () => {
    it('calls the correct route with the given userid', async() => {
        mockGet.mockResolvedValue({name: 'Alice'});

        await act(async() => {
            render(<User userid={1} />);
        });

        await waitFor(() =>
            expect(mockGet).toHaveBeenCalledWith('local_reactdemo', 'greeting/1'),
        );
    });

    it('displays the name returned by the route', async() => {
        mockGet.mockResolvedValue({name: 'Alice'});

        await act(async() => {
            render(<User userid={1} />);
        });

        await waitFor(() => expect(screen.getByText('Hello, Alice!')).toBeInTheDocument());
    });

    it('shows the error string when the route fails', async() => {
        mockGet.mockRejectedValue(new Error('500'));
        jest.spyOn(window.console, 'error').mockImplementation(() => {});

        await act(async() => {
            render(<User userid={1} />);
        });

        await waitFor(() => expect(screen.getByText('Failed to load user.')).toBeInTheDocument());
    });
});
