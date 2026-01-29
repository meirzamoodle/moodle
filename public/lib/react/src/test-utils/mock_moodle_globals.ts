import { vi } from 'vitest';

type MoodleConfig = {
    contextid?: number;
    sesskey?: string;
    wwwroot?: string;
};

export function mockMoodleGlobals(config: MoodleConfig = {}) {
    const cfg = {
        contextid: 1,
        sesskey: 'test',
        wwwroot: 'http://example.test',
        ...config,
    };

    (globalThis as any).M = { cfg };
}

export function mockAmdRequire(modules: Record<string, any> = {}) {
    (globalThis as any).require = (mods: string[], resolve: any, reject: any) => {
        try {
            const resolved = mods.map((name) => modules[name] ?? {});
            resolve(mods.length === 1 ? resolved[0] : resolved);
        } catch (error) {
            reject(error);
        }
    };
}

export function mockBrowserGlobals() {
    (globalThis as any).alert = vi.fn();
}
