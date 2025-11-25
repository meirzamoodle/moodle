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

/**
 * Admin tool presets plugin to load some settings.
 *
 * @package          logstore_psr3
 * @copyright        Meirza <meirza.arson@moodle.com>
 * @license          http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['channel'] = 'Logger channel';
$string['channel_desc'] = 'Channel name to use in the core logger. Leave blank to use the default channel.';
$string['pluginname'] = 'PSR-3 log store';
$string['pluginname_desc'] = 'Logs Moodle events to a PSR-3 logger (for example Monolog). External tooling such as OpenTelemetry can export PSR-3 logs.';
$string['privacy:metadata'] = 'The PSR-3 log store plugin does not store any personal data.';
