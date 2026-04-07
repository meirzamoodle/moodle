<?php
defined('MOODLE_INTERNAL') || die();

/**
 * This function extends the navigation with the tool items.
 *
 * @param navigation_node $navigation
 * @param stdClass $course
 * @param context $context
 * @return void
 */
function local_reactdemo_extend_navigation_frontpage($navigation, $course, $context) {
    $url  = new moodle_url('/local/reactdemo/index.php', ['courseid' => $course->id]);
    $settingsnode = navigation_node::create('React demo', $url, navigation_node::TYPE_SETTING,
        null, null, new pix_icon('i/preview', ''));
    $navigation->add_node($settingsnode);
}
