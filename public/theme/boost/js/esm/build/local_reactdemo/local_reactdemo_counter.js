import n from"react";import r from"@moodle-original/lms/local_reactdemo/local_reactdemo_counter";import{jsx as t,jsxs as i}from"react/jsx-runtime";import{createElement as a}from"react";function s(o){let[e,l]=n.useState(0);return i("div",{children:[a(r,{...o,key:e}),t("button",{type:"button",className:"btn btn-sm btn-outline-secondary mt-2",onClick:()=>l(m=>m+1),children:"Reset"}),t("small",{className:"ms-2 text-muted fst-italic",children:"boost theme wrap"})]})}export{s as default};
/**
 * Boost theme wrap of local_reactdemo_counter.
 *
 * Renders the original counter unchanged and adds a reset button below it.
 * The original is imported via @moodle-original/lms/ so this wrap always
 * delegates counting logic to upstream.
 *
 * @module     theme_boost/local_reactdemo/local_reactdemo_counter
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
