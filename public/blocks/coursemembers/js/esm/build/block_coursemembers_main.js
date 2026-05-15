import{useEffect as n,useState as l}from"react";import{fetchOne as g}from"@moodle/lms/core/ajax";import{requireAsync as p}from"@moodle/lms/core/amd";import{Fragment as b,jsx as r,jsxs as i}from"react/jsx-runtime";var d=[{key:"loading",component:"core"},{key:"nousers",component:"block_coursemembers"}];function f(){let[t,m]=l(null),[u,a]=l(!1),[o,c]=l(null);return n(()=>{p("core/str").then(e=>e.get_strings(d)).then(([e,s])=>c({loading:e,nousers:s})).catch(e=>window.console.error("block_coursemembers: failed to load strings",e))},[]),n(()=>{g({methodname:"block_coursemembers_get_members",args:{}}).then(({groups:e})=>m(e)).catch(e=>{window.console.error("block_coursemembers: failed to load members",e),a(!0)})},[]),!o||t===null?r("p",{className:"text-muted",children:o?.loading??"\u2026"}):u||t.length===0?r("p",{className:"text-muted",children:o.nousers}):r(b,{children:t.map(e=>i("div",{children:[r("h6",{className:"mb-1 mt-2",children:e.label}),r("ul",{className:"list-unstyled mb-2",children:e.users.map(s=>i("li",{className:"d-flex align-items-center py-1",children:[r("img",{src:s.pictureurl,alt:"",width:35,height:35,className:"rounded-circle"}),r("a",{href:s.profileurl,className:"ms-2",children:s.fullname})]},s.profileurl))})]},e.label))})}export{f as default};
/**
 * Course Members block — React entry point.
 *
 * Fetches enrolled users grouped by role via the block_coursemembers_get_members
 * web service and renders them as an avatar + name list.
 *
 * @module     block_coursemembers/block_coursemembers_main
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
