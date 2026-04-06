import {act} from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import Counter from '@moodle/lms/local_reactdemo/local_reactdemo_counter';
import Message from '@moodle/lms/local_reactdemo/local_reactdemo_message';

describe('Counter', () => {
    it('renders with initial count', async() => {
        await act(async() => {
            render(<Counter initial={5} />);
        });
        expect(screen.getByText('Count: 5')).toBeInTheDocument();
    });

    it('increments count when + is clicked', async() => {
        await act(async() => {
            render(<Counter initial={0} />);
        });
        fireEvent.click(screen.getByText('+'));
        expect(screen.getByText('Count: 1')).toBeInTheDocument();
    });
});

describe('Message', () => {
    it('renders the message text', async() => {
        await act(async() => {
            render(<Message message="Hello World" />);
        });
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
});
