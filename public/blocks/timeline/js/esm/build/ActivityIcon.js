import{jsx as n}from"react/jsx-runtime";/**
 * Activity icon rendered from the Moodle pix icon URL supplied by the
 * calendar Web Service. The named export and props interface are kept
 * compatible with @moodlehq/design-system ActivityIcon so the import
 * path in EventListItem.tsx is the only change needed if the design
 * system component is adopted later.
 *
 * @module     block_timeline/ActivityIcon
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function c({iconurl:i,alt:t=""}){return n("img",{src:i,alt:t,className:"icon"})}export{c as ActivityIcon};
