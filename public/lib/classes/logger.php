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

use Monolog\Logger as Mono;
use Monolog\Handler\ErrorLogHandler;
use Monolog\Processor\PsrLogMessageProcessor;
use Monolog\Level;
use Psr\Log\LoggerInterface;
use Stringable;

/**
 * PSR-3 Logger wrapper.
 *
 * This is the core PSR-3 logging API used by Moodle logstores
 * (for example logstore_psr3) to emit logs into Monolog and,
 * via OTEL PSR-3 auto-instrumentation, to a collector such as SigNoz.
 *
 * @package    core
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class logger {
    /** @var string The default channel name */
    public const CHANNEL_DEFAULT = 'moodle';

    /** @var string The debug channel name */
    public const CHANNEL_DEBUG = 'debug';

    /** @var \Monolog\Logger[] A collection of Loggers indexed by channel name */
    protected array $channels = [];

    /**
     * Get the log level that corresponds to a Moodle debug level.
     *
     * This is used when mapping Moodle's DEBUG_* constants onto
     * a Monolog Level. Note that core::log() will normalise this
     * to a PSR-3 string before calling Monolog.
     *
     * @param int $level The Moodle debug level
     * @return Level The corresponding Monolog log level
     */
    public static function get_log_level_from_moodle_debug_level(int $level): Level {
        return match ($level) {
            DEBUG_NONE => Level::Emergency,
            DEBUG_MINIMAL => Level::Error,
            DEBUG_NORMAL => Level::Info,
            DEBUG_ALL => Level::Debug,
            default => Level::Debug,
        };
    }

    /**
     * Ensure Composer autoload is loaded if present.
     *
     * This is intentionally lazy and optional:
     *  - If vendor/autoload.php exists in dirroot, or one level above it,
     *    we require it.
     *  - If not, we silently skip it.
     *
     * This allows Monolog and OTEL PSR-3 auto-instrumentation to register.
     */
    protected static function ensure_composer_autoload(): void {
        global $CFG;

        // If Monolog is already known, no need to do anything.
        if (class_exists(Mono::class, false)) {
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
     * Internal factory: create a logger for a given channel.
     *
     * @param string|null $channel
     * @return LoggerInterface
     */
    protected static function create_logger_for_channel(?string $channel = null): LoggerInterface {
        global $CFG;

        // 0. Load Composer autoload (Monolog + OTEL PSR-3 instrumentation).
        self::ensure_composer_autoload();

        // 1. Admin/ops override via config.php.
        if (!empty($CFG->logger_channel_callable)) {
            $callable = $CFG->logger_channel_callable;

            if (is_callable($callable)) {
                try {
                    $logger = $callable($channel);
                    if ($logger instanceof LoggerInterface) {
                        return $logger;
                    }

                    if ($logger !== null) {
                        error_log('core\logger: logger_channel_callable did not return a LoggerInterface');
                    }
                } catch (\Throwable $e) {
                    error_log('core\logger: logger_channel_callable threw: ' . $e->getMessage());
                }
            } else {
                error_log('core\logger: logger_channel_callable is not callable');
            }
        }

        // 2. Default Monolog logger for this channel.
        $mono = new Mono($channel ?: 'moodle');

        // Single default minimum handler level for now.
        $level = Level::Info;

        // Handler: write to PHP error_log.
        $mono->pushHandler(new ErrorLogHandler(
            ErrorLogHandler::OPERATING_SYSTEM,
            $level
        ));

        // Allow "{foo}" style placeholders in messages.
        if (class_exists(PsrLogMessageProcessor::class)) {
            $mono->pushProcessor(new PsrLogMessageProcessor());
        }

        return $mono;
    }

    /**
     * Get the logger for a specific channel.
     *
     * @param string $channel The channel to get the logger for
     * @return \Monolog\Logger
     */
    public function get_channel(string $channel): \Monolog\Logger {
        if (!array_key_exists($channel, $this->channels)) {
            $this->channels[$channel] = self::create_logger_for_channel($channel);
        }
        return $this->channels[$channel];
    }

    /**
     * Log a message to the specified channel.
     *
     * NOTE: Always normalises to a PSR-3 string level before calling Monolog,
     * so that OTEL PSR-3 instrumentation (Severity::fromPsr3) receives a string.
     *
     * @param mixed $level  Moodle debug int, Monolog Level enum, or PSR-3 string
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function log(
        mixed $level,
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        $psrlevel = null;

        // 1. Monolog Level enum (e.g. Level::Debug).
        if ($level instanceof Level) {
            // Text "Debug" => "debug".
            $psrlevel = strtolower($level->name);
        } else if (is_int($level)) {
            // 2. Moodle debug integer (DEBUG_*).
            $enum = self::get_log_level_from_moodle_debug_level($level);
            $psrlevel = strtolower($enum->name);
        } else if (is_string($level)) {
            // 3. PSR-3 string ("debug", "info", etc.).
            $psrlevel = strtolower($level);
        }

        // Fallback if we got something unexpected.
        if ($psrlevel === null) {
            $psrlevel = 'debug';
        }

        \core\di::get(self::class)
            ->get_channel($channel)
            ->log(
                level: $psrlevel,
                message: $message,
                context: $context,
            );
    }

    // -------------------------------------------------------------------------
    // Shortcut helpers for PSR-3 standard log levels
    // -------------------------------------------------------------------------

    final public static function emergency(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(\Psr\Log\LogLevel::EMERGENCY, $message, $context, $channel);
    }

    final public static function alert(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(\Psr\Log\LogLevel::ALERT, $message, $context, $channel);
    }

    final public static function critical(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(\Psr\Log\LogLevel::CRITICAL, $message, $context, $channel);
    }

    final public static function error(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(\Psr\Log\LogLevel::ERROR, $message, $context, $channel);
    }

    final public static function warning(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(\Psr\Log\LogLevel::WARNING, $message, $context, $channel);
    }

    final public static function notice(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(\Psr\Log\LogLevel::NOTICE, $message, $context, $channel);
    }

    final public static function info(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(\Psr\Log\LogLevel::INFO, $message, $context, $channel);
    }

    /**
     * Log at debug level (default debug channel).
     */
    public static function debug(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEBUG
    ): void {
        self::log(\Psr\Log\LogLevel::DEBUG, $message, $context, $channel);
    }
}
