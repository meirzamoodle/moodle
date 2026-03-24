import{jsx as e,jsxs as i}from"react/jsx-runtime";function m({item:t,strings:n,onView:o,onEdit:r,onDelete:d}){return i("tr",{children:[e("td",{children:t.title}),e("td",{children:t.timecreated}),i("td",{children:[e("button",{type:"button",className:"btn btn-sm btn-outline-primary me-2",onClick:()=>o(t.id),children:n.actionView}),e("button",{type:"button",className:"btn btn-sm btn-outline-secondary me-2",onClick:b=>r(b,t.id),children:n.actionEdit}),e("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>d(t.id),children:n.actionDelete})]})]})}export{m as ItemRow};
/**
 * ItemRow — single row in the React demo item list table.
 *
 * @module     local_reactpoc/local_reactpoc_item_row
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
