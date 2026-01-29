import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'react',
                    environment: 'jsdom',
                    setupFiles: ['./.vitest/vitest.setup.ts'],
                    include: ['public/**/react/src/**/__tests__/**/*.spec.{ts,tsx}'],
                },
            },
            {
                extends: true,
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['mobileapp/**/*.spec.{ts,js}', '**/*.node.spec.{ts,js}'],
                },
            },
        ],
    },
});
