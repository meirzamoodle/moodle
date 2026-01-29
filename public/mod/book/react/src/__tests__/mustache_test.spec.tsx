import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { React } from '@moodle/core/react';

import { mockProfiler } from '@moodle/core/test-utils/mock_profiler';

describe('MustacheTest', () => {
    it('renders defaults and increments count', async () => {
        mockProfiler();
        const { default: MustacheTest } = await import('@moodle/mod_book/mustache_test');

        render(<MustacheTest />);

        expect(screen.getByRole('heading', { name: 'MustacheTest Component' })).toBeInTheDocument();
        expect(screen.getByText('Hello!')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Count: 0' }));
        expect(screen.getByRole('button', { name: 'Count: 1' })).toBeInTheDocument();
    });
});
