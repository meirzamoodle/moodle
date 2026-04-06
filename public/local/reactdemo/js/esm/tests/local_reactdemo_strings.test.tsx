import {act} from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {callAjax} from '@moodle/lms/core/amd';
import {getStrings} from '@moodle/lms/core/string';
import Greeting from '@moodle/lms/local_reactdemo/local_reactdemo_greeting';

jest.mock('@moodle/lms/core/amd');
jest.mock('@moodle/lms/core/string');

const mockGetStrings = jest.mocked(getStrings);
const mockCallAjax = jest.mocked(callAjax);

describe('Greeting — language strings', () => {
    it('requests the correct string keys from the correct component', async() => {
        mockGetStrings.mockResolvedValue(['Greeting', 'Loading...', 'Failed to load greeting.']);
        mockCallAjax.mockResolvedValue({name: 'Alice'});

        await act(async() => {
            render(<Greeting userid={1} />);
        });

        await waitFor(() => expect(mockGetStrings).toHaveBeenCalledWith([
            {key: 'greeting_title', component: 'local_reactdemo'},
            {key: 'greeting_loading', component: 'local_reactdemo'},
            {key: 'greeting_error', component: 'local_reactdemo'},
        ]));
    });

    it('renders using the strings returned by the language system', async() => {
        mockGetStrings.mockResolvedValue(['Salutation', 'Please wait...', 'Could not load.']);
        mockCallAjax.mockReturnValue(new Promise(() => {})); // Keep loading indefinitely.

        await act(async() => {
            render(<Greeting userid={1} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Salutation')).toBeInTheDocument();
            expect(screen.getByText('Please wait...')).toBeInTheDocument();
        });
    });

    it('renders the error string from the language system on failure', async() => {
        mockGetStrings.mockResolvedValue(['Greeting', 'Loading...', 'Could not load.']);
        mockCallAjax.mockRejectedValue(new Error('500'));
        jest.spyOn(window.console, 'error').mockImplementation(() => {});

        await act(async() => {
            render(<Greeting userid={1} />);
        });

        await waitFor(() => expect(screen.getByText('Could not load.')).toBeInTheDocument());
    });
});
