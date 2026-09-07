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

namespace core\router;

use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests for the OAuth scopes declared by routed API endpoints.
 *
 * @package   core
 * @copyright Meirza Arson <meirza.arson@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
#[CoversMethod(route::class, 'get_scopes')]
final class api_scopes_test extends \advanced_testcase {
    /**
     * Test that every routed API endpoint declares the scopes it requires.
     *
     * @param string $endpoint
     * @param route $route
     */
    #[DataProvider('api_route_provider')]
    public function test_api_route_declares_scopes(string $endpoint, route $route): void {
        if ($route->security === []) {
            $this->markTestSkipped("{$endpoint} explicitly opts out of security");
        }

        $this->assertNotEmpty(
            $route->get_scopes(),
            "{$endpoint} declares no OAuth scopes, so any access token would satisfy it. " .
                "Add a 'scopes:' argument to its #[route] attribute, " .
                "or 'security: []' if the endpoint is deliberately public.",
        );
    }

    /**
     * Test that the routed API endpoints are discovered at all.
     *
     * PHPUnit treats an empty data provider as a warning rather than a failure, so without this
     * the check above would silently cover nothing if the namespace it scans ever moved.
     */
    public function test_api_routes_are_discovered(): void {
        $this->assertNotEmpty(self::api_route_provider());
    }

    /**
     * Data provider returning every route in the route\api namespace.
     *
     * @return array[]
     */
    public static function api_route_provider(): array {
        $routes = [];

        $classes = \core_component::get_component_classes_in_namespace(namespace: 'route\api');
        foreach (array_keys($classes) as $classname) {
            $classinfo = new \ReflectionClass($classname);
            $classattributes = $classinfo->getAttributes(route::class);

            foreach ($classinfo->getMethods(\ReflectionMethod::IS_PUBLIC) as $methodinfo) {
                $attributes = $methodinfo->getAttributes(route::class, \ReflectionAttribute::IS_INSTANCEOF);
                if (empty($attributes)) {
                    continue;
                }

                $route = $attributes[0]->newInstance();
                if ($classattributes) {
                    // Scopes may be declared once on the class and inherited by each of its routes.
                    $route->set_parent($classattributes[0]->newInstance());
                }

                $endpoint = "{$classname}::{$methodinfo->getName()}";
                $routes[$endpoint] = [$endpoint, $route];
            }
        }

        return $routes;
    }
}
