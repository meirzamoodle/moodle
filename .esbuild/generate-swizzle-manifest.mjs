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
 * Generates swizzle-manifest.json — the discovery index for all swizzleable
 * React components across the Moodle codebase.
 *
 * A component is included in the manifest when its source file exports a
 * `swizzleConfig` constant (see core/swizzle.ts for the full type definition).
 * The manifest is consumed by:
 *
 *   - `grunt swizzle:list`   — developer CLI to browse overrideable components
 *   - Admin UI              — a Moodle page listing components by safety level
 *   - Theme tooling         — validates that a theme override targets a known,
 *                             non-forbidden component
 *
 * The manifest intentionally extracts only the metadata declared in the source;
 * it does not execute any component code.
 *
 * Output: public/lib/swizzle-manifest.json
 *
 * Schema:
 * ```json
 * {
 *   "@moodle/lms/local_reactdemo/local_reactdemo_button": {
 *     "safety": "safe",
 *     "description": "Demo action button that triggers a Moodle notification popup.",
 *     "wrappable": true
 *   }
 * }
 * ```
 *
 * Usage:
 *   node .esbuild/generate-swizzle-manifest.mjs
 *
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import fs from 'fs';
import path from 'path';
import {createRequire} from 'module';
import {readExistingAliases, writeTsconfigAliases} from './tsconfig-aliases-writer.mjs';

const rootDir = process.cwd();
const outFile = path.join(rootDir, 'public', 'lib', 'swizzle-manifest.json');

/**
 * Regex that matches the opening of the swizzleConfig export.
 *
 * Matches patterns such as:
 *   export const swizzleConfig = { ... } satisfies SwizzlePluginConfig;
 *   export const swizzleConfig: SwizzlePluginConfig = { ... };
 */
const SWIZZLE_EXPORT_RE = /export\s+const\s+swizzleConfig\s*[=:]/;

/**
 * Known safety values — used to validate what was parsed.
 *
 * @type {ReadonlySet<string>}
 */
const VALID_SAFETY = new Set(['safe', 'unsafe', 'forbidden']);

/**
 * Load Moodle component paths from `.grunt/components.js`.
 *
 * @returns {Record<string, string>} Map of relative component path → component name.
 */
function loadComponentPathMap() {
    const require = createRequire(import.meta.url);
    const {fetchComponentData} = require(path.join(rootDir, '.grunt', 'components.js'));
    return fetchComponentData().components;
}

/**
 * Extract the top-level object literal from a source file's swizzleConfig export.
 *
 * Uses brace counting to handle nested objects without a full parser. Returns
 * the raw text of the outer object so callers can do further extraction on it.
 *
 * @param {string} source Full file source text (may be pre-stripped of comments).
 * @returns {string|null} Raw text of the outer `{ … }` block, or null if not found.
 */
function extractOuterObject(source) {
    const match = SWIZZLE_EXPORT_RE.exec(source);
    if (!match) {
        return null;
    }

    const openIdx = source.indexOf('{', match.index + match[0].length);
    if (openIdx === -1) {
        return null;
    }

    let depth = 0;
    let closeIdx = -1;
    for (let i = openIdx; i < source.length; i++) {
        if (source[i] === '{') {
            depth++;
        } else if (source[i] === '}') {
            depth--;
            if (depth === 0) {
                closeIdx = i;
                break;
            }
        }
    }

    return closeIdx === -1 ? null : source.slice(openIdx, closeIdx + 1);
}

/**
 * Extract a single SwizzleConfig entry from an object literal text.
 *
 * Expects text in the shape: `{ actions: { eject: '...', wrap: '...' }, description: '...' }`.
 *
 * @param {string} objectText Raw text of one component's config object.
 * @returns {{ actions: { eject: string, wrap: string }, description: string } | null}
 */
function extractSingleConfig(objectText) {
    const ejectMatch = /eject\s*:\s*'(safe|unsafe|forbidden)'/.exec(objectText);
    const wrapMatch = /wrap\s*:\s*'(safe|unsafe|forbidden)'/.exec(objectText);
    const descriptionMatch = /description\s*:\s*'([^']*)'/.exec(objectText)
        ?? /description\s*:\s*"([^"]*)"/.exec(objectText);

    if (!ejectMatch || !wrapMatch || !descriptionMatch) {
        return null;
    }
    if (!VALID_SAFETY.has(ejectMatch[1]) || !VALID_SAFETY.has(wrapMatch[1])) {
        return null;
    }

    return {
        actions: {eject: ejectMatch[1], wrap: wrapMatch[1]},
        description: descriptionMatch[1],
    };
}

/**
 * Parse a `swizzle.config.ts` file (SwizzlePluginConfig shape).
 *
 * The file exports a single `swizzleConfig` object whose keys are bare module
 * names and whose values are SwizzleConfig entries:
 *
 * ```ts
 * export const swizzleConfig = {
 *     local_reactdemo_button: {
 *         actions: { eject: 'safe', wrap: 'safe' },
 *         description: '...',
 *     },
 * } satisfies SwizzlePluginConfig;
 * ```
 *
 * @param {string} source Full file source text.
 * @returns {Record<string, { actions: { eject: string, wrap: string }, description: string }>}
 */
function parsePluginConfig(source) {
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const outerText = extractOuterObject(stripped);
    if (!outerText) {
        return {};
    }

    /** @type {Record<string, { actions: { eject: string, wrap: string }, description: string }>} */
    const result = {};

    // Match each top-level key and its object value using brace counting.
    // Key pattern: an identifier (module name) followed by a colon.
    const keyRe = /\b(\w+)\s*:/g;
    let keyMatch;
    while ((keyMatch = keyRe.exec(outerText)) !== null) {
        const key = keyMatch[1];
        // Skip known sub-keys that aren't component names.
        if (key === 'actions' || key === 'eject' || key === 'wrap' || key === 'description') {
            continue;
        }

        const openIdx = outerText.indexOf('{', keyMatch.index + keyMatch[0].length);
        if (openIdx === -1) {
            continue;
        }

        // Extract the value object for this key via brace counting.
        let depth = 0;
        let closeIdx = -1;
        for (let i = openIdx; i < outerText.length; i++) {
            if (outerText[i] === '{') {
                depth++;
            } else if (outerText[i] === '}') {
                depth--;
                if (depth === 0) {
                    closeIdx = i;
                    break;
                }
            }
        }
        if (closeIdx === -1) {
            continue;
        }

        const entryText = outerText.slice(openIdx, closeIdx + 1);
        const config = extractSingleConfig(entryText);
        if (config) {
            result[key] = config;
        }
    }

    return result;
}

/**
 * Scan a component's js/esm/swizzle.config.ts for swizzleable components.
 *
 * Analogous to how Moodle reads db/services.php or db/hooks.php — the plugin
 * declares all swizzleable components in one central file that sits alongside
 * the src/ and build/ directories rather than inside them.
 *
 * @param {string} componentName Moodle component name (e.g. `local_reactdemo`).
 * @param {string} esmDir Absolute path to the component's js/esm/ directory.
 * @param {Record<string, object>} manifest Accumulator — entries are added in place.
 * @returns {void}
 */
function scanComponent(componentName, esmDir, manifest) {
    const configFile = path.join(esmDir, 'swizzle.config.ts');
    if (!fs.existsSync(configFile)) {
        return; // No swizzle config — component has no swizzleable components.
    }

    const source = fs.readFileSync(configFile, 'utf8');
    const entries = parsePluginConfig(source);

    for (const [moduleName, config] of Object.entries(entries)) {
        // e.g. local_reactdemo_button → @moodle/lms/local_reactdemo/local_reactdemo_button
        const specifier = `@moodle/lms/${componentName}/${moduleName}`;
        manifest[specifier] = config;
    }
}

/**
 * Discover all installed themes by looking for config.php.
 *
 * Using config.php (not js/esm/src/) means a newly installed theme gets
 * aliases immediately after `grunt swizzle:manifest` — even before it has
 * created any React override files.
 *
 * @returns {string[]} Theme names.
 */
function loadThemeNames() {
    const themeRoot = path.join(rootDir, 'public', 'theme');
    if (!fs.existsSync(themeRoot)) {
        return [];
    }
    return fs.readdirSync(themeRoot).filter(name =>
        fs.existsSync(path.join(themeRoot, name, 'config.php'))
    );
}

/**
 * Rebuild the swizzle section of tsconfig.aliases.json.
 *
 * Emits one @moodle-<theme>/lms/<component>/* entry per theme × component,
 * mirroring the full scope of section 1. The theme src/ is checked first so
 * TypeScript resolves override types; the component's own src/ is the fallback
 * so imports compile even before an override file exists.
 *
 * Preserves the jsconfig section (section 1) already written by grunt jsconfig.
 *
 * @param {Record<string, string>} componentPathMap Component path → component name map.
 * @returns {void}
 */
function updateSwizzleAliases(componentPathMap) {
    const themeNames = loadThemeNames();

    /** @type {Record<string, string[]>} */
    const newSwizzlePaths = {};

    // core is not in componentPathMap — add it explicitly.
    for (const themeName of themeNames) {
        newSwizzlePaths[`@moodle-${themeName}/lms/core/*`] = [
            `./public/theme/${themeName}/js/esm/src/*`,
            './public/lib/js/esm/src/*',
        ];
    }

    for (const [componentPath, componentName] of Object.entries(componentPathMap)) {
        const componentSrc = `./${componentPath.replace(/\\/g, '/')}/js/esm/src/*`;
        for (const themeName of themeNames) {
            newSwizzlePaths[`@moodle-${themeName}/lms/${componentName}/*`] = [
                `./public/theme/${themeName}/js/esm/src/*`,
                componentSrc,
            ];
        }
    }

    const {jsconfigPaths} = readExistingAliases();
    writeTsconfigAliases(jsconfigPaths, newSwizzlePaths);
}

/**
 * Generate and write swizzle-manifest.json.
 *
 * @returns {void}
 */
export function generateSwizzleManifest() {
    const componentPathMap = loadComponentPathMap();

    /** @type {Record<string, object>} */
    const manifest = {};

    // Always scan core (public/lib is not listed in componentPathMap the same way).
    scanComponent('core', path.join(rootDir, 'public', 'lib', 'js', 'esm'), manifest);

    for (const [componentPath, componentName] of Object.entries(componentPathMap)) {
        const esmDir = path.join(rootDir, componentPath, 'js', 'esm');
        scanComponent(componentName, esmDir, manifest);
    }

    // Sort specifiers for a stable, diff-friendly output.
    const sorted = Object.fromEntries(
        Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))
    );

    fs.writeFileSync(outFile, JSON.stringify(sorted, null, 2) + '\n');
    const count = Object.keys(sorted).length;
    console.log(`✓ Generated swizzle-manifest.json (${count} swizzleable component${count !== 1 ? 's' : ''})`);

    updateSwizzleAliases(componentPathMap);
    console.log('✓ Generated tsconfig.aliases.json (swizzle theme aliases)');
}

// Consumed by the Grunt `swizzle` task. To invoke directly after `npm install`:
//   node .esbuild/generate-swizzle-manifest.mjs
