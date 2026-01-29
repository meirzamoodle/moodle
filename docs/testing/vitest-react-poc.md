# Vitest + React PoC (Moodle React Components)

This PoC validates that Vitest can run unit tests against Moodle's React TSX sources without changing the production esbuild build scripts.

## What was added

- `.vitest/vitest.config.mts`: Vitest/Vite config for tests (uses `@vitejs/plugin-react`)
- `.vitest/vitest.setup.ts`: Testing Library cleanup + jest-dom matchers
- Example tests under `public/**/react/src/**/__tests__/*.spec.tsx`

## Running the PoC

- `npm run test:react` (watch)
- `npm run test:react:run` (single run)

These scripts are configured to use `.vitest/vitest.config.mts` via the `--config` flag.

## Vite / Vitest config (no production esbuild changes)

Vitest uses Vite for transforms, so it does not need to touch `.esbuild/*` scripts.

- React/TSX handling is enabled via `@vitejs/plugin-react`.
- The test DOM environment is `jsdom`.

Note: `jsdom@27.4.0` expects Node `^22.12.0`.

## Mocking an imported helper (example)

This repo already has a component that imports a helper from another module:

- Component: `public/mod/book/react/src/mustache_test.tsx` (imports `withProfiler`)
- Test mocking the helper import: `public/mod/book/react/src/__tests__/mustache_test.spec.tsx`

Vitest module mocking is done via `vi.mock('<specifier>', factory)`. The call is hoisted, so it applies before the component module is evaluated.

To enable the profiler mock only when needed, call `mockProfiler()` from `public/lib/react/src/test-utils/mock_profiler.ts` and then dynamically import the module under test.

## Moodle environment glue

React components in Moodle often assume globals like `window.M.cfg` and the AMD `require` loader. For unit tests, mock these to avoid runtime errors and keep tests deterministic.

Helper utilities live in:

- `public/lib/react/src/test-utils/mock_moodle_globals.ts`

Example (manual usage in a test):

```ts
import { vi } from 'vitest';
import { mockAmdRequire, mockBrowserGlobals, mockMoodleGlobals } from '@moodle/core/test-utils/mock_moodle_globals';

mockMoodleGlobals({ contextid: 2 });
mockBrowserGlobals();
mockAmdRequire({
  'core/notification': { alert: vi.fn() },
});
```

These two are also applied globally in `.vitest/vitest.setup.ts`:

- `mockMoodleGlobals()`
- `mockBrowserGlobals()`

## Path aliases (esbuild -> Vitest)

### How aliases work today

- The production esbuild build uses a custom resolver plugin in `.esbuild/aliases.mjs`.
- TypeScript path aliases are generated into `tsconfig.aliases.json` by `.esbuild/generate-aliases.mjs`.
- `tsconfig.json` extends `tsconfig.aliases.json`.

Example aliases:

- `@moodle/core/*` -> `public/lib/react/src/*`
- `@moodle/local_multiplereact/*` -> `public/local/multiplereact/react/src/*`

### How Vitest picks them up

Vite/Vitest do not read esbuild plugins, so they will not automatically understand `.esbuild/aliases.mjs`.

For the PoC, alias support is provided by `vite-tsconfig-paths` in `.vitest/vitest.config.mts`, which reads `tsconfig.json` (and therefore also `tsconfig.aliases.json`).

This is why test imports like this work:

```ts
import Counter from '@moodle/local_multiplereact/local_multiplereact_counter';
```

If `tsconfig.aliases.json` is regenerated (new components), Vitest will automatically pick up the updated aliases on the next run.

## “Vite Workspaces” for Node code (mobileapp)

In Vitest v4, this capability is exposed as `test.projects` (previously called “workspace”). It lets you run multiple independent test projects (different roots, aliases, environments) in one `vitest` run.

This can be useful if you want:

- React component tests in a DOM-like environment (`jsdom`)
- Node tests (no DOM) for a separate package like `mobileapp`

Example shape:

```ts
// .vitest/vitest.config.mts
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'react',
          include: ['public/**/react/src/**/__tests__/**/*.spec.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'mobileapp',
          root: './mobileapp',
          include: ['src/**/*.spec.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
```

If `mobileapp/` has its own `vitest.config.*`, you can also point `projects` at that folder/config.
