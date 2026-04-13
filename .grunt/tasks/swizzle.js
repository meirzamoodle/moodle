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

/* jshint node: true, browser: false */
/* eslint-env node */
// @ts-nocheck

/**
 * Grunt tasks for the React component swizzle system.
 *
 * grunt swizzle          – interactive CLI: pick a component, pick wrap or eject
 * grunt swizzle:manifest – scan all components and write public/lib/swizzle-manifest.json
 * grunt swizzle:list     – print a human-readable table of swizzleable components
 *
 * The interactive swizzle task mirrors the Docusaurus `npm run swizzle` flow:
 *
 *   1. Select a component from the manifest (searchable list)
 *   2. Select an action: Wrap or Eject
 *      Wrap   – generates a scaffold that imports the nearest ancestor version
 *               (@moodle-[parentTheme]/lms/ if a parent has an override, otherwise
 *               @moodle-original/lms/ for core) and renders it unchanged, so you
 *               only write what differs
 *      Eject  – copies the original .tsx source file into the theme directory so
 *               you have full control (you own it from this point on)
 *   3. For Risky or Forbidden components, require --danger flag or abort
 *   4. Write the file to public/theme/<themeName>/js/esm/src/<component>/<module>.tsx
 *
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const path = require('path');
const fs = require('fs');
/** @param {string} text @returns {string} */
const green = (text) => `\x1b[32m${text}\x1b[0m`;
/** @param {string} text @returns {string} */
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;

/** Safety level display labels. */
const SAFETY_LABEL = {
    safe: '✓ Safe',
    unsafe: '⚠ Unsafe',
    forbidden: '✗ Forbidden',
};

/**
 * Load swizzle-manifest.json or throw with a helpful message.
 *
 * @param {string} rootDir Project root directory.
 * @returns {Record<string, {actions: {eject: string, wrap: string}, description: string}>}
 */
function loadManifest(rootDir) {
    const manifestPath = path.join(rootDir, 'public', 'lib', 'swizzle-manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error('swizzle-manifest.json not found. Run `grunt swizzle:manifest` first.');
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

/**
 * Derive the absolute path to a component's .tsx source file from its specifier.
 *
 * Specifier format: @moodle/lms/<component>/<module>
 * Source location:  public/<componentDir>/js/esm/src/<module>.tsx
 *
 * @param {string} specifier The bare module specifier.
 * @param {string} rootDir   Project root directory.
 * @returns {string|null} Absolute path to the source file, or null if not found.
 */
function resolveSourceFile(specifier, rootDir) {
    // Strip the @moodle/lms/ prefix.
    const subpath = specifier.replace(/^@moodle\/lms\//, '');
    const slashIdx = subpath.indexOf('/');
    if (slashIdx === -1) {
        return null;
    }
    const component = subpath.slice(0, slashIdx);
    const module = subpath.slice(slashIdx + 1);

    const {createRequire} = require('module');
    const req = createRequire(__filename);
    const {fetchComponentData} = req(path.join(rootDir, '.grunt', 'components.js'));
    const components = fetchComponentData().components;

    // components is a map of { relativePath: componentName }
    const componentPath = Object.entries(components).find(([, name]) => name === component)?.[0];
    if (!componentPath) {
        return null;
    }

    const candidates = [
        // Flat file: local_reactdemo_button.tsx
        path.join(rootDir, componentPath, 'js', 'esm', 'src', `${module}.tsx`),
        path.join(rootDir, componentPath, 'js', 'esm', 'src', `${module}.ts`),
        // Directory-based: local_reactdemo_card/index.tsx
        path.join(rootDir, componentPath, 'js', 'esm', 'src', module, 'index.tsx'),
        path.join(rootDir, componentPath, 'js', 'esm', 'src', module, 'index.ts'),
    ];
    return candidates.find(f => fs.existsSync(f)) ?? null;
}

/**
 * Return all source files that belong to a component module.
 *
 * - Flat component (local_reactdemo_button.tsx): returns the .tsx and any
 *   co-located files sharing the same stem (e.g. local_reactdemo_button.css).
 * - Directory-based component (local_reactdemo_card/index.tsx): returns every
 *   file in the directory so the theme gets a complete, self-contained copy.
 *
 * @param {string} specifier The bare module specifier.
 * @param {string} rootDir   Project root directory.
 * @returns {{ primary: string, extras: string[] } | null}
 */
function resolveSourceFiles(specifier, rootDir) {
    const primary = resolveSourceFile(specifier, rootDir);
    if (!primary) {
        return null;
    }

    const isDirectoryBased = path.basename(primary).replace(/\.(ts|tsx)$/, '') === 'index';

    if (isDirectoryBased) {
        // Directory-based: copy every file in the directory.
        const dir = path.dirname(primary);
        const extras = fs.readdirSync(dir)
            .filter(name => path.join(dir, name) !== primary)
            .map(name => path.join(dir, name));
        return {primary, extras};
    }

    // Flat: copy co-located files with the same stem (e.g. .css).
    const stem = primary.slice(0, primary.lastIndexOf('.'));
    const dir = path.dirname(primary);
    const extras = fs.readdirSync(dir)
        .filter(name => {
            const full = path.join(dir, name);
            return full !== primary && full.startsWith(stem + '.');
        })
        .map(name => path.join(dir, name));

    return {primary, extras};
}

/**
 * Return the destination path inside the theme's ESM source tree.
 *
 * - Flat:             public/theme/<theme>/js/esm/src/<component>/<module>.tsx
 * - Directory-based:  public/theme/<theme>/js/esm/src/<component>/<module>/index.tsx
 *
 * @param {string} specifier  The bare module specifier.
 * @param {string} themeName  Moodle theme name (e.g. 'boost').
 * @param {string} rootDir    Project root directory.
 * @returns {string} Absolute destination path.
 */
function resolveDestFile(specifier, themeName, rootDir) {
    const subpath = specifier.replace(/^@moodle\/lms\//, '');
    const slashIdx = subpath.indexOf('/');
    const component = subpath.slice(0, slashIdx);
    const module = subpath.slice(slashIdx + 1);

    const srcFile = resolveSourceFile(specifier, rootDir);
    const isDirectoryBased = srcFile && path.basename(srcFile).replace(/\.(ts|tsx)$/, '') === 'index';

    if (isDirectoryBased) {
        return path.join(rootDir, 'public', 'theme', themeName, 'js', 'esm', 'src', component, module, 'index.tsx');
    }
    return path.join(rootDir, 'public', 'theme', themeName, 'js', 'esm', 'src', component, `${module}.tsx`);
}

/**
 * Generate the wrap scaffold content for a component.
 *
 * Mirrors what Docusaurus generates for its wrap action: a minimal file that
 * imports the "original" and renders it, leaving room for the developer to add
 * decorators, context providers, or side-effects.
 *
 * The parentImport specifier is resolved by resolveParentImport() before this
 * function is called, so the scaffold correctly targets the nearest ancestor
 * that has an override rather than always jumping to core.
 *
 * @param {string} specifier    The bare module specifier being wrapped.
 * @param {string} themeName    Moodle theme name.
 * @param {string} parentImport The resolved import specifier for the "original"
 *   (e.g. @moodle-boost/lms/... or @moodle-original/lms/...).
 * @returns {string} TypeScript source for the wrapper file.
 */
function generateWrapScaffold(specifier, themeName, parentImport) {
    const subpath = specifier.replace(/^@moodle\/lms\//, '');
    const slashIdx = subpath.indexOf('/');
    const component = subpath.slice(0, slashIdx);
    const module = subpath.slice(slashIdx + 1);

    const isNamedParent = !parentImport.startsWith('@moodle-original/');
    const importComment = isNamedParent
        ? `// ${parentImport} resolves to the immediate parent theme's version of this\n// component, preserving the full theme override chain.`
        : `// ${parentImport} resolves to the core (upstream) version of this\n// component, bypassing any active theme overrides.`;

    return `// This file was generated by \`grunt swizzle\`.
// It wraps the original component — edit freely.
${importComment}
//
// To revert to the original, delete this file and rebuild.

import type {Props} from '${parentImport}';
import OriginalComponent from '${parentImport}';

/**
 * ${themeName} theme wrapper for ${module}.
 *
 * Renders the original component unchanged. Add your customisations here:
 *   - Extra markup before or after the original
 *   - Additional props or context
 *   - Side-effects (analytics, logging, etc.)
 *
 * @module     theme_${themeName}/${component}/${module}
 */
export default function ${toPascalCase(module)}(props: Props) {
    return (
        <>
            {/* TODO: add your customisation around the original */}
            <OriginalComponent {...props} />
        </>
    );
}
`;
}

/**
 * Convert a snake_case or kebab-case string to PascalCase.
 *
 * @param {string} str Input string.
 * @returns {string} PascalCase version.
 */
function toPascalCase(str) {
    return str.replace(/(?:^|[_-])([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Read the parent theme chain from a theme's config.php.
 *
 * Parses the $THEME->parents = [...] assignment. Returns an empty array when
 * the config file does not exist or declares no parents.
 *
 * @param {string} themeName Theme name (e.g. 'classic').
 * @param {string} rootDir   Project root directory.
 * @returns {string[]} Ordered parent names, closest first (same order as $THEME->parents).
 */
function readThemeParents(themeName, rootDir) {
    const configPath = path.join(rootDir, 'public', 'theme', themeName, 'config.php');
    if (!fs.existsSync(configPath)) {
        return [];
    }
    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/\$THEME\s*->\s*parents\s*=\s*\[([^\]]*)\]/);
    if (!match) {
        return [];
    }
    return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
}

/**
 * Resolve the import specifier a wrap scaffold should use to reach the "original".
 *
 * Walks the theme's parent chain and checks whether any parent already has a
 * compiled override in its js/esm/build/ directory for the given specifier.
 *
 *   - If the immediate parent (or the nearest ancestor) has the build file,
 *     return @moodle-<parentTheme>/lms/<subpath> so the chain is respected:
 *     classic wraps boost, boost wraps core.
 *   - If no parent has an override, return @moodle-original/lms/<subpath>
 *     which always resolves to core regardless of active theme.
 *
 * @param {string} specifier The bare module specifier being wrapped (e.g. @moodle/lms/local_reactdemo/local_reactdemo_button).
 * @param {string} themeName The theme that will own the wrapper.
 * @param {string} rootDir   Project root directory.
 * @returns {string} The import specifier the scaffold should use.
 */
function resolveParentImport(specifier, themeName, rootDir) {
    const subpath = specifier.replace(/^@moodle\/lms\//, '');
    const parents = readThemeParents(themeName, rootDir);

    for (const parent of parents) {
        const buildFile = path.join(
            rootDir, 'public', 'theme', parent,
            'js', 'esm', 'build', `${subpath}.js`,
        );
        if (fs.existsSync(buildFile)) {
            return specifier.replace('@moodle/lms/', `@moodle-${parent}/lms/`);
        }
    }

    // No parent has a compiled override — fall back directly to core.
    return specifier.replace('@moodle/lms/', '@moodle-original/lms/');
}

/**
 * Discover theme names that exist in public/theme/.
 *
 * @param {string} rootDir Project root directory.
 * @returns {string[]} Theme names.
 */
function discoverThemes(rootDir) {
    const themeRoot = path.join(rootDir, 'public', 'theme');
    if (!fs.existsSync(themeRoot)) {
        return [];
    }
    return fs.readdirSync(themeRoot).filter(name => {
        return fs.statSync(path.join(themeRoot, name)).isDirectory()
            && fs.existsSync(path.join(themeRoot, name, 'config.php'));
    });
}

module.exports = (grunt) => {
    const rootDir = process.cwd();

    // -------------------------------------------------------------------------
    // grunt swizzle — interactive CLI
    // -------------------------------------------------------------------------
    grunt.registerTask(
        'swizzle',
        'Interactively wrap or eject a React component into your theme',
        function() {
            const done = this.async();
            const args = this.args; // e.g. ['--danger'] via grunt swizzle:danger

            (async() => {
                const {default: inquirer} = await import('inquirer');
                const Enquirer = require('enquirer');

                // 1. Load manifest.
                let manifest;
                try {
                    manifest = loadManifest(rootDir);
                } catch (err) {
                    grunt.log.error(err.message);
                    done(false);
                    return;
                }

                const allEntries = Object.entries(manifest);
                if (allEntries.length === 0) {
                    grunt.log.writeln('No swizzleable components found in the manifest.');
                    done();
                    return;
                }

                const isDanger = args.includes('danger');

                // 2. Select component.
                const componentEntries = allEntries
                    .filter(([, cfg]) => isDanger || (cfg.actions.eject !== 'forbidden' || cfg.actions.wrap !== 'forbidden'));

                if (componentEntries.length === 0) {
                    grunt.log.error('No components available. Use grunt swizzle:danger to include Forbidden components.');
                    done(false);
                    return;
                }

                // Enquirer AutoComplete supports multi-line choices and shows a
                // "(Move up and down to reveal more choices)" footer automatically
                // when the list is longer than limit.
                grunt.log.writeln("  If a component you expect is missing, run `grunt swizzle:manifest` to force a full regeneration.\n");
                const {specifier} = await Enquirer.prompt({
                    type: 'autocomplete',
                    name: 'specifier',
                    message: 'Which component do you want to swizzle?',
                    limit: 4,
                    footer: '\n  (Move up and down to reveal more choices)',
                    choices: componentEntries.map(([spec, cfg]) => ({
                        name: spec,
                        hint: `\n    ${cfg.description}\n    eject:${SAFETY_LABEL[cfg.actions.eject] ?? cfg.actions.eject}  wrap:${SAFETY_LABEL[cfg.actions.wrap] ?? cfg.actions.wrap}`,
                        value: spec,
                    })),
                });

                const componentConfig = manifest[specifier];

                // 3. Safety gate for risky components (not danger mode).
                if ((componentConfig.actions.eject === 'unsafe' || componentConfig.actions.wrap === 'unsafe') && !isDanger) {
                    const {confirmed} = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'confirmed',
                        message: `⚠  ${specifier} has unsafe actions — internals may change between minor releases.\n  Continue anyway?`,
                        default: false,
                    }]);
                    if (!confirmed) {
                        grunt.log.writeln('Aborted.');
                        done();
                        return;
                    }
                }

                // 4. Select action.
                const actionChoices = [];

                if (componentConfig.actions.wrap !== 'forbidden') {
                    actionChoices.push({
                        name: `Wrap   – generate a scaffold that decorates the original [${componentConfig.actions.wrap}]`,
                        value: 'wrap',
                        short: 'Wrap',
                    });
                }
                if (componentConfig.actions.eject !== 'forbidden') {
                    actionChoices.push({
                        name: `Eject  – copy the original source into your theme (you own it from now on) [${componentConfig.actions.eject}]`,
                        value: 'eject',
                        short: 'Eject',
                    });
                }
                actionChoices.push({
                    name: yellow('Exit   – cancel and do nothing'),
                    value: 'exit',
                    short: 'Exit',
                });

                const {action} = await inquirer.prompt([{
                    type: 'list',
                    name: 'action',
                    message: 'Which swizzle action do you want?',
                    choices: actionChoices,
                }]);

                if (action === 'exit') {
                    grunt.log.writeln('Aborted.');
                    done();
                    return;
                }

                // 5. Select theme.
                const themes = discoverThemes(rootDir);
                if (themes.length === 0) {
                    grunt.log.error('No themes found in public/theme/. Create a theme first.');
                    done(false);
                    return;
                }

                const {themeName} = await inquirer.prompt([{
                    type: 'list',
                    name: 'themeName',
                    message: 'Which theme should receive the override?',
                    choices: themes,
                }]);

                // 6. Resolve destination and check for existing file.
                const destFile = resolveDestFile(specifier, themeName, rootDir);

                if (fs.existsSync(destFile)) {
                    const {overwrite} = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'overwrite',
                        message: `${path.relative(rootDir, destFile)} already exists. Overwrite?`,
                        default: false,
                    }]);
                    if (!overwrite) {
                        grunt.log.writeln('Aborted.');
                        done();
                        return;
                    }
                }

                // 7. Perform the action.
                fs.mkdirSync(path.dirname(destFile), {recursive: true});

                if (action === 'eject') {
                    const sourceFiles = resolveSourceFiles(specifier, rootDir);
                    if (!sourceFiles) {
                        grunt.log.error(`Could not locate source file for ${specifier}`);
                        done(false);
                        return;
                    }
                    fs.mkdirSync(path.dirname(destFile), {recursive: true});
                    fs.copyFileSync(sourceFiles.primary, destFile);
                    grunt.log.ok(`Ejected → ${path.relative(rootDir, destFile)}`);
                    for (const extra of sourceFiles.extras) {
                        const extraDest = path.join(path.dirname(destFile), path.basename(extra));
                        fs.copyFileSync(extra, extraDest);
                        grunt.log.ok(`        → ${path.relative(rootDir, extraDest)}`);
                    }
                    grunt.log.writeln('  The original source has been copied into your theme.');
                    grunt.log.writeln('  You now own these files — keep them up to date after Moodle upgrades.');
                } else {
                    // For directory-based components, remove any stale files left by a prior eject
                    // (e.g. CardContent.tsx when switching from eject → wrap).
                    const srcFile = resolveSourceFile(specifier, rootDir);
                    const isDirectoryBased = srcFile && path.basename(srcFile).replace(/\.(ts|tsx)$/, '') === 'index';
                    if (isDirectoryBased) {
                        const destDir = path.dirname(destFile);
                        if (fs.existsSync(destDir)) {
                            for (const name of fs.readdirSync(destDir)) {
                                const full = path.join(destDir, name);
                                if (full !== destFile) {
                                    fs.unlinkSync(full);
                                    grunt.log.ok(`Removed stale → ${path.relative(rootDir, full)}`);
                                }
                            }
                        }
                    }
                    const parentImport = resolveParentImport(specifier, themeName, rootDir);
                    const scaffold = generateWrapScaffold(specifier, themeName, parentImport);
                    fs.writeFileSync(destFile, scaffold);
                    grunt.log.ok(`Wrapped → ${path.relative(rootDir, destFile)}`);
                    grunt.log.writeln('  A scaffold has been generated. Edit it to add your customisations.');
                    grunt.log.writeln(`  The upstream component is imported via: ${parentImport}`);
                }

                grunt.log.writeln('');
                grunt.log.writeln(`  Next step: run \`grunt react[:dev]\` to compile the override.`);
                done();
            })().catch(err => {
                grunt.log.error(err.message);
                done(false);
            });
        }
    );

    // -------------------------------------------------------------------------
    // grunt swizzle:manifest
    // -------------------------------------------------------------------------
    grunt.registerTask('swizzle:manifest', 'Generate swizzle-manifest.json', async function() {
        const done = this.async();
        try {
            const {generateSwizzleManifest} = await import('../../.esbuild/generate-swizzle-manifest.mjs');
            generateSwizzleManifest();
            done();
        } catch (err) {
            grunt.log.error(err.message);
            done(false);
        }
    });

    // -------------------------------------------------------------------------
    // grunt swizzle:list
    // -------------------------------------------------------------------------
    grunt.registerTask('swizzle:list', 'List swizzleable React components', function() {
        let manifest;
        try {
            manifest = loadManifest(rootDir);
        } catch (err) {
            grunt.log.error(err.message);
            return false;
        }

        const entries = Object.entries(manifest);
        if (entries.length === 0) {
            grunt.log.writeln('No swizzleable components found.');
            return;
        }

        // Use terminal width when available, fall back to 80.
        const termWidth = process.stdout.columns ?? 80;

        grunt.log.writeln(`\nSwizzleable React components (${entries.length})\n`);

        for (const [specifier, config] of entries) {
            const ejectLabel = SAFETY_LABEL[config.actions.eject] ?? config.actions.eject;
            const wrapLabel  = SAFETY_LABEL[config.actions.wrap]  ?? config.actions.wrap;

            // Component name line — green.
            process.stdout.write(`  ${green(specifier)}\n`);

            // Description, word-wrapped to terminal width with a 6-space indent.
            const indent = '      ';
            const maxWidth = termWidth - indent.length;
            const words = config.description.split(' ');
            let line = '';
            for (const word of words) {
                if (line.length + word.length + 1 > maxWidth) {
                    grunt.log.writeln(`${indent}${line.trimEnd()}`);
                    line = word + ' ';
                } else {
                    line += word + ' ';
                }
            }
            if (line.trim()) {
                grunt.log.writeln(`${indent}${line.trimEnd()}`);
            }

            // Badge line — eject and wrap safety side by side.
            grunt.log.writeln(`${indent}eject: ${ejectLabel}   wrap: ${wrapLabel}`);

            grunt.log.writeln('');
        }

        grunt.log.writeln(`  Run \`grunt swizzle\` to override a component.`);
        grunt.log.writeln(`  If a component you expect is missing, run \`grunt swizzle:manifest\` to force a full regeneration.`);
    });
};
