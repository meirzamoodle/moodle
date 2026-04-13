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
 * Generates the component-alias section of tsconfig.aliases.json.
 *
 * Writes @moodle/lms/<component>/* and @moodle-original/lms/<component>/*
 * entries for every Moodle component that has a js/esm/src/ directory.
 * Swizzle theme aliases (@moodle-<theme>/lms/*) are managed separately by
 * grunt swizzle:manifest → generate-swizzle-manifest.mjs.
 *
 * tsconfig.json extends tsconfig.aliases.json, so TypeScript picks up the
 * mappings automatically. The file is skipped when the component section is
 * unchanged, to avoid unnecessary rebuilds.
 *
 * This must run before esbuild compilation. The Grunt `jsconfig` task calls
 * generateAliases() so that both jsconfig.json and tsconfig.aliases.json are
 * kept in sync. The `react` task depends on `jsconfig`, so aliases are always
 * up to date before a React build.
 *
 * @copyright  2026 Adrian Greeve <adrian@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import fs from "fs";
import path from "path";
import {createRequire} from "module";
import {readExistingAliases, writeTsconfigAliases, TSCONFIG_ALIASES_PATH} from "./tsconfig-aliases-writer.mjs";

/**
 * Load Moodle component paths from `.grunt/components.js`.
 *
 * @returns {Record<string, string>} Map of component paths to component names.
 */
function loadComponentPathMap() {
    const require = createRequire(import.meta.url);
    const {fetchComponentData} = require(path.join(process.cwd(), ".grunt", "components.js"));
    return fetchComponentData().components;
}

/**
 * Compare two TypeScript `paths` maps for exact equality.
 *
 * @param {Record<string, string[]>} a First paths map.
 * @param {Record<string, string[]>} b Second paths map.
 * @returns {boolean} True when keys and values match in order.
 */
function pathsEqual(a, b) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
            return false;
        }
        const aArr = a[key] ?? [];
        const bArr = b[key] ?? [];
        if (aArr.length !== bArr.length) {
            return false;
        }
        for (let i = 0; i < aArr.length; i++) {
            if (aArr[i] !== bArr[i]) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Generate the component-alias section of tsconfig.aliases.json.
 *
 * Preserves any existing swizzle theme aliases (section 2) already written
 * by grunt swizzle:manifest — only section 1 is replaced.
 * Skips rewriting when the component aliases have not changed.
 *
 * @returns {void}
 */
export function generateAliases() {
    const componentPathMap = loadComponentPathMap();

    // Build section 1: @moodle/lms/* and @moodle-original/lms/* for every component.
    /** @type {Record<string, string[]>} */
    const newJsconfigPaths = {
        // core is not in componentPathMap — add it explicitly.
        "@moodle/lms/core/*": ["./public/lib/js/esm/src/*"],
        "@moodle-original/lms/core/*": ["./public/lib/js/esm/src/*"],
    };

    for (const [componentPath, componentName] of Object.entries(componentPathMap)) {
        const target = `./${path.join(componentPath, "js", "esm", "src", "*").replace(/\\/g, "/")}`;
        newJsconfigPaths[`@moodle/lms/${componentName}/*`] = [target];
        newJsconfigPaths[`@moodle-original/lms/${componentName}/*`] = [target];
    }

    // Read the existing file to preserve the swizzle section and check for changes.
    const {jsconfigPaths: existingJsconfigPaths, swizzlePaths} = readExistingAliases();

    // Check whether the file already exists with the correct header format.
    const hasCorrectHeader = fs.existsSync(TSCONFIG_ALIASES_PATH) &&
        fs.readFileSync(TSCONFIG_ALIASES_PATH, 'utf8').startsWith('// WARNING: Do not edit');

    if (hasCorrectHeader && pathsEqual(existingJsconfigPaths, newJsconfigPaths)) {
        console.log("✓ Generating tsconfig.aliases.json was skipped. No component alias modifications detected.");
        return;
    }

    writeTsconfigAliases(newJsconfigPaths, swizzlePaths);
    console.log("✓ Generated tsconfig.aliases.json (component aliases)");
}
