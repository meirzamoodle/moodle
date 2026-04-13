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
 * Swizzle support types for Moodle React components.
 *
 * Swizzling is Moodle's mechanism for themes to override React components,
 * analogous to the PHP renderer override system that has existed since Moodle 2.0.
 * The terminology ("wrap", "eject") is borrowed from Docusaurus but the underlying
 * concept is native to Moodle.
 *
 * ## Two override modes
 *
 * ### Eject
 * The theme provides a complete replacement component. The original is not rendered.
 * This is equivalent to how PHP renderer overrides work: the theme author takes full
 * ownership of the component and is responsible for keeping it up to date.
 *
 * ### Wrap
 * The theme decorates the original component — adding markup, injecting props, or
 * attaching side-effects — while still delegating the core render to the upstream
 * version. The original is imported via `@moodle-original/lms/<component>/<module>`,
 * which always resolves to the component directory's own built file regardless of
 * any theme override that may be active.
 *
 * ## Theme hierarchy
 *
 * When multiple themes form a chain (A → B → C → Core), the import map is built
 * server-side with a named alias for each ancestor:
 *
 *   `@moodle-original/lms/core/Button`  → core's Button (always)
 *   `@moodle-B/lms/core/Button`         → Theme B's version (or core if B doesn't override)
 *   `@moodle-C/lms/core/Button`         → Theme C's version (or core if C doesn't override)
 *   `@moodle/lms/core/Button`           → Theme A's version (the active theme wins)
 *
 * A wrapping component in Theme A imports `@moodle-B/lms/core/Button` to access its
 * direct parent. Using `@moodle-original/lms/` always reaches core, bypassing all
 * intermediate theme layers.
 *
 * ## Declaring swizzle support
 *
 * A plugin declares its swizzleable components in a central `swizzle.config.ts`
 * file inside `js/esm/src/`, analogous to `db/services.php` for web services or
 * `db/hooks.php` for hooks. Each key is the bare module name (without the plugin
 * prefix); the value is a `SwizzleConfig` describing the component's safety levels.
 *
 * ```ts
 * // local_reactdemo/js/esm/src/swizzle.config.ts
 * import type { SwizzlePluginConfig } from '@moodle/lms/core/swizzle';
 *
 * export const swizzleConfig = {
 *     local_reactdemo_button: {
 *         actions: { eject: 'safe', wrap: 'safe' },
 *         description: 'Primary action button with Moodle notification support.',
 *     },
 * } satisfies SwizzlePluginConfig;
 * ```
 *
 * Components not listed in `swizzle.config.ts` cannot be swizzled. Attempting to
 * override them via the theme override mechanism will be rejected at build time
 * by the `grunt swizzle:check` command.
 *
 * @module     core/swizzle
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Safety classification for a swizzle action.
 *
 * - `safe`: Stable across minor and patch releases. Override with confidence.
 *
 * - `unsafe`: Internal structure may change between minor releases. You must
 *   test after every upgrade. Moodle will call out breaking changes in upgrade
 *   notes where possible but cannot guarantee compatibility.
 *
 * - `forbidden`: This action is not supported for this component. The CLI will
 *   refuse to perform it.
 */
export type SwizzleSafety = 'safe' | 'unsafe' | 'forbidden';

/**
 * Per-action safety levels, matching the Docusaurus swizzle config format.
 *
 * Each action declares its own safety level independently — a component may
 * be safe to wrap but unsafe to eject, or vice versa.
 *
 * @example
 * ```ts
 * // Safe to both wrap and eject:
 * actions: { eject: 'safe', wrap: 'safe' }
 *
 * // Wrapping not supported (e.g. component owns a React context):
 * actions: { eject: 'unsafe', wrap: 'forbidden' }
 * ```
 */
export type SwizzleActions = {
    eject: SwizzleSafety;
    wrap: SwizzleSafety;
};

/**
 * Metadata exported by every swizzleable component as `swizzleConfig`.
 *
 * @example
 * ```ts
 * export const swizzleConfig = {
 *     actions: {
 *         eject: 'safe',
 *         wrap: 'safe',
 *     },
 *     description: 'Standard card layout container.',
 * } satisfies SwizzleConfig;
 * ```
 */
export type SwizzleConfig = {
    /**
     * Per-action safety levels for this component.
     * @see SwizzleActions
     */
    actions: SwizzleActions;

    /**
     * Human-readable description of the component and any override caveats.
     * Shown in `grunt swizzle:list` output and admin discovery UIs.
     */
    description: string;
};

/**
 * Shape of a plugin's central `swizzle.config.ts` export.
 *
 * Maps bare module names to their swizzle metadata. Analogous to
 * `db/services.php` for web services or `db/hooks.php` for hooks.
 *
 * @example
 * ```ts
 * export const swizzleConfig = {
 *     local_reactdemo_button: {
 *         actions: { eject: 'safe', wrap: 'safe' },
 *         description: 'Primary action button.',
 *     },
 * } satisfies SwizzlePluginConfig;
 * ```
 */
export type SwizzlePluginConfig = Record<string, SwizzleConfig>;
