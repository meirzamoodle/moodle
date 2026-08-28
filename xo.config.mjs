// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * XO configuration for Moodle TypeScript sources.
 *
 * XO lints TypeScript only. AMD and YUI JavaScript stay on ESLint via .eslintrc.
 * Run it with `grunt xo`, which supplies the source globs; XO is not invoked bare
 * because it would otherwise discover every .html and .md file in the tree.
 *
 * Every override below defers to a Moodle convention that XO's defaults contradict.
 * Do not add overrides for rules that are merely inconvenient — see MDLSITE-8249.
 *
 * @copyright  Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
    {
        files: ['**/js/esm/src/**/*.ts', '**/js/esm/src/**/*.tsx'],
        space: 4,
        rules: {
            // Moodle docblocks prefix continuation lines with an asterisk; XO defaults to 'never'.
            'jsdoc/require-asterisk-prefix': ['error', 'always'],

            // @license carries the GPL URL and @since carries a Moodle release, neither of which
            // is the SPDX expression or semver string this rule expects.
            'jsdoc/check-values': 'off',

            // An options bag still needs its own @param, but its keys are described once on
            // the options type. Repeating each key in the docblock duplicates that.
            'jsdoc/require-param': ['error', {
                // XO's defaults, with checkDestructured flipped off.
                ignoreWhenAllParamsMissing: true,
                contexts: ['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression'],
                autoIncrementBase: 0,
                checkConstructors: true,
                checkDestructured: false,
                checkDestructuredRoots: true,
                checkGetters: false,
                checkRestProperty: false,
                checkSetters: false,
            }],
            'jsdoc/check-param-names': ['error', {checkDestructured: false}],

            // The GPL boilerplate every file must carry cites http://moodle.org/ and
            // http://www.gnu.org/copyleft/gpl.html verbatim.
            'unicorn/prefer-https': 'off',

            // A module's filename is its public import specifier, so it follows Moodle module
            // naming (snake_case, as in core/react_autoinit) rather than XO's kebab-case.
            // React components are PascalCase and utility modules camelCase.
            'unicorn/filename-case': ['error', {cases: {camelCase: true, pascalCase: true, snakeCase: true}}],

            // These rules recommend Array#toSorted (ES2023) and Promise.withResolvers
            // (ES2024). Both are newer than the browsers listed under "browserslist" in
            // package.json, and esbuild sets no target, so neither is downlevelled or
            // polyfilled. Revisit when that list moves.
            'unicorn/no-array-sort': 'off',
            'unicorn/prefer-promise-with-resolvers': 'off',

            // The rule still expands the rest of its word list. These are exempt because
            // expanding them makes the name worse: "params" and "utils" are the published
            // option key and module name, "props" is React's own term for a component's
            // inputs, and "func"/"args" would become "function_"/"arguments_", which carry
            // a trailing underscore only to dodge a reserved word.
            'unicorn/name-replacements': ['error', {
                replacements: {
                    params: false, utils: false, func: false, args: false, props: false,
                },
            }],

            // Moodle option names mirror the server-side parameter names they are sent as
            // (loginrequired, nosessionupdate), so they do not carry an English boolean prefix.
            'unicorn/consistent-boolean-name': 'off',

            // Match the 132-column limit that .eslintrc applies to AMD and YUI sources.
            '@stylistic/max-len': ['error', {code: 132, tabWidth: 4, ignoreUrls: true}],

            // XO's strictCamelCase is kept for the names Moodle chooses. The relaxations
            // below cover names it does not choose, which cannot be renamed to satisfy a
            // linter without changing a wire format or an existing API.
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    // PascalCase is permitted because JSX resolves a lowercase tag to an
                    // HTML element, so a React component must start with a capital.
                    selector: ['variable', 'function'],
                    format: ['strictCamelCase', 'StrictPascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allowSingleOrDouble',
                    trailingUnderscore: 'allow',
                },
                {
                    selector: ['classProperty', 'parameterProperty', 'classMethod', 'objectLiteralMethod', 'accessor'],
                    format: ['strictCamelCase'],
                    leadingUnderscore: 'allowSingleOrDouble',
                    trailingUnderscore: 'allow',
                },
                {
                    // Object keys and type members frequently name something external: HTTP
                    // headers such as Accept, console.table column labels, log level maps,
                    // and the snake_case M.util and M.str globals these modules declare.
                    selector: ['objectLiteralProperty', 'typeMethod', 'typeProperty'],
                    format: null,
                },
                {
                    // Generic parameters follow the TypeScript T-prefix convention used by
                    // lib.es5.d.ts, which the Pending promise signatures mirror.
                    selector: 'typeParameter',
                    format: ['PascalCase'],
                },
                {selector: 'typeLike', format: ['StrictPascalCase']},
            ],
        },
    },
];

export default xoConfig;
