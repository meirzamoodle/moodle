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

namespace core;

/**
 * Utility class for checking Composer package availability at runtime.
 *
 * Plugins and subsystems that depend on optional Composer packages (i.e. packages
 * that ship via Packagist and are NOT bundled in Moodle core) should use this class
 * to detect whether those packages are installed before attempting to use them.
 * When a package is absent, callers should surface a warning via
 * {@see \core\notification::warning()} rather than letting PHP emit a fatal error.
 *
 * Example usage:
 * <code>
 * if (!\core\composer::is_package_installed('league/oauth2-server')) {
 *     \core\notification::warning(
 *         \core\composer::get_missing_package_warning(
 *             'league/oauth2-server',
 *             'https://moodledev.io/docs/guides/composer'
 *         )
 *     );
 *     return;
 * }
 * </code>
 *
 * @package    core
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class composer {

    /**
     * Check whether a specific Composer package is installed.
     *
     * Returns false when the Composer runtime API is unavailable (i.e. vendor/autoload.php
     * has not been executed), so callers never need to guard against a missing
     * {@see \Composer\InstalledVersions} class themselves.
     *
     * @param string $package Composer package name, e.g. 'league/oauth2-server'.
     * @return bool True if the package is present in the Composer install, false otherwise.
     */
    public static function is_package_installed(string $package): bool {
        if (!static::is_composer_runtime_available()) {
            return false;
        }
        return static::check_installed($package);
    }

    /**
     * Get the installed version string for a Composer package.
     *
     * @param string $package Composer package name, e.g. 'league/oauth2-server'.
     * @return string|null The human-readable version (e.g. '2.3.0'), or null if not installed.
     */
    public static function get_package_version(string $package): ?string {
        if (!static::is_package_installed($package)) {
            return null;
        }
        return \Composer\InstalledVersions::getPrettyVersion($package) ?: null;
    }

    /**
     * Get the filesystem install path for a Composer package.
     *
     * @param string $package Composer package name, e.g. 'league/oauth2-server'.
     * @return string|null Absolute path to the package directory, or null if not installed.
     */
    public static function get_package_install_path(string $package): ?string {
        if (!static::is_package_installed($package)) {
            return null;
        }
        return \Composer\InstalledVersions::getInstallPath($package) ?: null;
    }

    /**
     * Build a user-facing warning message for a missing Composer package.
     *
     * This string is intended for display via {@see \core\notification::warning()} or
     * a similar mechanism. Callers should check {@see is_package_installed()} first
     * and only call this method when the package is known to be absent.
     *
     * @param string $package Composer package name, e.g. 'league/oauth2-server'.
     * @param string $docsurl Optional URL pointing to documentation that explains
     *                        how to run composer install. Included as a link when provided.
     * @return string Translated warning message ready for display.
     */
    public static function get_missing_package_warning(string $package, string $docsurl = ''): string {
        if ($docsurl !== '') {
            return get_string('composerpackagenotinstalledwithurl', 'core', (object)[
                'package' => $package,
                'url' => $docsurl,
            ]);
        }
        return get_string('composerpackagenotinstalled', 'core', $package);
    }

    /**
     * Check whether the Composer runtime API class is loaded and available.
     *
     * Separated into its own method so test helpers can override it without
     * affecting the rest of the logic.
     *
     * @return bool
     */
    protected static function is_composer_runtime_available(): bool {
        return class_exists(\Composer\InstalledVersions::class);
    }

    /**
     * Delegate to the Composer runtime to check whether a package is installed.
     *
     * Separated into its own method so test helpers can override it to inject
     * arbitrary package lists without needing a real vendor directory.
     *
     * @param string $package Composer package name.
     * @return bool
     */
    protected static function check_installed(string $package): bool {
        return \Composer\InstalledVersions::isInstalled($package);
    }
}
