/**
 * Deprecated alias of core/reactAutoinit.
 *
 * @module     core/react_autoinit
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @deprecated since Moodle 6.0 MDL-89230 - use core/reactAutoinit instead.
 */
import "@moodle/lms/core/reactAutoinit";
import emitDeprecation from "@moodle/lms/core/deprecated";
emitDeprecation("core/react_autoinit", {
  replacement: "core/reactAutoinit",
  since: "6.0",
  mdl: "MDL-89230"
});
//# sourceMappingURL=react_autoinit.dev.js.map
