import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { mockBrowserGlobals, mockMoodleGlobals } from '../public/lib/react/src/test-utils/mock_moodle_globals';

mockMoodleGlobals();
mockBrowserGlobals();

afterEach(() => {
    cleanup();
});
