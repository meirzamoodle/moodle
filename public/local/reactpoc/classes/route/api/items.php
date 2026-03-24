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

declare(strict_types=1);

namespace local_reactpoc\route\api;

use core\context\system as context_system;
use core\param;
use core\router\route;
use core\router\schema\parameters\path_parameter;
use core\router\schema\response\payload_response;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Router API controller for local_reactpoc items.
 *
 * Exposes three endpoints:
 *   GET    /api/local_reactpoc/items         – list items owned by the current user
 *   GET    /api/local_reactpoc/items/{itemid} – fetch a single item with description + files
 *   DELETE /api/local_reactpoc/items/{itemid} – delete an item and its associated files
 *
 * @package    local_reactpoc
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class items {

    /**
     * Return all items owned by the current user.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface      $response
     * @return payload_response
     */
    #[route(
        path: '/items',
        method: ['GET'],
    )]
    public function get_items(
        ServerRequestInterface $request,
        ResponseInterface $response,
    ): payload_response {
        global $DB, $PAGE, $USER;

        $context = context_system::instance();
        $PAGE->set_context($context);
        require_login();
        require_capability('local/reactpoc:manage', $context);

        $records = $DB->get_records('local_reactpoc_items', ['userid' => $USER->id], 'timecreated DESC');

        $items = [];
        foreach ($records as $record) {
            $items[] = [
                'id'          => (int) $record->id,
                'title'       => $record->title,
                'timecreated' => userdate($record->timecreated),
            ];
        }

        return new payload_response(
            payload: ['items' => $items],
            request: $request,
            response: $response,
        );
    }

    /**
     * Return a single item with resolved description HTML and attached files.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface      $response
     * @param int                    $itemid
     * @return payload_response
     */
    #[route(
        path: '/items/{itemid}',
        method: ['GET'],
        pathtypes: [
            new path_parameter(name: 'itemid', type: param::INT),
        ],
    )]
    public function get_item(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $itemid,
    ): payload_response {
        global $CFG, $DB, $PAGE, $USER;

        require_once($CFG->libdir . '/filelib.php');

        $context = context_system::instance();
        $PAGE->set_context($context);
        require_login();
        require_capability('local/reactpoc:manage', $context);

        $record = $DB->get_record(
            'local_reactpoc_items',
            ['id' => $itemid, 'userid' => $USER->id],
            '*',
            MUST_EXIST
        );

        // Convert @@PLUGINFILE@@ tokens to real pluginfile.php URLs, then run text filters.
        $description = file_rewrite_pluginfile_urls(
            $record->description,
            'pluginfile.php',
            $context->id,
            'local_reactpoc',
            'item_description',
            $record->id
        );
        $description = format_text($description, $record->descriptionformat, ['context' => $context]);

        $fs    = get_file_storage();
        $files = [];
        foreach ($fs->get_area_files(
            $context->id, 'local_reactpoc', 'item_attachment', $record->id, '', false
        ) as $file) {
            $fileurl = \core\url::make_pluginfile_url(
                $context->id, 'local_reactpoc', 'item_attachment', $record->id,
                $file->get_filepath(), $file->get_filename()
            );
            $files[] = [
                'filename' => $file->get_filename(),
                'filesize' => (int) $file->get_filesize(),
                'fileurl'  => $fileurl->out(),
            ];
        }

        return new payload_response(
            payload: [
                'item' => [
                    'id'           => (int) $record->id,
                    'title'        => $record->title,
                    'description'  => $description,
                    'timecreated'  => userdate($record->timecreated),
                    'timemodified' => userdate($record->timemodified),
                    'files'        => $files,
                ],
            ],
            request: $request,
            response: $response,
        );
    }

    /**
     * Delete an item and all its associated files.
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface      $response
     * @param int                    $itemid
     * @return payload_response
     */
    #[route(
        path: '/items/{itemid}',
        method: ['DELETE'],
        pathtypes: [
            new path_parameter(name: 'itemid', type: param::INT),
        ],
    )]
    public function delete_item(
        ServerRequestInterface $request,
        ResponseInterface $response,
        int $itemid,
    ): payload_response {
        global $DB, $PAGE, $USER;

        $context = context_system::instance();
        $PAGE->set_context($context);
        require_login();
        require_capability('local/reactpoc:manage', $context);

        // Verify the item exists and belongs to the current user before deleting.
        $DB->get_record('local_reactpoc_items', ['id' => $itemid, 'userid' => $USER->id], '*', MUST_EXIST);

        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'local_reactpoc', 'item_description', $itemid);
        $fs->delete_area_files($context->id, 'local_reactpoc', 'item_attachment',  $itemid);

        $DB->delete_records('local_reactpoc_items', ['id' => $itemid]);

        return new payload_response(
            payload: ['success' => true],
            request: $request,
            response: $response,
        );
    }
}
