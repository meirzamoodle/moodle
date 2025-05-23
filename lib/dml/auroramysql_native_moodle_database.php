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
 * Native Aurora MySQL class representing moodle database interface.
 *
 * @package    core_dml
 * @copyright  2020 Lafayette College ITS
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/moodle_database.php');
require_once(__DIR__.'/mysqli_native_moodle_database.php');
require_once(__DIR__.'/mysqli_native_moodle_recordset.php');
require_once(__DIR__.'/mysqli_native_moodle_temptables.php');

/**
 * Native Aurora MySQL class representing moodle database interface.
 *
 * @package    core_dml
 * @copyright  2020 Lafayette College ITS
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class auroramysql_native_moodle_database extends mysqli_native_moodle_database {

    /** @var bool is compressed row format supported cache */
    protected $compressedrowformatsupported = false;

    /**
     * String used to identify the Aurora MySQL version in the database driver.
     */
    private const AURORA_STRING_VERSION = '.mysql_aurora.';

    /**
     * Returns localised database type name.
     *
     * Returns localised database type name. Can be used before connect().
     * @return string
     */
    public function get_name(): ?string {
        return get_string('nativeauroramysql', 'install');
    }

    /**
     * Returns localised database configuration help.
     *
     * Returns localised database configuration help. Can be used before connect().
     * @return string
     */
    public function get_configuration_help(): ?string {
        return get_string('nativeauroramysql', 'install');
    }

    /**
     * Returns the database vendor.
     *
     * Returns the database vendor. Can be used before connect().
     * @return string The db vendor name, usually the same as db family name.
     */
    public function get_dbvendor(): ?string {
        return 'auroramysql';
    }

    /**
     * Returns more specific database driver type
     *
     * Returns more specific database driver type. Can be used before connect().
     * @return string db type mysqli, pgsql, mssql, sqlsrv
     */
    protected function get_dbtype(): ?string {
        return 'auroramysql';
    }

    /**
     * It is time to require transactions everywhere.
     *
     * MyISAM is NOT supported!
     *
     * @return bool
     */
    protected function transactions_supported(): ?bool {
        if ($this->external) {
            return parent::transactions_supported();
        }
        return true;
    }

    #[\Override]
    protected function get_version_from_db(): string {
        $version = null;
        // Query the DB server for the server version.
        $sql = "SELECT AURORA_VERSION() aurora_version";
        try {
            $result = $this->mysqli->query($sql);
            if ($result) {
                if ($row = $result->fetch_assoc()) {
                    $version = $row['aurora_version'];
                }
                $result->close();
                unset($row);
            }
        } catch (\Throwable $e) { // Exceptions in case of MYSQLI_REPORT_STRICT.
            // It looks like we've an issue out of the expected boolean 'false' result above.
            throw new dml_read_exception($e->getMessage(), $sql);
        }
        if (empty($version)) {
            // Exception dml_read_exception usually reports raw mysqli errors i.e. not localised by Moodle.
            throw new dml_read_exception("Unable to read the DB server version.", $sql);
        }

        return $version;
    }

    #[\Override]
    public function get_server_info() {
        $version = $this->serverversion;
        if (empty($version)) {
            $this->serverversion = $this->get_version_from_db();
        }

        return [
            'description' => $this->get_mysqli_server_info() . self::AURORA_STRING_VERSION . $this->serverversion,
            'version' => $this->serverversion,
        ];
    }

    #[\Override]
    protected function is_antelope_file_format_no_more_supported() {
        // Antelope removed 3.0.0+.
        return version_compare($this->get_server_info()['version'], '3.0.0', '>=');
    }

    #[\Override]
    protected function should_db_version_be_read_from_db(): bool {
        // Aurora is forced to allow querying the version from the database.
        return true;
    }
}
