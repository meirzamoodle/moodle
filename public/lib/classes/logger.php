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

use Monolog\Logger as MonoLogger;
use Monolog\Handler\ErrorLogHandler;
use Monolog\Processor\PsrLogMessageProcessor;
use Monolog\Level;
use Monolog\LogRecord;
use Psr\Log\LoggerInterface;
use Psr\Log\LogLevel;
use Stringable;

/**
 * PSR-3 Logger wrapper.
 *
 * This is the core PSR-3 logging API used by Moodle logstores
 * (for example logstore_psr3) to emit logs into Monolog and,
 * via OTEL PSR-3 auto-instrumentation, to a collector such as SigNoz.
 *
 * @package    core
 * @copyright  Andrew Lyons <andrew@nicols.co.uk>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class logger {
    /** @var string The default channel name */
    public const CHANNEL_DEFAULT = 'moodle';

    /** @var string The debug channel name */
    public const CHANNEL_DEBUG = 'debug';

    /** @var MonoLogger[] A collection of Loggers indexed by channel name */
    protected array $channels = [];

    /**
     * Get the PSR-3 log level that corresponds to a Moodle debug level.
     *
     * This returns a PSR-3 level string, not a Monolog\Level enum, so that
     * the public API remains agnostic of Monolog.
     *
     * @param int $level The Moodle debug level
     * @return string The corresponding PSR-3 log level string
     */
    public static function get_log_level_from_moodle_debug_level(int $level): string {
        return match ($level) {
            DEBUG_NONE      => LogLevel::EMERGENCY,
            DEBUG_MINIMAL   => LogLevel::ERROR,
            DEBUG_NORMAL    => LogLevel::INFO,
            DEBUG_ALL       => LogLevel::DEBUG,
            DEBUG_DEVELOPER => LogLevel::DEBUG,
            default         => LogLevel::DEBUG,
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
        if (class_exists(MonoLogger::class, false)) {
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
     * Get the logger for a specific channel.
     *
     * @param string $channel The channel to get the logger for
     * @return MonoLogger
     */
    public function get_channel(string $channel): MonoLogger {
        if (!array_key_exists($channel, $this->channels)) {
            $this->channels[$channel] = $this->create_logger_for_channel($channel);
        }
        return $this->channels[$channel];
    }

    /**
     * Normalise an incoming level to a PSR-3 string.
     *
     * Accepted:
     *  - Moodle DEBUG_* int
     *  - Monolog\Level enum
     *  - PSR-3 string
     *
     * Always returns a lowercase PSR-3 level string.
     *
     * @param mixed $level
     * @return string
     */
    protected static function normalise_level(mixed $level): string {
        // 1. Moodle DEBUG_* integer.
        if (is_int($level)) {
            return self::get_log_level_from_moodle_debug_level($level);
        }

        // 2. Monolog Level enum (e.g. Level::Debug).
        if ($level instanceof Level) {
            return strtolower($level->name);
        }

        // 3. PSR-3 string ("debug", "info", etc.).
        if (is_string($level)) {
            return strtolower($level);
        }

        // Fallback if we got something unexpected.
        return LogLevel::DEBUG;
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
        $psrlevel = self::normalise_level($level);

        // Enrich context with global Moodle request data so OTEL/SigNoz can see it.
        $context = self::add_moodle_context($context);

        \core\di::get(self::class)
            ->get_channel($channel)
            ->log(
                level: $psrlevel,
                message: $message,
                context: $context,
            );
    }

    /**
     * Add additional Moodle Data to the logger via a Log Processor.
     *
     * @param mixed $record
     * @return array
     */
    public static function moodle_data_processor(LogRecord $record): LogRecord {
        global $CFG, $USER;

        $record->extra['requestid'] = defined('PAGE_ID') ? PAGE_ID : 'unknown';

        if (!isset($record->extra['userid'])) {
            $record->extra['userid'] = isset($USER->id) ? $USER->id : null;
        }
        if (isset($_SERVER['REQUEST_URI'])) {
            $record->extra['uri'] = $_SERVER['REQUEST_URI'];
        }
        if (isset($_SERVER['SCRIPT_FILENAME'])) {
            $record->extra['script'] = $_SERVER['SCRIPT_FILENAME'];
        }
        if (isset($_SERVER['argv'])) {
            $record->extra['cliargs'] = $_SERVER['argv'];
        }

        if (defined('CLI_SCRIPT') && CLI_SCRIPT) {
            $record->extra['type'] = 'CLI';
        } else if (defined('AJAX_SCRIPT') && AJAX_SCRIPT) {
            $record->extra['type'] = 'AJAX';
        } else if (isset($_SERVER) && isset($_SERVER['SERVER_ADDR'])) {
            $record->extra['type'] = 'HTTP';
        } else {
            $record->extra['type'] = 'Unknown';
        }

        if (function_exists('getremoteaddr')) {
            // Add the IP address of the client.
            $record->extra['ipaddress'] = getremoteaddr();
        }

        $record->extra['wwwroot'] = $CFG->wwwroot;

        // TODO: Add a unique identifier to each page to tie logging in together.
        // This should be used for all logging, tracing, and metrics within the same request.
        // It should be available within the UI for easier correlation.

        return $record;
    }

    /**
     * Add global Moodle request data into the PSR-3 context.
     *
     * This data will be visible to OTEL PSR-3 instrumentation and therefore
     * exported to collectors such as SigNoz as log attributes.
     *
     * Explicit context keys always win over the auto-injected ones.
     *
     * @param array $context
     * @return array
     */
    protected static function add_moodle_context(array $context): array {
        global $CFG, $USER;

        $auto = [];

        $auto['requestid'] = defined('PAGE_ID') ? PAGE_ID : 'unknown';
        $auto['userid']    = isset($USER->id) ? $USER->id : null;

        if (isset($_SERVER['REQUEST_URI'])) {
            $auto['uri'] = $_SERVER['REQUEST_URI'];
        }
        if (isset($_SERVER['SCRIPT_FILENAME'])) {
            $auto['script'] = $_SERVER['SCRIPT_FILENAME'];
        }
        if (isset($_SERVER['argv'])) {
            $auto['cliargs'] = $_SERVER['argv'];
        }

        if (defined('CLI_SCRIPT') && CLI_SCRIPT) {
            $auto['type'] = 'CLI';
        } else if (defined('AJAX_SCRIPT') && AJAX_SCRIPT) {
            $auto['type'] = 'AJAX';
        } else if (isset($_SERVER) && isset($_SERVER['SERVER_ADDR'])) {
            $auto['type'] = 'HTTP';
        } else {
            $auto['type'] = 'Unknown';
        }

        if (function_exists('getremoteaddr')) {
            $auto['ipaddress'] = getremoteaddr();
        }

        $auto['wwwroot'] = $CFG->wwwroot ?? null;

        // Ensure explicit context passed by callers wins over auto data.
        // So if they set 'userid' themselves, we don't overwrite it.
        return $auto + $context;
    }


    /**
     * Log at Emergency level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function emergency(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(LogLevel::EMERGENCY, $message, $context, $channel);
    }

    /**
     * Log at alert level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function alert(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(LogLevel::ALERT, $message, $context, $channel);
    }

    /**
     * Log at critical level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function critical(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(LogLevel::CRITICAL, $message, $context, $channel);
    }

    /**
     * Log at error level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function error(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(LogLevel::ERROR, $message, $context, $channel);
    }

    /**
     * Log at warning level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function warning(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(LogLevel::WARNING, $message, $context, $channel);
    }

    /**
     * Log at notice level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function notice(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(LogLevel::NOTICE, $message, $context, $channel);
    }

    /**
     * Log at info level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    final public static function info(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEFAULT,
    ): void {
        self::log(LogLevel::INFO, $message, $context, $channel);
    }

    /**
     * Log at debug level.
     *
     * @param string|Stringable $message
     * @param array $context
     * @param string $channel
     */
    public static function debug(
        string|Stringable $message,
        array $context = [],
        string $channel = self::CHANNEL_DEBUG
    ): void {
        self::log(LogLevel::DEBUG, $message, $context, $channel);
    }

    /**
     * Create a logger for a specific channel.
     *
     * It is possible to create log channels in multiple ways:
     * 1. The debug channel is always created with specific settings.
     * 2. A custom logger can be provided from config via a callable.
     * 3. A custom logger can be provided from a hook.
     * 4. If no custom logger is provided, a standard logger is created.
     *
     * It is not possible to override the debug channel from config, but handlers and processors can by calling
     *
     * \core\di::get(\core\logger::class)->get_channel(\core\logger::CHANNEL_DEBUG)
     *     ->pushHandler($customhandler);
     *
     * @param string $channel The channel name
     * @return MonoLogger
     */
    protected function create_logger_for_channel(?string $channel = null): MonoLogger {
        global $CFG;

        // 0. Load Composer autoload (Monolog + OTEL PSR-3 instrumentation).
        self::ensure_composer_autoload();

        $logger = match ($channel) {
            // Get the debug channel.
            self::CHANNEL_DEBUG => $this->get_debug_channel(),

            // Check for a custom logger from config.
            default => $this->create_channel_logger_from_config($channel),
        };

        // Check for a custom logger from a hook.
        $logger ??= $this->create_channel_logger_from_hook($channel);

        // Create a standard logger for the channel.
        $logger ??= $this->get_default_logger($channel);

        return $logger;
    }

    /**
     * Create a standard logger for a specific channel.
     *
     * @param string $channel
     * @return MonoLogger
     */
    protected function get_default_logger(string $channel): MonoLogger {
        $errorhandler = new \Monolog\Handler\ErrorLogHandler(
            level: $this->get_channel_loglevel($channel),
        );

        $errorhandler->setFormatter(new \Monolog\Formatter\LineFormatter(
            format: '[%datetime%] %extra.requestid% %channel%.%level_name%: %message% %context% %extra%',
            allowInlineLineBreaks: true,
            includeStacktraces: true,
        ));

        return new MonoLogger(
            name: $channel,
            handlers: [$errorhandler],
            processors: [self::moodle_data_processor(...)],
        );
    }

    /**
     * Get a custom logger for a specific channel from config, if available.
     *
     * @param string $channel
     * @return MonoLogger|null
     */
    protected function create_channel_logger_from_config(string $channel): ?MonoLogger {
        global $CFG;

        $channel = null;
        if (property_exists($CFG, 'logger_channel_callable')) {
            $callable = $CFG->logger_channel_callable;
            if (is_callable($callable)) {
                $channel = $callable($channel);

                if ($channel instanceof MonoLogger) {
                    return $channel;
                }
            }
        }

        return null;
    }

    /**
     * Get a custom logger for a specific channel from a hook, if available.
     *
     * @param string $channel
     * @return MonoLogger|null
     */
    protected function create_channel_logger_from_hook(string $channel): ?MonoLogger {
        $hook = new \core\hook\log_channel_request_hook($channel);
        \core\di::get(hook\manager::class)->dispatch($hook);

        return $hook->get_logger();
    }

    /**
     * Get the log level for a specific channel.
     *
     * @param string $channel
     * @return Level
     */
    protected function get_channel_loglevel(string $channel): Level {
        global $CFG;

        if (property_exists($CFG, 'logger_channel_loglevel_callable')) {
            $callable = $CFG->logger_channel_loglevel_callable;
            if (is_callable($callable)) {
                $level = $callable($channel);

                if ($level instanceof Level) {
                    return $level;
                }
            }
        }

        // Return defaults.
        return match ($channel) {
            self::CHANNEL_DEBUG => Level::Debug,
            default => Level::Info,
        };
    }

    /**
     * Get the channel for the debug channel.
     *
     * @return MonoLogger
     */
    protected function get_debug_channel(): MonoLogger {
        $errorhandler = new \Monolog\Handler\ErrorLogHandler(
            level: self::get_channel_loglevel(self::CHANNEL_DEBUG),
        );
        $errorhandler->setFormatter(new \Monolog\Formatter\LineFormatter(
            format: '[%datetime%] %extra.requestid% %channel%.%level_name%: %message% %context% %extra%',
            allowInlineLineBreaks: true,
            includeStacktraces: true,
        ));

        return new MonoLogger(
            name: self::CHANNEL_DEBUG,
            handlers: [$errorhandler],
            processors: [self::moodle_data_processor(...)],
        );
    }
}
