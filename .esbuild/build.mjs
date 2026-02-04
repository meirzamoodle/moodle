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
 * General build script
 *
 * @copyright  2026 Adrian Greeve
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import { generateAliases } from "./generate-aliases.mjs";
await generateAliases();

import { buildReactAutoInit } from './platform/react_autoinit.mjs';
import { buildPluginComponents } from "./plugin/plugincomponents.mjs";
import { buildMoodleDesignSystem } from "./platform/moodle_design_system.mjs";

const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const isWatch = args.includes('--watch');

console.log('═══════════════════════════════════════════');
console.log('Building Moodle React Components');
console.log('═══════════════════════════════════════════');
console.log(`Mode: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`Watch: ${isWatch ? 'ON' : 'OFF'}`);
console.log('═══════════════════════════════════════════\n');

const sharedDefine = {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
};

await buildReactAutoInit();

// The design system source may not be present (e.g. submodule not initialised).
// If it's missing, skip rebuilding and rely on the shipped platform bundle artefacts.
const designsystementry = path.resolve(process.cwd(), 'design-system/dist/index.es.js');
if (fs.existsSync(designsystementry)) {
    await buildMoodleDesignSystem();
} else {
    console.warn(`[esbuild] Skipping moodle-design-system build (missing: ${designsystementry})`);
}

await buildPluginComponents(isDev, sharedDefine, isWatch);
