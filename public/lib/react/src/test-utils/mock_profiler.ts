import { vi } from 'vitest';

export function mockProfiler() {
    vi.doMock('@moodle/core/profiler', () => {
        return {
            withProfiler: vi.fn((Component: any) => Component),
        };
    });
}
