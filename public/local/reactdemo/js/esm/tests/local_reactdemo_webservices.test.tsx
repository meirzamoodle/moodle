import {act} from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {callAjax} from '@moodle/lms/core/amd';
import {getStrings} from '@moodle/lms/core/string';
import Greeting from '@moodle/lms/local_reactdemo/local_reactdemo_greeting';

jest.mock('@moodle/lms/core/amd');
jest.mock('@moodle/lms/core/string');

const mockCallAjax = jest.mocked(callAjax);
const mockGetStrings = jest.mocked(getStrings);

// Strings are not the focus here — stub them so the component renders.
beforeEach(() => {
    mockGetStrings.mockResolvedValue(['Greeting', 'Loading...', 'Failed to load greeting.']);
});

describe('Greeting — web service', () => {
    it('calls the correct web service with the given userid', async() => {
        mockCallAjax.mockResolvedValue({name: 'Alice'});

        await act(async() => {
            render(<Greeting userid={1} />);
        });

        await waitFor(() =>
            expect(mockCallAjax).toHaveBeenCalledWith('local_reactdemo_get_greeting', {userid: 1}),
        );
    });

    it('displays the name returned by the web service', async() => {
        mockCallAjax.mockResolvedValue({name: 'Alice'});

        await act(async() => {
            render(<Greeting userid={1} />);
        });

        await waitFor(() => expect(screen.getByText('Hello, Alice!')).toBeInTheDocument());
    });

    it('shows the error string when the web service fails', async() => {
        mockCallAjax.mockRejectedValue(new Error('500'));
        jest.spyOn(window.console, 'error').mockImplementation(() => {});

        await act(async() => {
            render(<Greeting userid={1} />);
        });

        await waitFor(() => expect(screen.getByText('Failed to load greeting.')).toBeInTheDocument());
    });
});
