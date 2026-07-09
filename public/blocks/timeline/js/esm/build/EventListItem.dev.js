var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * Event list item for the Timeline block.
 *
 * Matches the DOM structure of the legacy event-list-item.mustache template.
 *
 * @module     block_timeline/EventListItem
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import String from "@moodle/lms/core/String";
import { ActivityIcon } from "./ActivityIcon";
function EventListItem({ event, courseview = false }) {
  const pxClass = courseview ? "px-0" : "px-2";
  const time = new Date(event.timesort * 1e3).toLocaleTimeString(void 0, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const purposeClass = event.purpose ? ` ${event.purpose}` : "";
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: `list-group-item timeline-event-list-item flex-column pt-2 pb-0 border-0 ${pxClass}`,
      "data-region": "event-list-item",
      children: [
        /* @__PURE__ */ jsxDEV("div", { className: "d-flex flex-wrap pb-1", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "d-flex me-auto pb-1 mw-100 timeline-name", children: [
            /* @__PURE__ */ jsxDEV("small", { className: "text-end text-nowrap align-self-center ms-1", children: time }, void 0, false, {
              fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
              lineNumber: 59,
              columnNumber: 21
            }, this),
            event.icon && /* @__PURE__ */ jsxDEV("div", { className: `small courseicon align-self-start align-self-center mx-2 mb-1 mb-sm-0 text-nowrap activityiconcontainer${purposeClass}`, children: /* @__PURE__ */ jsxDEV(ActivityIcon, { iconurl: event.icon.iconurl, alt: event.icon.alttext }, void 0, false, {
              fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
              lineNumber: 66,
              columnNumber: 29
            }, this) }, void 0, false, {
              fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
              lineNumber: 62,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "event-name-container flex-grow-1 line-height-3 nowrap text-truncate", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "d-flex", children: /* @__PURE__ */ jsxDEV("h5", { className: "h6 event-name mb-0 pb-1 text-truncate", children: [
                event.overdue && /* @__PURE__ */ jsxDEV("span", { className: "badge rounded-pill bg-danger text-white ms-1 float-end", children: /* @__PURE__ */ jsxDEV(String, { identifier: "overdue", component: "block_timeline", children: "Overdue" }, void 0, false, {
                  fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                  lineNumber: 75,
                  columnNumber: 41
                }, this) }, void 0, false, {
                  fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                  lineNumber: 74,
                  columnNumber: 37
                }, this),
                /* @__PURE__ */ jsxDEV("a", { href: event.url, title: event.name, children: event.activityname }, void 0, false, {
                  fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                  lineNumber: 78,
                  columnNumber: 33
                }, this)
              ] }, void 0, true, {
                fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                lineNumber: 72,
                columnNumber: 29
              }, this) }, void 0, false, {
                fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                lineNumber: 71,
                columnNumber: 25
              }, this),
              /* @__PURE__ */ jsxDEV("small", { className: "mb-0", children: [
                event.activitystr,
                !courseview && event.course?.fullnamedisplay && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                  " \xB7 ",
                  event.course.fullnamedisplay
                ] }, void 0, true, {
                  fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                  lineNumber: 86,
                  columnNumber: 33
                }, this)
              ] }, void 0, true, {
                fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                lineNumber: 83,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
              lineNumber: 70,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
            lineNumber: 58,
            columnNumber: 17
          }, this),
          event.action?.actionable && /* @__PURE__ */ jsxDEV("div", { className: "d-flex timeline-action-button", children: /* @__PURE__ */ jsxDEV("h5", { className: "h6 event-action", children: /* @__PURE__ */ jsxDEV(
            "a",
            {
              className: "list-group-item-action btn btn-outline-secondary btn-sm text-nowrap",
              href: event.action.url,
              "aria-label": event.action.name,
              title: event.action.name,
              children: [
                event.action.name,
                event.action.showitemcount && /* @__PURE__ */ jsxDEV("span", { className: "badge bg-secondary text-dark", children: event.action.itemcount }, void 0, false, {
                  fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
                  lineNumber: 103,
                  columnNumber: 37
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
              lineNumber: 95,
              columnNumber: 29
            },
            this
          ) }, void 0, false, {
            fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
            lineNumber: 94,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
            lineNumber: 93,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
          lineNumber: 57,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "pt-2 border-bottom" }, void 0, false, {
          fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
          lineNumber: 110,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "public/blocks/timeline/js/esm/src/EventListItem.tsx",
      lineNumber: 53,
      columnNumber: 9
    },
    this
  );
}
__name(EventListItem, "EventListItem");
export {
  EventListItem as default
};
//# sourceMappingURL=EventListItem.dev.js.map
