import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { React } from '@moodle/core/react';
import Counter from '@moodle/local_multiplereact/local_multiplereact_counter';

describe('Counter', () => {
    it('increments when clicking +', () => {
        render(<Counter initial={1} />);

        expect(screen.getByText('Count: 1')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: '+' }));
        expect(screen.getByText('Count: 2')).toBeInTheDocument();
    });
});
