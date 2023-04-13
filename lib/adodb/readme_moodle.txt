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
 * 2023-04-13 Added properties to avoid PHP 8.2 dynamic properties deprecated warning.
   I've proposed a PR to upstream https://github.com/ADOdb/ADOdb/pull/926,
   althought the PR was rejected, they will use it to start working on the issue,
   hopefully, those will be ready for the new version.