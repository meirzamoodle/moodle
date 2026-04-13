import c from"react";import{requireAmd as l}from"@moodle/lms/core/amd";import{jsx as e,jsxs as n}from"react/jsx-runtime";async function r(t){(await l("core/notification")).alert(t)}function m({label:t,message:o="Hello from local_reactdemo!"}){let[a,i]=c.useState(0);return n("span",{className:"d-inline-flex align-items-center gap-2",children:[e("button",{type:"button",className:"btn btn-primary",onClick:()=>{i(s=>s+1),r(o).catch(()=>{window.alert(o)})},children:t}),a>0&&n("span",{className:"badge bg-secondary",children:[a," ",a===1?"click":"clicks"]}),e("small",{className:"text-muted fst-italic",children:"boost theme"})]})}export{m as default};
/**
 * Boost theme eject of local_reactdemo_button.
 *
 * This is a full replacement — the original component is not imported.
 * Styled with Bootstrap classes available in Boost and adds a click counter.
 *
 * @module     theme_boost/local_reactdemo/local_reactdemo_button
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
