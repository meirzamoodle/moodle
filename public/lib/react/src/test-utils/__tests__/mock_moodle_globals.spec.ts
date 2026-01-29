import { describe, expect, it } from 'vitest';

import { mockMoodleGlobals } from '@moodle/core/test-utils/mock_moodle_globals';

describe('mockMoodleGlobals', () => {
    it('sets default Moodle globals', () => {
        expect((globalThis as any).M?.cfg).toEqual({
            contextid: 1,
            sesskey: 'test',
            wwwroot: 'http://example.test',
        });
    });

    it('overrides provided config values', () => {
        mockMoodleGlobals({ contextid: 99, wwwroot: 'http://local.test' });

        expect((globalThis as any).M?.cfg).toEqual({
            contextid: 99,
            sesskey: 'test',
            wwwroot: 'http://local.test',
        });
    });
});
