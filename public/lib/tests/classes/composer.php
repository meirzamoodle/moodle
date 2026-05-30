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

namespace core\tests;

/**
 * Test helper for \core\composer.
 *
 * Allows unit tests to control the Composer runtime availability and the set
 * of "installed" packages without requiring a real vendor directory.
 *
 * @package    core
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class composer extends \core\composer {

    /** @var bool|null Overridden Composer runtime availability, or null to use real value. */
    protected static ?bool $runtimeavailable = null;

    /** @var array<string>|null Overridden list of installed package names, or null to use real value. */
    protected static ?array $installedpackages = null;

    /**
     * Override whether the Composer runtime API is reported as available.
     *
     * @param bool $available
     */
    public static function set_runtime_available(bool $available): void {
        self::$runtimeavailable = $available;
    }

    /**
     * Override the list of installed packages returned by check_installed().
     *
     * @param array<string> $packages List of package names considered installed.
     */
    public static function set_installed_packages(array $packages): void {
        self::$installedpackages = $packages;
    }

    /**
     * Reset all overrides back to real behaviour.
     */
    public static function reset(): void {
        self::$runtimeavailable = null;
        self::$installedpackages = null;
    }

    #[\Override]
    protected static function is_composer_runtime_available(): bool {
        if (self::$runtimeavailable !== null) {
            return self::$runtimeavailable;
        }
        return parent::is_composer_runtime_available();
    }

    #[\Override]
    protected static function check_installed(string $package): bool {
        if (self::$installedpackages !== null) {
            return in_array($package, self::$installedpackages, true);
        }
        return parent::check_installed($package);
    }
}
