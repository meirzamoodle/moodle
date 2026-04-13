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
 * Tests for the ESM import map class.
 *
 * @package    core
 * @category   test
 * @copyright  2026 Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[\PHPUnit\Framework\Attributes\CoversClass(import_map::class)]
final class import_map_test extends \advanced_testcase {
    /**
     * The constructor pre-populates the standard ESM specifiers.
     */
    public function test_constructor_adds_standard_imports(): void {
        $map = new import_map();
        $map->set_default_loader(new \core\url('https://example.com/'));

        $data = $map->jsonSerialize();

        $this->assertArrayHasKey('@moodle/lms/', $data['imports']);
        $this->assertArrayHasKey('react', $data['imports']);
        $this->assertArrayHasKey('react/', $data['imports']);
    }

    /**
     * jsonSerialize() throws a coding_exception when no default loader has been set.
     */
    public function test_jsonserialize_throws_without_loader(): void {
        $this->expectException(\core\exception\coding_exception::class);
        (new import_map())->jsonSerialize();
    }

    /**
     * jsonSerialize() returns an array with an 'imports' key.
     */
    public function test_jsonserialize_returns_imports_structure(): void {
        $map = new import_map();
        $map->set_default_loader(new \core\url('https://example.com/'));

        $data = $map->jsonSerialize();

        $this->assertIsArray($data);
        $this->assertArrayHasKey('imports', $data);
        $this->assertIsArray($data['imports']);
    }

    /**
     * set_default_loader() is used as the base URL when no explicit loader or path is given.
     */
    public function test_set_default_loader_is_used_as_base_url(): void {
        $map = new import_map();
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $map->add_import('my-module');

        $data = $map->jsonSerialize();

        $this->assertEquals('https://example.com/esm/12345/my-module', $data['imports']['my-module']);
    }

    /**
     * add_import() with an explicit \core\url uses that URL verbatim, ignoring the default loader.
     */
    public function test_add_import_with_explicit_url(): void {
        $map = new import_map();
        $map->set_default_loader(new \core\url('https://example.com/'));
        $map->add_import('my-module', loader: new \core\url('https://cdn.example.com/my-module.js'));

        $data = $map->jsonSerialize();

        $this->assertEquals('https://cdn.example.com/my-module.js', $data['imports']['my-module']);
    }

    /**
     * add_import() with no $path and no explicit $loader appends the specifier to the loader URL.
     */
    public function test_add_import_without_path_uses_specifier(): void {
        $map = new import_map();
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $map->add_import('some/specifier');

        $data = $map->jsonSerialize();

        $this->assertEquals('https://example.com/esm/12345/some/specifier', $data['imports']['some/specifier']);
    }

    // -------------------------------------------------------------------------
    // apply_theme_overrides() tests
    // -------------------------------------------------------------------------

    /**
     * Build a stub import_map whose scan_theme_build_dir() returns controlled data.
     *
     * @param array<string, array<string, string>> $fixturefiles
     *   Map of themename → [subpath => url string].
     */
    private function make_stub_map(array $fixturefiles): import_map {
        return new class($fixturefiles) extends import_map {
            public function __construct(private readonly array $fixturefiles) {
                parent::__construct();
            }

            protected function scan_theme_build_dir(string $themename): array {
                $files = $this->fixturefiles[$themename] ?? [];
                return array_map(fn($url) => new \core\url($url), $files);
            }
        };
    }

    /**
     * Build a fake theme_config-like object.
     *
     * @param string $name The theme name.
     * @param string[] $parents Parent theme names, closest first.
     */
    private function make_theme(string $name, array $parents = []): \theme_config {
        // theme_config has no suitable constructor for unit testing, so we use
        // a plain stdClass cast via anonymous class to satisfy the type hint.
        return new class($name, $parents) extends \theme_config {
            public function __construct(string $name, array $parents) {
                // Skip the parent constructor — it requires a real theme on disk.
                $this->name = $name;
                $this->parents = $parents;
            }
        };
    }

    /**
     * A single active theme with one override (no parents) registers @moodle/lms/ but
     * no named @moodle-<theme>/lms/ entry — named entries are only generated for parents.
     */
    public function test_single_theme_registers_moodle_lms_only(): void {
        $map = $this->make_stub_map([
            'boost' => ['core/Button' => 'https://example.com/theme/boost/js/esm/build/core/Button.js'],
        ]);
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $loaderbase = new \core\url('https://example.com/esm/12345/');

        $map->apply_theme_overrides($this->make_theme('boost'), $loaderbase);

        $imports = $map->jsonSerialize()['imports'];

        // Generic entry should point to boost's file.
        $this->assertEquals(
            'https://example.com/theme/boost/js/esm/build/core/Button.js',
            $imports['@moodle/lms/core/Button'],
        );

        // No named entry for the active theme itself — it is not its own parent.
        $this->assertArrayNotHasKey('@moodle-boost/lms/core/Button', $imports);
    }

    /**
     * With theme chain A → B where both have the file, @moodle/lms/ uses the active theme (A).
     */
    public function test_closest_theme_wins_for_generic_entry(): void {
        $map = $this->make_stub_map([
            'theme_a' => ['core/Button' => 'https://example.com/theme/theme_a/js/esm/build/core/Button.js'],
            'theme_b' => ['core/Button' => 'https://example.com/theme/theme_b/js/esm/build/core/Button.js'],
        ]);
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $loaderbase = new \core\url('https://example.com/esm/12345/');

        $map->apply_theme_overrides($this->make_theme('theme_a', ['theme_b']), $loaderbase);

        $imports = $map->jsonSerialize()['imports'];

        $this->assertEquals(
            'https://example.com/theme/theme_a/js/esm/build/core/Button.js',
            $imports['@moodle/lms/core/Button'],
            '@moodle/lms/ must point to the closest theme (A).',
        );
    }

    /**
     * Regression: a parent theme's override must NOT appear as @moodle/lms/ when the
     * active theme has no override of its own.
     *
     * Scenario (mirrors Moodle's Classic → Boost hierarchy):
     *   - "classic" is the active theme and has no React component overrides.
     *   - "boost" is a parent of classic and DOES have an override.
     *   - @moodle/lms/core/Button must NOT be mapped to boost's file; it should fall
     *     back to the core prefix so the unmodified core component is served.
     *   - @moodle-boost/lms/core/Button IS still registered so classic can opt-in
     *     via an explicit import, but it is not the default.
     */
    public function test_parent_override_does_not_apply_when_active_theme_has_no_override(): void {
        $map = $this->make_stub_map([
            // classic has no override files.
            'boost' => ['core/Button' => 'https://example.com/theme/boost/js/esm/build/core/Button.js'],
        ]);
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $loaderbase = new \core\url('https://example.com/esm/12345/');

        // classic's parent chain includes boost — the source of the reported bug.
        $map->apply_theme_overrides($this->make_theme('classic', ['boost']), $loaderbase);

        $imports = $map->jsonSerialize()['imports'];

        // The generic specifier must NOT have an explicit entry; it falls back to the
        // @moodle/lms/ prefix → ESM controller → core file.
        $this->assertArrayNotHasKey(
            '@moodle/lms/core/Button',
            $imports,
            'Boost\'s override must not apply when classic (which has no override) is active.',
        );

        // No named entries at all — classic has no override files, so there is nothing
        // to wrap and no parent entries are generated.
        $this->assertArrayNotHasKey(
            '@moodle-boost/lms/core/Button',
            $imports,
            'No named entries should be generated when the active theme has no override files.',
        );
    }

    /**
     * With chain A (active) → B (parent), both having the file:
     * - @moodle/lms/ → A's file (Pass 2).
     * - @moodle-theme_b/lms/ → B's file (Pass 3: A wraps, so parent entry is generated).
     * - No @moodle-theme_a/lms/ entry — the active theme is not its own parent.
     */
    public function test_parent_named_entry_points_to_parent_file(): void {
        $map = $this->make_stub_map([
            'theme_a' => ['core/Button' => 'https://example.com/theme/theme_a/js/esm/build/core/Button.js'],
            'theme_b' => ['core/Button' => 'https://example.com/theme/theme_b/js/esm/build/core/Button.js'],
        ]);
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $loaderbase = new \core\url('https://example.com/esm/12345/');

        $map->apply_theme_overrides($this->make_theme('theme_a', ['theme_b']), $loaderbase);

        $imports = $map->jsonSerialize()['imports'];

        // Parent entry must point to B's own file so A's wrapper can import it.
        $this->assertEquals(
            'https://example.com/theme/theme_b/js/esm/build/core/Button.js',
            $imports['@moodle-theme_b/lms/core/Button'],
            '@moodle-theme_b/lms/ must point to B\'s own file.',
        );

        // Active theme is not its own parent — no self-named entry.
        $this->assertArrayNotHasKey('@moodle-theme_a/lms/core/Button', $imports);
    }

    /**
     * Polyfill: chain A (active) → B (parent), A has the file, B does not.
     * @moodle-theme_b/lms/ must polyfill to core because B has no file.
     */
    public function test_polyfill_to_core_when_parent_has_no_file(): void {
        $map = $this->make_stub_map([
            'theme_a' => ['core/Button' => 'https://example.com/theme/theme_a/js/esm/build/core/Button.js'],
            // theme_b does not provide core/Button.
        ]);
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $loaderbase = new \core\url('https://example.com/esm/12345/');

        $map->apply_theme_overrides($this->make_theme('theme_a', ['theme_b']), $loaderbase);

        $imports = $map->jsonSerialize()['imports'];

        // B's named entry must polyfill to the ESM controller's @moodle-original/lms/ path.
        $this->assertEquals(
            'https://example.com/esm/12345/@moodle-original/lms/core/Button',
            $imports['@moodle-theme_b/lms/core/Button'],
            '@moodle-theme_b/lms/ must polyfill to core when B has no file.',
        );
    }

    /**
     * Three-level chain A (active) → B → C where A and B provide the override, C does not.
     *
     * This exercises the full wrapping chain: A wraps B, B can wrap C, C falls back to core.
     *
     * - @moodle/lms/core/Button   → A's file  (Pass 2: active theme).
     * - @moodle-theme_b/lms/core/Button → B's file  (Pass 3, idx=0: B has the file).
     * - @moodle-theme_c/lms/core/Button → core polyfill (Pass 3, idx=1: C has no file).
     * - No @moodle-theme_a/lms/ entry — the active theme is not its own parent.
     */
    public function test_three_level_chain_polyfill(): void {
        $map = $this->make_stub_map([
            'theme_a' => ['core/Button' => 'https://example.com/theme/theme_a/js/esm/build/core/Button.js'],
            'theme_b' => ['core/Button' => 'https://example.com/theme/theme_b/js/esm/build/core/Button.js'],
            // theme_c has no file.
        ]);
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $loaderbase = new \core\url('https://example.com/esm/12345/');

        $map->apply_theme_overrides($this->make_theme('theme_a', ['theme_b', 'theme_c']), $loaderbase);

        $imports = $map->jsonSerialize()['imports'];
        $aurl = 'https://example.com/theme/theme_a/js/esm/build/core/Button.js';
        $burl = 'https://example.com/theme/theme_b/js/esm/build/core/Button.js';
        $corepolyfill = 'https://example.com/esm/12345/@moodle-original/lms/core/Button';

        $this->assertEquals($aurl, $imports['@moodle/lms/core/Button'],
            '@moodle/lms/ uses A (the active theme).');
        $this->assertEquals($burl, $imports['@moodle-theme_b/lms/core/Button'],
            '@moodle-theme_b/ points to B\'s own file for A\'s wrapper to import.');
        $this->assertEquals($corepolyfill, $imports['@moodle-theme_c/lms/core/Button'],
            '@moodle-theme_c/ polyfills to core because C has no file.');
        $this->assertArrayNotHasKey('@moodle-theme_a/lms/core/Button', $imports,
            'Active theme must not generate a self-named entry.');
    }

    /**
     * apply_theme_overrides() does not overwrite a @moodle/lms/ entry registered by an earlier call.
     */
    public function test_existing_moodle_lms_entry_is_not_overwritten(): void {
        $map = $this->make_stub_map([
            'theme_a' => ['core/Button' => 'https://example.com/theme/theme_a/js/esm/build/core/Button.js'],
        ]);
        $map->set_default_loader(new \core\url('https://example.com/esm/12345/'));
        $loaderbase = new \core\url('https://example.com/esm/12345/');

        // Simulate an explicit entry added before apply_theme_overrides runs.
        $existing = new \core\url('https://example.com/custom/Button.js');
        $map->add_component_override('@moodle/lms/core/Button', $existing);

        $map->apply_theme_overrides($this->make_theme('theme_a'), $loaderbase);

        $imports = $map->jsonSerialize()['imports'];
        $this->assertEquals(
            'https://example.com/custom/Button.js',
            $imports['@moodle/lms/core/Button'],
            'A pre-registered explicit entry must not be overwritten.',
        );
    }
}
