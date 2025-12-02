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
 * Handles react import aliases
 *
 * @copyright  2025 Adrian Greeve
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


import path from "path";
import fs from "fs";

const rootDir = process.cwd();
const tsconfigPath = path.join(rootDir, "tsconfig.aliases.json");

// Load and normalise paths from tsconfig.aliases.json
function loadAliasMapFromTsconfig() {
    if (!fs.existsSync(tsconfigPath)) {
        return {};
    }

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
    const paths = tsconfig.compilerOptions?.paths ?? {};

    const aliasMap = {};

    for (const [pattern, targets] of Object.entries(paths)) {
        if (!Array.isArray(targets) || targets.length === 0) {
            continue;
        }

        const rawAlias = pattern.replace(/\/\*$/, ""); // "@moodle/core"
        const firstTarget = targets[0];               // "public/lib/react/src/*"
        const targetDirPattern = firstTarget.replace(/\/\*$/, ""); // "public/lib/react/src"

        const absTargetDir = path.join(rootDir, targetDirPattern);
        aliasMap[rawAlias] = absTargetDir;
    }

    return aliasMap;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createAliasPlugin() {
    return {
        name: "moodle-aliases",
        setup(build) {
            const aliasMap = loadAliasMapFromTsconfig();

            // Sort by length DESC so more specific aliases win
            const entries = Object.entries(aliasMap).sort(
                ([a], [b]) => b.length - a.length
            );

            entries.forEach(([alias, targetDir]) => {
                // Alias must be followed by "/" or end-of-string
                // e.g. "@moodle/core_calendar/Button.js" matches
                // but "@moodle/core_calendar" will not match "@moodle/core"
                const filter = new RegExp(
                    `^${escapeRegExp(alias)}(?:$|/).*`
                );

                build.onResolve({ filter }, async (args) => {
                    const relPath = args.path.slice(alias.length); // "/Button.js" or ""
                    const importPath = relPath ? `.${relPath}` : ".";

                    return await build.resolve(importPath, {
                        resolveDir: targetDir,
                        kind: args.kind,
                    });
                });
            });
        },
    };
}
