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

use core\tests\composer as composer_tester;

/**
 * Tests for \core\composer.
 *
 * @package    core
 * @category   test
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \core\composer
 */
#[\PHPUnit\Framework\Attributes\CoversClass(composer::class)]
final class composer_test extends \advanced_testcase {

    /**
     * Reset the test helper overrides after each test.
     */
    protected function tearDown(): void {
        composer_tester::reset();
        parent::tearDown();
    }

    // -----------------------------------------------------------------------
    // is_package_installed()
    // -----------------------------------------------------------------------

    /**
     * When the Composer runtime API is unavailable, is_package_installed() must
     * return false regardless of the package name.
     */
    public function test_is_package_installed_returns_false_when_runtime_unavailable(): void {
        composer_tester::set_runtime_available(false);

        $this->assertFalse(composer_tester::is_package_installed('psr/log'));
        $this->assertFalse(composer_tester::is_package_installed('league/oauth2-server'));
        $this->assertFalse(composer_tester::is_package_installed('nonexistent/package'));
    }

    /**
     * When the runtime is available and the package is in the installed list,
     * is_package_installed() must return true.
     */
    public function test_is_package_installed_returns_true_for_installed_package(): void {
        composer_tester::set_runtime_available(true);
        composer_tester::set_installed_packages(['psr/log', 'guzzlehttp/guzzle']);

        $this->assertTrue(composer_tester::is_package_installed('psr/log'));
        $this->assertTrue(composer_tester::is_package_installed('guzzlehttp/guzzle'));
    }

    /**
     * When the runtime is available but the package is not in the installed list,
     * is_package_installed() must return false.
     */
    public function test_is_package_installed_returns_false_for_missing_package(): void {
        composer_tester::set_runtime_available(true);
        composer_tester::set_installed_packages(['psr/log']);

        $this->assertFalse(composer_tester::is_package_installed('league/oauth2-server'));
        $this->assertFalse(composer_tester::is_package_installed('nonexistent/package'));
    }

    /**
     * Against the real Composer install: a package that is listed in composer.json
     * must be reported as installed, and a clearly fictitious package must not be.
     */
    public function test_is_package_installed_against_real_vendor(): void {
        // psr/log is a direct dependency in composer.json and will always be present.
        $this->assertTrue(composer::is_package_installed('psr/log'));

        // A package that will never exist in Moodle's composer.json.
        $this->assertFalse(composer::is_package_installed('moodle/does-not-exist'));
    }

    // -----------------------------------------------------------------------
    // get_package_version()
    // -----------------------------------------------------------------------

    /**
     * get_package_version() must return null when the runtime is unavailable.
     */
    public function test_get_package_version_returns_null_when_runtime_unavailable(): void {
        composer_tester::set_runtime_available(false);

        $this->assertNull(composer_tester::get_package_version('psr/log'));
    }

    /**
     * get_package_version() must return null for a package that is not installed.
     */
    public function test_get_package_version_returns_null_for_missing_package(): void {
        composer_tester::set_runtime_available(true);
        composer_tester::set_installed_packages([]);

        $this->assertNull(composer_tester::get_package_version('league/oauth2-server'));
    }

    /**
     * Against the real Composer install: get_package_version() must return a
     * non-empty string for a package that is installed.
     */
    public function test_get_package_version_returns_string_for_installed_package(): void {
        // psr/log is always installed; its version must be a non-empty string.
        $version = composer::get_package_version('psr/log');

        $this->assertIsString($version);
        $this->assertNotEmpty($version);
    }

    // -----------------------------------------------------------------------
    // get_package_install_path()
    // -----------------------------------------------------------------------

    /**
     * get_package_install_path() must return null when the runtime is unavailable.
     */
    public function test_get_package_install_path_returns_null_when_runtime_unavailable(): void {
        composer_tester::set_runtime_available(false);

        $this->assertNull(composer_tester::get_package_install_path('psr/log'));
    }

    /**
     * get_package_install_path() must return null for a package that is not installed.
     */
    public function test_get_package_install_path_returns_null_for_missing_package(): void {
        composer_tester::set_runtime_available(true);
        composer_tester::set_installed_packages([]);

        $this->assertNull(composer_tester::get_package_install_path('league/oauth2-server'));
    }

    /**
     * Against the real Composer install: get_package_install_path() must return a
     * path string pointing to an existing directory.
     */
    public function test_get_package_install_path_returns_existing_path_for_installed_package(): void {
        $path = composer::get_package_install_path('psr/log');

        $this->assertIsString($path);
        $this->assertDirectoryExists($path);
    }

    // -----------------------------------------------------------------------
    // get_missing_package_warning()
    // -----------------------------------------------------------------------

    /**
     * Without a docs URL, the warning must contain the package name.
     */
    public function test_get_missing_package_warning_contains_package_name(): void {
        $warning = composer::get_missing_package_warning('league/oauth2-server');

        $this->assertStringContainsString('league/oauth2-server', $warning);
    }

    /**
     * When a docs URL is supplied, the warning must contain both the package
     * name and the URL.
     */
    public function test_get_missing_package_warning_with_url_contains_package_and_url(): void {
        $docsurl = 'https://moodledev.io/docs/guides/composer';
        $warning = composer::get_missing_package_warning('league/oauth2-server', $docsurl);

        $this->assertStringContainsString('league/oauth2-server', $warning);
        $this->assertStringContainsString($docsurl, $warning);
    }

    /**
     * Supplying a docs URL must produce a different (longer) string than not supplying one.
     */
    public function test_get_missing_package_warning_differs_with_and_without_url(): void {
        $without = composer::get_missing_package_warning('league/oauth2-server');
        $with    = composer::get_missing_package_warning(
            'league/oauth2-server',
            'https://moodledev.io/docs/guides/composer'
        );

        $this->assertNotEquals($without, $with);
    }
}
