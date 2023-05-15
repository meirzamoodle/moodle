Description of ADOdb library import into Moodle

Source: https://github.com/ADOdb/ADOdb

This library will be probably removed sometime in the future
because it is now used only by enrol and auth db plugins.

Removed:
 * Any invisible file (dot suffixed)
 * composer.json
 * contrib/ (if present)
 * cute_icons_for_site/ (if present)
 * docs/
 * lang/* everything but adodb-en.inc.php (originally because they were not utf-8, now because of not used)
 * nbproject/ (if present)
 * pear/
 * replicate/ (if present)
 * scripts/ (if present)
 * server.php (if present)
 * session/
 * tests/ (if present)

Added:
 * index.html - prevent directory browsing on misconfigured servers
 * readme_moodle.txt - this file ;-)

Notes:
 * 2023-05-15 To make Moodle 4.2 compatible with PHP 8.2 regarding the deprecation of dynamic properties,
   we made several changes from version 5.22.5 (https://github.com/adodb/adodb/compare/v5.22.4...v5.22.5) and
   then we applied it to Moodle 4.2.