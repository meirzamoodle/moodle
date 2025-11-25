<?php
// This file is part of Moodle - http://moodle.org/.
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
 * Helper to bootstrap an OpenTelemetry span per Moodle request.
 *
 * @package    core
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class opentelemetry_trace {
    /** @var object|null Active span instance (SDK type is runtime-dependent). */
    protected static $span = null;

    /** @var object|null Active scope instance (SDK type is runtime-dependent). */
    protected static $scope = null;

    /**
     * Ensure Composer autoload is loaded if present.
     *
     * This is intentionally lazy and optional:
     *  - If vendor/autoload.php exists in dirroot, or one level above it,
     *    we require it.
     *  - If not, we silently skip it.
     */
    protected static function ensure_composer_autoload(): void {
        global $CFG;

        // If OTEL globals are already known, no need to do anything.
        if (class_exists(\OpenTelemetry\API\Globals::class, false)) {
            return;
        }

        if (!empty($CFG->dirroot)) {
            $paths = [
                $CFG->dirroot . '/vendor/autoload.php',
                $CFG->dirroot . '/../vendor/autoload.php',
            ];

            foreach ($paths as $autoload) {
                if (is_readable($autoload)) {
                    require_once($autoload);
                    break;
                }
            }
        }
    }

    /**
     * Bootstrap a single span for the current request.
     *
     * This method is safe to call multiple times; only the first call
     * will create the span.
     */
    public static function bootstrap_request_span(): void {
        // Already bootstrapped for this request.
        if (self::$span !== null) {
            return;
        }

        // Load composer autoload so OTEL SDK and auto-psr3 are available.
        self::ensure_composer_autoload();

        // If the OTEL Globals class is not available, do nothing.
        if (!class_exists(\OpenTelemetry\API\Globals::class)) {
            return;
        }

        // Use the global tracer provider set up by the OTEL SDK.
        // See https://opentelemetry.io/docs/languages/php/getting-started/.
        $tracer = \OpenTelemetry\API\Globals::tracerProvider()
            ->getTracer('moodle', '1.0.0');

        // Create and activate a span for this Moodle request.
        $span = $tracer
            ->spanBuilder('moodle_request')
            ->startSpan();

        $scope = $span->activate();

        self::$span = $span;
        self::$scope = $scope;

        // End the span and detach the scope at the end of the request.
        register_shutdown_function(static function (): void {
            if (self::$scope !== null) {
                try {
                    self::$scope->detach();
                } catch (\Throwable $e) {
                    // Intentionally ignore any errors during shutdown to prevent cascading failures.
                    unset($e);
                }
                self::$scope = null;
            }
            if (self::$span !== null) {
                try {
                    self::$span->end();
                } catch (\Throwable $e) {
                    // Intentionally ignore any errors during shutdown to prevent cascading failures.
                    unset($e);
                }
                self::$span = null;
            }
        });
    }
}
