<?php
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

namespace core\output\requirements;

/**
 * The import map requirement class, which defines the import map for ES module loading.
 *
 * This class is responsible for defining the import map that will be used by the ES module loader to
 * resolve module specifiers to URLs.
 *
 * A default loader URL should be set for the import map, which will be used for any specifiers
 * that do not have a specific loader defined.
 *
 * The import map can be extended by adding additional imports with specific loaders, or overriding
 * the standard loaders, during a pre_render hook.
 *
 * The import map will be serialized to JSON and included in the page output as a script tag with type "importmap".
 *
 * The class should be fetched using the dependency injection container, and the default loader URL
 * should be set before the page is rendered.
 *
 * @package    core
 * @copyright  Andrew Lyons <andrew@nicols.co.uk>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class import_map implements \JsonSerializable {
    /** @var array The list of imports */
    protected array $imports = [];

    /**
     * @var bool Whether $imports has been sorted longest-key-first for prefix matching.
     *
     * The flag is reset to false whenever add_import() is called so the sort is re-applied
     * if new entries are registered after the first resolution.
     */
    private bool $importssorted = false;

    /** @var \core\url The default loader URL to use */
    protected \core\url $loader;

    /**
     * Initialise the import_map requirement by setting the standard import list.
     */
    public function __construct() {
        $this->add_standard_imports();
    }

    /**
     * Prepare the content for json encoding.
     *
     * @return array[]|array{imports: array}
     */
    public function jsonSerialize(): array {
        $importmap = [
            'imports' => [],
        ];

        if (!isset($this->loader)) {
            throw new \core\exception\coding_exception('Default loader URL must be set before serializing the import map.');
        }

        foreach ($this->imports as $specifier => $importdata) {
            $loader = $importdata->loader instanceof \core\url
                ? $importdata->loader
                : new \core\url($this->loader->out(false) . $specifier);
            $importmap['imports'][$specifier] = $loader->out(false);
        }

        return $importmap;
    }

    /**
     * Set the default loader URL.
     *
     * @param \core\url $loader The default loader URL.
     */
    public function set_default_loader(\core\url $loader): void {
        $this->loader = $loader;
    }

    /**
     * Add the standard entries to the importmap.
     * @return void
     */
    protected function add_standard_imports(): void {
        // Standard component resolution — falls back to each component's own
        // js/esm/build/ directory.  Theme overrides are injected as explicit
        // entries by apply_theme_overrides(), called at page render time when
        // $PAGE->theme is available.  Explicit entries always win over this prefix
        // because import_map matches longest-key-first.
        $this->add_import('@moodle/lms/', path: 'js/esm/build', loadfromcomponent: true);

        // Theme-bypass: always resolves to the component's own js/esm/build/
        // directory, ignoring any theme overrides.  Wrapping components import
        // from this prefix to reach the upstream file.
        // For multi-level chains (A → B → C → Core) the server additionally
        // registers named-ancestor entries so a wrapper in Theme A can
        // target Theme B's version explicitly.
        $this->add_import('@moodle-original/lms/', path: 'js/esm/build', loadfromcomponent: true);

        $this->add_import('@moodlehq/design-system', path: 'lib/js/bundles/design-system/index');
        $this->add_import('react', path: 'lib/js/bundles/react/react');
        $this->add_import('react/', path: 'lib/js/bundles/react');
        $this->add_import('react-dom', path: 'lib/js/bundles/react-dom/react-dom');
        $this->add_import('react-dom/', path: 'lib/js/bundles/react-dom', modifier: $this->resolve_react_dev_path(...));
    }

    /**
     * Register a theme override for a specific component module.
     *
     * Called from a theme's pre_render hook (or equivalent) to redirect a bare
     * specifier to the theme's own compiled file.  Because import_map entries are
     * matched longest-key-first, a fully-qualified specifier registered here always
     * wins over the prefix-based @moodle/lms/ fallback, while leaving the
     * bypass prefix untouched so wrapping themes can still reach the upstream file.
     *
     * Example – eject (theme replaces the component entirely):
     * ```php
     * $map->add_component_override(
     *     '@moodle/lms/local_reactdemo/local_reactdemo_button',
     *     new \core\url('/theme/boost_union/js/esm/build/local_reactdemo_button.js'),
     * );
     * ```
     *
     * Example – wrap (theme decorates the original and imports it via @moodle-original):
     * ```php
     * $map->add_component_override(
     *     '@moodle/lms/local_reactdemo/local_reactdemo_button',
     *     new \core\url('/theme/boost_union/js/esm/build/local_reactdemo_button_wrap.js'),
     * );
     * // @moodle-original/lms/local_reactdemo/local_reactdemo_button is untouched,
     * // so the wrap component can import it to render the upstream version.
     * ```
     *
     * @param string $specifier The fully-qualified bare specifier to override
     *   (e.g. `@moodle/lms/local_reactdemo/local_reactdemo_button`).
     * @param \core\url $loader Absolute URL pointing to the theme's compiled JS file.
     */
    public function add_component_override(string $specifier, \core\url $loader): void {
        $this->add_import($specifier, loader: $loader);
    }

    /**
     * Modifier for React imports that resolves to the unminified development build when in developer mode.
     *
     * When the JS revision is -1 (developer mode / cachejs disabled), this substitutes the
     * `.development.js` variant of a React bundle if it exists on disk, giving better stack
     * traces and warnings during development.
     *
     * @param int $revision The JS revision number (-1 signals developer mode).
     * @param string $requestedpath The bare specifier path that was requested.
     * @param string $resolvedpath The resolved absolute filesystem path.
     * @return string The (possibly substituted) absolute filesystem path to serve.
     */
    protected function resolve_react_dev_path(int $revision, string $requestedpath, string $resolvedpath): string {
        if ($revision === -1) {
            // During development, resolve to the unminified version of React for better debugging.
            $unminifiedpath = str_replace('.js', '.development.js', $resolvedpath);
            if (file_exists($unminifiedpath)) {
                return $unminifiedpath;
            }
        }

        return $resolvedpath;
    }

    /**
     * Register a specifier in the import map.
     *
     * @param string $specifier The bare specifier used in import statements (e.g. `react`, `@moodle/lms/`).
     * @param \core\url|null $loader Absolute URL written verbatim into the import map.
     *   When provided, $path is ignored for URL generation.
     * @param string|null $path Filesystem path relative to $CFG->root, used by the ESM controller
     *   to locate the file on disk. Has no effect on the URL in the import map.
     * @param bool $loadfromcomponent When true, the specifier is treated as a `<component>/<module>`
     *   prefix and resolved to the component's `js/esm/build/` directory. Used internally for `@moodle/lms/`.
     * @param string $suffix File extension suffix appended when resolving filesystem paths (defaults to `.js`).
     * @param callable|null $modifier Optional callable (int $revision, string $requestedpath, string $resolvedpath): string
     *   to transform the resolved filesystem path before the file is served. Not used for URL generation.
     */
    public function add_import(
        string $specifier,
        ?\core\url $loader = null,
        ?string $path = null,
        bool $loadfromcomponent = false,
        string $suffix = '.js',
        ?callable $modifier = null,
    ): void {
        $this->imports[$specifier] = (object) [
            'loader' => $loader,
            'path' => $path,
            'loadfromcomponent' => $loadfromcomponent,
            'suffix' => $suffix,
            'modifier' => $modifier,
        ];
        $this->importssorted = false;
    }

    /**
     * Scan a single theme's js/esm/build/ directory and return all compiled JS files
     * as a map of subpath → absolute URL.
     *
     * Subpath is the path relative to build/ without the .js extension,
     * e.g. local_reactdemo/local_reactdemo_button.
     *
     * Returns an empty array when the theme directory or its build dir does not exist.
     * This method is protected so tests can stub it without touching the filesystem.
     *
     * @param string $themename The theme name (without the theme_ prefix).
     * @return array<string, \core\url> Map of subpath → direct URL.
     */
    protected function scan_theme_build_dir(string $themename): array {
        global $CFG;

        $themedir = \core\component::get_component_directory('theme_' . $themename);
        if (!$themedir) {
            return [];
        }

        $builddir = "{$themedir}/js/esm/build";
        if (!is_dir($builddir)) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($builddir, \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            if ($file->getExtension() !== 'js') {
                continue;
            }

            // Derive the component/module subpath from the file's position under build/,
            // e.g. build/local_reactdemo/local_reactdemo_button.js becomes local_reactdemo/local_reactdemo_button.
            $relative = ltrim(str_replace($builddir, '', $file->getPathname()), DIRECTORY_SEPARATOR);
            $relative = str_replace(DIRECTORY_SEPARATOR, '/', $relative);
            $subpath = substr($relative, 0, -3);

            $relativepath = str_replace(
                $CFG->dirroot . DIRECTORY_SEPARATOR,
                '',
                $file->getPathname(),
            );
            $files[$subpath] = new \core\url($CFG->wwwroot . '/' . str_replace(DIRECTORY_SEPARATOR, '/', $relativepath));
        }

        return $files;
    }

    /**
     * Scan the active theme hierarchy for component overrides and register them
     * as explicit import map entries.
     *
     * This must be called at page render time (when $PAGE->theme is available),
     * not inside the ESM controller request (which runs with abortafterconfig: true
     * and has no theme context).
     *
     * For every subpath overridden by at least one theme in the chain we register
     * two kinds of entries:
     *
     * 1. `@moodle/lms/<subpath>` — points to the **active theme's** own file only.
     *    Parent theme overrides are intentionally excluded: a parent theme that has
     *    a component override should not have that override silently applied when one
     *    of its children is the active theme but has no override of its own.  The
     *    longest-key-first matching rule means this explicit entry always wins over
     *    the `@moodle/lms/` prefix fallback.
     *
     * 2. `@moodle-<themename>/lms/<subpath>` — registered **only for subpaths the
     *    active theme overrides**, one entry per parent position in the chain.
     *    This enables multi-level wrapping (A → B → C → Core): A's wrapping component
     *    can import `@moodle-B/lms/<subpath>` to reach B's version, B can import
     *    `@moodle-C/lms/<subpath>`, and so on.  Resolution rule per parent position:
     *    - If that ancestor provides the file, point to it directly.
     *    - Otherwise walk further toward core until one does.
     *    - If no ancestor provides it, polyfill to core via
     *      `@moodle-original/lms/<subpath>`.
     *    Limiting these entries to subpaths the active theme overrides keeps the
     *    import map small: parent-only overrides never need named entries because
     *    no active-theme code will ever import them by theme name.
     *
     * The `@moodle-original/lms/` prefix is never touched here, so it always
     * resolves directly to the component's own core `js/esm/build/` directory.
     *
     * @param \theme_config $theme The active theme configuration.
     * @param \core\url $loaderbase The base URL of the ESM controller (revision already embedded).
     */
    public function apply_theme_overrides(\theme_config $theme, \core\url $loaderbase): void {
        $themechain = array_merge([$theme->name], $theme->parents ?? []);

        // Pass 1 — collect every .js file available in each theme's build directory.
        // $themefiles[themename][subpath] = \core\url pointing to the compiled file.
        $themefiles = [];
        foreach ($themechain as $themename) {
            $files = $this->scan_theme_build_dir($themename);
            if ($files) {
                $themefiles[$themename] = $files;
            }
        }

        $activetheme = $themechain[0];
        $activethemefiles = $themefiles[$activetheme] ?? [];

        // Pass 2 — @moodle/lms/<subpath>: register one entry per subpath the
        // active theme overrides.  Parent overrides are excluded (they must not
        // apply silently).  Skip any subpath already registered by a prior call.
        foreach ($activethemefiles as $subpath => $url) {
            $specifier = "@moodle/lms/{$subpath}";
            if (!isset($this->imports[$specifier])) {
                $this->add_import($specifier, loader: $url);
            }
        }

        // Pass 3 — @moodle-<parenttheme>/lms/<subpath>: named parent entries for
        // each subpath the active theme overrides.  These are the import targets
        // for wrapping components (A imports @moodle-B/lms/<subpath> to reach B's
        // version, B imports @moodle-C/lms/<subpath>, and so on).
        //
        // Only subpaths the active theme overrides are considered — parent-only
        // overrides are intentionally omitted to keep the import map small.
        //
        // Per parent position, resolve to the nearest ancestor (walking toward core)
        // that provides the file; if none does, polyfill to core via
        // @moodle-original/lms/ so the chain always terminates gracefully.
        $parents = array_slice($themechain, 1);
        $parentcount = count($parents);

        foreach (array_keys($activethemefiles) as $subpath) {
            for ($idx = 0; $idx < $parentcount; $idx++) {
                $namedspecifier = "@moodle-{$parents[$idx]}/lms/{$subpath}";

                $resolved = false;
                for ($j = $idx; $j < $parentcount; $j++) {
                    if (isset($themefiles[$parents[$j]][$subpath])) {
                        $this->add_import($namedspecifier, loader: $themefiles[$parents[$j]][$subpath]);
                        $resolved = true;
                        break;
                    }
                }

                if (!$resolved) {
                    // No parent from this position onward has the file.
                    // Polyfill to core via the ESM controller's @moodle-original/lms/ path.
                    $coreurl = new \core\url($loaderbase->out(false) . '@moodle-original/lms/' . $subpath);
                    $this->add_import($namedspecifier, loader: $coreurl);
                }
            }
        }
    }

    /**
     * Resolve a bare specifier path to an absolute filesystem path.
     *
     * Entries are matched longest-key-first so a more-specific prefix always wins
     * (e.g. `react/` is matched before `react`). Returns null if no entry matches.
     *
     * @param string $requestedpath The bare specifier path (e.g. `react`, `@moodle/lms/mod_book/viewer`).
     * @return string|null Absolute filesystem path to the JS file, or null if unresolved.
     */
    public function get_path_for_script(
        int $revision,
        string $requestedpath,
    ): ?string {
        global $CFG;

        // Sort longest-key-first once so a more-specific prefix always wins over a shorter one.
        if (!$this->importssorted) {
            uksort($this->imports, fn ($a, $b) => strlen($b) <=> strlen($a));
            $this->importssorted = true;
        }

        foreach ($this->imports as $specifier => $importdata) {
            if (!str_starts_with($requestedpath, $specifier)) {
                continue;
            }

            if ($importdata->loader !== null) {
                throw new \core\exception\coding_exception(
                    'Import map entries with explicit loaders cannot be resolved to filesystem paths.',
                );
            }

            if ($importdata->loadfromcomponent) {
                $subpath = substr($requestedpath, strlen($specifier));
                $resolved = $this->resolve_module_identifier($importdata, $subpath);
                if ($importdata->modifier !== null) {
                    $resolved = ($importdata->modifier)($revision, $requestedpath, $resolved);
                }
                return $resolved;
            }

            $pathremainder = substr($requestedpath, strlen($specifier));
            // Reject '..' as a path segment to prevent directory traversal. A single dot in a
            // filename (e.g. 'button.small') is allowed because it is not a segment on its own.
            if (in_array('..', explode('/', $pathremainder), true)) {
                return null;
            }
            $resolved = implode(DIRECTORY_SEPARATOR, array_filter([
                $CFG->root,
                $importdata->path,
                $pathremainder,
            ])) . $importdata->suffix;
            if ($importdata->modifier !== null) {
                $resolved = ($importdata->modifier)($revision, $requestedpath, $resolved);
            }
            return $resolved;
        }

        return null;
    }

    /**
     * Resolve a `<component>/<module>` subpath to an absolute filesystem path.
     *
     * For example, `mod_book/viewer` resolves to
     * `<dirroot>/mod/book/js/esm/build/viewer.js`.
     *
     * Theme overrides are not handled here — they are registered as explicit
     * import map entries by apply_theme_overrides() at page render time, and
     * because explicit entries are matched before prefix entries (longest-key-first),
     * they automatically win without any special handling in this method.
     *
     * @param object $importdata The import entry (path, suffix, …).
     * @param string $subpath The subpath after the specifier prefix (e.g. `mod_book/viewer`).
     * @return string Absolute path to the JS file.
     * @throws \core\exception\not_found_exception If the subpath is missing a slash, contains `..`,
     *   the component is unknown, or the resolved file does not exist.
     */
    protected function resolve_module_identifier(object $importdata, string $subpath): string {
        if (!str_contains($subpath, '/')) {
            throw new \core\exception\not_found_exception('component', $subpath);
        }

        [$component, $modulerest] = explode('/', $subpath, 2);

        // Reject '..' as a path segment to prevent directory traversal. A single dot in a
        // filename (e.g. 'button.small') is allowed because it is not a segment on its own.
        if (in_array('..', explode('/', $modulerest), true)) {
            throw new \core\exception\not_found_exception('script', $subpath);
        }

        $dir = \core\component::get_component_directory($component);
        $file = "{$dir}/{$importdata->path}/{$modulerest}{$importdata->suffix}";
        if (!file_exists($file)) {
            throw new \core\exception\not_found_exception('script', $subpath);
        }

        return $file;
    }
}
