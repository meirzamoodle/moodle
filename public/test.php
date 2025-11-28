<?php
  // This simple script displays all the users with pictures on one page.
  // By default it is not linked anywhere on the site.  If you want to
  // make it available you should link it in yourself from somewhere.
  // Remember also to comment or delete the lines restricting access
  // to administrators only (see below)


require('../config.php');

$PAGE->set_url('/test.php');

require_login();

/// Remove the following three lines if you want everyone to access it
$syscontext = context_system::instance();

$title = "OpenTelemetry PSR-3 test page";
$PAGE->set_context($syscontext);
$PAGE->navbar->add($title);
$PAGE->set_title($title);
$PAGE->set_heading($title);
echo $OUTPUT->header();

echo '<div class="alert alert-warning mt-5">
        <h4>Testing Instructions 1:</h4>
        <ol>
            <li>Ensure you have configured the Debug messages to NORMAL in the site administration page</li>
            <li>Open your terminal</li>
            <li>Tail your web server log. For example: <code>tail -f /var/log/apache2/error.log</code></li>
            <li>Refresh this page in your browser</li>
            <li>Check the log output for a PSR-3 log entry similar to the following:
                <blockquote>
                    [php:notice] [pid 3088633] [client ::1:34274] [2025-11-28T03:08:47.163076+00:00] 6929123f11d29 debug.EMERGENCY:
                    Log message 1
                    {"requestid":"6929123f11d29","userid":"2","uri":"/moodleweb/test.php",
                    "script":"/var/www/html/moodleweb/test.php",
                    "type":"HTTP","ipaddress":"0:0:0:0:0:0:0:1","wwwroot":"http://localhost/moodleweb"}
                    {"userid":"2","uri":"/moodleweb/test.php","script":"/var/www/html/moodleweb/test.php","type":"HTTP",
                    "ipaddress":"0:0:0:0:0:0:0:1","wwwroot":"http://localhost/moodleweb"}
                </blockquote>
            </li>
        </ol>
    </div>';

debugging("Log message 1", DEBUG_NONE);
debugging("Log message 2", DEBUG_MINIMAL);
debugging("Log message 3", DEBUG_NORMAL);
debugging("Log message 4", DEBUG_ALL);
debugging("Log message 5", DEBUG_DEVELOPER);

echo '<div class="alert alert-warning mt-5">
        <h4>Testing Instructions 2:</h4>
        <ol>
            <li>Ensure you have configured the Debug messages to NORMAL in the site administration page</li>
            <li>Edit your apache configurations. For example: <code>sudo nano /etc/apache2/sites-available/000-default.conf</code></li>
            <li>Add the following line inside the &lt;VirtualHost *:80&gt; block:
                <pre># OTEL environment for this vhost
SetEnv OTEL_PHP_AUTOLOAD_ENABLED true
SetEnv OTEL_SERVICE_NAME moodle-psr3
SetEnv OTEL_TRACES_EXPORTER otlp
SetEnv OTEL_PHP_PSR3_MODE export
SetEnv OTEL_LOGS_EXPORTER otlp
SetEnv OTEL_EXPORTER_OTLP_PROTOCOL http/protobuf
SetEnv OTEL_EXPORTER_OTLP_ENDPOINT http://localhost:4318</pre>
            </li>
            <li>Tail your web server log. For example: <code>tail -f /var/log/apache2/error.log</code></li>
            <li>Refresh this page in your browser</li>
            <li>Check the log output for a PSR-3 log entry similar to the following:
                <blockquote>
                    [php:notice] [pid 3088633] [client ::1:34274] [2025-11-28T03:08:47.163076+00:00] 6929123f11d29 debug.EMERGENCY:
                    Log message 1
                    {"requestid":"6929123f11d29","userid":"2","uri":"/moodleweb/test.php",
                    "script":"/var/www/html/moodleweb/test.php",
                    "type":"HTTP","ipaddress":"0:0:0:0:0:0:0:1","wwwroot":"http://localhost/moodleweb"}
                    {"userid":"2","uri":"/moodleweb/test.php","script":"/var/www/html/moodleweb/test.php","type":"HTTP",
                    "ipaddress":"0:0:0:0:0:0:0:1","wwwroot":"http://localhost/moodleweb"}
                </blockquote>
            </li>
        </ol>
    </div>';

echo $OUTPUT->footer();
