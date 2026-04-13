import{useEffect as i,useState as o}from"react";import{callAjax as u,getStrings as _}from"@moodle/lms/core/amd";import{jsx as l,jsxs as s}from"react/jsx-runtime";var f=[{key:"greeting_title",component:"local_reactdemo"},{key:"greeting_loading",component:"local_reactdemo"},{key:"greeting_error",component:"local_reactdemo"}];function y({userid:a}){let[n,g]=o(null),[t,c]=o(!1),[r,d]=o(null);return i(()=>{_(f).then(([e,m,p])=>d({title:e,loading:m,error:p})).catch(e=>window.console.error("Failed to load strings",e))},[]),i(()=>{u("local_reactdemo_get_greeting",{userid:a}).then(e=>g(e.name)).catch(e=>{window.console.error("Failed to load greeting",e),c(!0)})},[a]),r?s("div",{className:`alert ${t?"alert-danger":"alert-success"} d-flex align-items-center gap-2`,children:[s("div",{children:[l("strong",{children:r.title}),s("div",{children:[t&&r.error,!t&&n===null&&l("span",{className:"text-muted",children:r.loading}),!t&&n!==null&&`Hello, ${n}!`]})]}),l("span",{className:"badge bg-primary ms-auto",children:"boost theme eject"})]}):null}export{y as default};
/**
 * Boost theme eject of local_reactdemo_greeting.
 *
 * Full replacement of the original greeting component. Displays the greeting
 * inside a Bootstrap alert card with a Boost-specific badge.
 *
 * @module     theme_boost/local_reactdemo/local_reactdemo_greeting
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
