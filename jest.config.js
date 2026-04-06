const {pathsToModuleNameMapper} = require('ts-jest');
const fs = require('fs');

// tsconfig.aliases.json uses JSONC (JSON with comments) — strip line comments before parsing.
const aliasesRaw = fs.readFileSync('./tsconfig.aliases.json', 'utf-8').replace(/\/\/[^\n]*/g, '');
const {compilerOptions} = JSON.parse(aliasesRaw);

/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'jsdom',
    clearMocks: true,
    testMatch: ['**/esm/tests/**/*.test.{ts,tsx}'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>/'}),
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {tsconfig: 'tsconfig.jest.json'}],
    },
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
};
