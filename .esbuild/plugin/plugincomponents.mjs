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
 * Core esbuild library for Moodle ESM components.
 *
 * This is the single source of all build logic. The Grunt tasks
 * (.grunt/tasks/react.js) import from here rather than duplicating
 * configuration or build steps.
 *
 * Source layout convention:
 *   <component>/js/esm/src/**\/*.{ts,tsx}  →  <component>/js/esm/build/**\/*.js
 *
 * Exports:
 *   createBuildConfig(isDev)           esbuild config object; pass isDev=true
 *                                      to disable minification / add sourcemaps.
 *   buildPluginComponents(isDev)       Glob for every js/esm/src tree across
 *                                      core and plugins, compile all in parallel.
 *   buildSingleFile(filePath, isDev)   Compile one source file; used by the
 *                                      Grunt watch task on incremental changes.
 *   watchComponents(isDev)             Start esbuild's native watch mode so the
 *                                      compiler rebuilds affected files on save.
 *   resolveComponentPaths(entry)       Map an absolute source path to its
 *                                      relative input path and output path.
 *
 * @copyright  2026 Adrian Greeve <adrian@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import esbuild from "esbuild";
import { glob } from "glob";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import cssModulesPlugin from "esbuild-css-modules-plugin";

const projectRoot = process.cwd();

/**
 * Resolve a path from the current project root.
 *
 * @param {...string} segments Path segments to resolve.
 * @returns {string} Absolute path from project root.
 */
const fromRoot = (...segments) => path.resolve(projectRoot, ...segments);

/**
 * Create an incremental dot progress indicator.
 * Prints one dot per completed build and wraps lines for readability.
 *
 * @param {number} total Total number of items to build.
 * @returns {{ start: () => void, tick: () => void, succeed: (msg: string) => void, fail: (msg: string) => void }}
 */
function createDotProgress(total) {
    const dotsPerLine = 60;
    let printed = 0;

    return {
        start: () => {
            process.stdout.write(`${chalk.cyan("Building")} `);
        },
        tick: () => {
            printed++;
            process.stdout.write(chalk.cyan("."));
            if (printed % dotsPerLine === 0 && printed < total) {
                process.stdout.write(` ${chalk.dim(`[${printed}/${total}]`)}\n`);
            }
        },
        succeed: (msg) => {
            process.stdout.write(`  ${chalk.dim(`[${printed}/${total}]`)}\n`);
            process.stdout.write(`${chalk.green("✓")} ${msg}\n`);
        },
        fail: (msg) => {
            process.stdout.write(`  ${chalk.dim(`[${printed}/${total}]`)}\n`);
            process.stdout.write(`${chalk.red("✗")} ${msg}\n`);
        },
    };
}

/**
 * Build a single React component entry file.
 *
 * @param {string} entry Absolute entry file path.
 * @param {import('esbuild').BuildOptions} buildConfig Shared esbuild configuration.
 * @returns {Promise<{file: string, output?: string, error: Error|null}>}
 */
async function buildComponent(entry, buildConfig) {
    const resolved = resolveComponentPaths(entry);
    if (!resolved) {
        return { file: entry, error: new Error(`Unknown path pattern: ${entry}`) };
    }

    const { file, output } = resolved;
    fs.mkdirSync(path.dirname(output), { recursive: true });

    try {
        await esbuild.build({
            ...buildConfig,
            entryPoints: [path.relative(projectRoot, entry)],
            outfile: output,
        });

        // Delete CSS side-effect files produced by esbuild's CSS pipeline.
        // With inject:true the styles are already embedded in the JS bundle,
        // so the separate .css file is redundant.
        const cssOutput = output.replace(/\.js$/, '.css');
        if (fs.existsSync(cssOutput)) {
            fs.unlinkSync(cssOutput);
        }

        return { file, output, error: null };
    } catch (error) {
        return { file, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Resolve source and output paths for a component entry.
 *
 * @param {string} entry Absolute component source path.
 * @returns {{file: string, output: string} | null} Relative file info and output path, or null for unsupported paths.
 */
export function resolveComponentPaths(entry) {
    const rel = path.relative(projectRoot, entry);

    if (rel.includes(path.join('esm', 'src'))) {

        const [part, rawFile] = rel.split(path.join('esm', 'src'));
        const file = rawFile.replace(/^[\/\\]/, '');

        // Directory-based components: src/local_reactdemo_card/index.tsx
        // compiles to build/local_reactdemo_card.js (not build/local_reactdemo_card/index.js).
        const normalized = file.replace(/\.(ts|tsx)$/, '.js');
        const output = normalized.endsWith(`${path.sep}index.js`) || normalized.endsWith('/index.js')
            ? fromRoot(part, 'esm', 'build', normalized.replace(/[/\\]index\.js$/, '.js'))
            : fromRoot(part, 'esm', 'build', normalized);

        return {file, output};
    }
    return null;
}

/**
 * Run all builds in parallel, showing incremental dot progress.
 *
 * @param {string[]} entryPoints Absolute entry file paths.
 * @param {import('esbuild').BuildOptions} buildConfig Shared esbuild configuration.
 * @returns {Promise<{errors: {file: string, output?: string, error: Error|null}[]}>}
 */
async function runParallelBuilds(entryPoints, buildConfig) {
    const total = entryPoints.length;
    /** @type {{file: string, output?: string, error: Error|null}[]} */
    const errors = [];
    const startTime = Date.now();

    const progress = createDotProgress(total);
    progress.start();

    await Promise.all(entryPoints.map(async (entry) => {
        const result = await buildComponent(entry, buildConfig);
        if (result.error) {
            errors.push(result);
        }
        progress.tick();
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const succeeded = total - errors.length;

    if (errors.length > 0) {
        progress.fail(`${succeeded}/${total} built · ${elapsed}s`);
        for (const e of errors) {
            console.error(chalk.red(`    ✗ ${e.file}: ${e.error?.message ?? ''}`));
        }
    } else {
        progress.succeed(chalk.bold(`${total} components built`) + chalk.dim(` · ${elapsed}s`));
    }

    return { errors };
}

/**
 * esbuild plugin that marks any @moodle-<themename>/lms/* import as external.
 *
 * esbuild's `external` option does not support patterns with more than one
 * wildcard, so `@moodle-* /lms/*` cannot be expressed there directly.  This
 * plugin intercepts all bare specifiers that match the pattern at resolve time
 * and marks them external so they are left as-is in the output bundle, relying
 * on the browser's import map to resolve them at runtime.
 *
 * @returns {import('esbuild').Plugin}
 */
function moodleThemeExternalPlugin() {
    return {
        name: 'moodle-theme-external',
        setup(build) {
            // Match any @moodle-<themename>/lms/ specifier. The filter uses a broad
            // RE2-compatible pattern; @moodle-original/lms/ is excluded in the
            // callback because esbuild/Go regex does not support negative lookahead.
            build.onResolve({filter: /^@moodle-[^/]+\/lms\//}, args => {
                if (args.path.startsWith('@moodle-original/lms/')) {
                    return null; // already handled by the static external list
                }
                return {path: args.path, external: true};
            });
        },
    };
}

/**
 * Create the shared esbuild build configuration.
 *
 * @param {boolean} isDev Whether development mode is enabled.
 * @returns {import('esbuild').BuildOptions} esbuild configuration object.
 */
export function createBuildConfig(isDev) {
    return {
        bundle: true,
        metafile: true,
        format: "esm",
        // absWorkingDir anchors relative entry points so the esbuild-css-modules-plugin
        // derives a stable buildId regardless of the machine's absolute path. Without
        // this, getBuildId() hashes the absolute entryPoints paths, producing a
        // different __css-content-HASH__ variable name on each machine and making
        // committed build files non-reproducible across environments.
        absWorkingDir: projectRoot,
        external: ["react", "react/*", "react-dom", "react-dom/*", "@moodlehq/design-system", "@moodlehq/design-system/*", "@moodle/lms", "@moodle/lms/*", "@moodle-original/lms", "@moodle-original/lms/*"],
        plugins: [cssModulesPlugin({ inject: true, localsConvention: 'camelCaseOnly' }), moodleThemeExternalPlugin()],
        jsx: "automatic",
        minify: !isDev,
        sourcemap: isDev ? 'inline' : false,
        jsxDev: isDev,
        keepNames: isDev,
        treeShaking: !isDev,
        define: { 'process.env.NODE_ENV': isDev ? '"development"' : '"production"' },
    };
}

/**
 * Build all plugin and core React components.
 *
 * @param {boolean} isDev Whether development mode is enabled.
 * @returns {Promise<void>}
 */
export async function buildPluginComponents(isDev) {
    console.log(chalk.green('> Building components...'));

    const allFiles = glob.sync("**/js/esm/src/**/*.{ts,tsx}", {
        cwd: projectRoot,
        absolute: true,
        ignore: [
            `${process.cwd()}/node_modules/**`,
            `${process.cwd()}/vendor/**`,
        ],
    });

    // Exclude internal files from directory-based components.
    // A file is internal when it is not index.tsx but lives in a directory
    // that contains an index.tsx — that directory is the entry point, not the file.
    const entryPoints = allFiles.filter(f => {
        const base = path.basename(f);
        if (base === 'index.tsx' || base === 'index.ts') {
            return true;
        }
        const dir = path.dirname(f);
        return !fs.existsSync(path.join(dir, 'index.tsx')) && !fs.existsSync(path.join(dir, 'index.ts'));
    });

    const buildConfig = createBuildConfig(isDev);

    const { errors } = await runParallelBuilds(entryPoints, buildConfig);

    if (errors.length > 0) {
        throw new Error(`React build failed: ${errors.length} component(s) could not be built`);
    }
}

/**
 * Start esbuild in native watch mode over all React components.
 *
 * Creates a single incremental build context for all entry points so that
 * esbuild can reuse its internal graph between rebuilds instead of starting
 * from scratch on every file change.
 *
 * @param {boolean} isDev Whether to build in development mode.
 * @param {((srcFiles: string[]) => void) | undefined} [onRebuild] Called with the rebuilt entry source
 *        files (relative to project root) after each non-initial successful rebuild. Use this to run
 *        follow-up tasks such as linting without coupling them to this module.
 * @returns {Promise<import('esbuild').BuildContext|null>} The active context, or null if no source files exist.
 */
export async function watchComponents(isDev, onRebuild) {
    const allFiles = glob.sync("**/js/esm/src/**/*.{ts,tsx}", {
        cwd: projectRoot,
        absolute: true,
        ignore: [
            `${process.cwd()}/node_modules/**`,
            `${process.cwd()}/vendor/**`,
        ],
    });

    // Exclude internal files from directory-based components (same rule as buildPluginComponents).
    const entryPoints = allFiles.filter(f => {
        const base = path.basename(f);
        if (base === 'index.tsx' || base === 'index.ts') {
            return true;
        }
        const dir = path.dirname(f);
        return !fs.existsSync(path.join(dir, 'index.tsx')) && !fs.existsSync(path.join(dir, 'index.ts'));
    });

    if (entryPoints.length === 0) {
        return null;
    }

    const buildConfig = createBuildConfig(isDev);

    // Map each source file to an {in, out} pair so esbuild can write each
    // component to its custom output directory while sharing a single context.
    // The 'out' path is relative to outdir (projectRoot) and has no extension —
    // esbuild appends the appropriate extension automatically.
    // Build entry pairs and ensure output directories exist in a single pass.
    const entryPairs = entryPoints.flatMap(entry => {
        const resolved = resolveComponentPaths(entry);
        if (!resolved) {
            return [];
        }
        fs.mkdirSync(path.dirname(resolved.output), { recursive: true });
        return [{ in: path.relative(projectRoot, entry), out: path.relative(projectRoot, resolved.output).replace(/\.js$/, '') }];
    });

    // Report build results to the terminal after every build (initial and on each change).
    // metafile: true populates result.metafile.outputs so we know which files were written.
    // On a rebuild only the affected outputs appear, so it effectively names the changed file.
    /** @type {import('esbuild').Plugin} */
    const watchReporter = {
        name: 'watch-reporter',
        setup(build) {
            let isInitial = true;
            let startTime = 0;

            build.onStart(() => {
                startTime = Date.now();
            });

            build.onEnd(result => {
                const now = new Date().toLocaleTimeString();
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

                if (result.errors.length > 0) {
                    console.error(chalk.red(`[${now}] ✗ Build failed (${result.errors.length} error(s))`) + chalk.dim(` · ${elapsed}s`));
                    return;
                }

                const outputs = Object.keys(result.metafile?.outputs ?? {});

                // Delete CSS side-effect files — with inject:true the styles are
                // already embedded in the JS bundle, so the CSS file is redundant.
                for (const outputPath of outputs) {
                    if (outputPath.endsWith('.css')) {
                        try { fs.unlinkSync(path.resolve(projectRoot, outputPath)); } catch { /* already gone */ }
                    }
                }

                const jsOutputs = outputs.filter(o => !o.endsWith('.css'));
                console.log(chalk.green(`[${now}] ✓ ${jsOutputs.length} component(s) built`) + chalk.dim(` · ${elapsed}s`));

                if (isInitial) {
                    isInitial = false;
                } else if (onRebuild) {
                    // entryPoint is the source file (relative to projectRoot) that triggered
                    // this rebuild. Pass it to the caller so they can run follow-up tasks
                    // (e.g. linting) without this module needing to know about them.
                    const srcFiles = Object.values(result.metafile?.outputs ?? {})
                        .map(output => output.entryPoint)
                        .filter(/** @param {string|undefined} f */ f => !!f);
                    onRebuild(/** @type {string[]} */ (srcFiles));
                }
            });
        },
    };

    const ctx = await esbuild.context({
        ...buildConfig,
        entryPoints: entryPairs,
        outdir: projectRoot,
        metafile: true,
        plugins: [...(buildConfig.plugins ?? []), watchReporter],
    });

    await ctx.watch();
    return ctx;
}
