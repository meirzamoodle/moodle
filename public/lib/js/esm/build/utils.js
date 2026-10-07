import a from"./pending";/**
 * Utility functions.
 *
 * @module     core/utils
 * @copyright  2019 Ryan Wyllie <ryan@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @since      2.9
 */const d=(n,r)=>{let t=!1,i=!1,o;const e=function(...s){if(o=s,t){i=!0;return}n.apply(this,s),t=!0,setTimeout(()=>{const l=i;t=!1,i=!1,l&&e.apply(this,o)},r)};return e},u=new Map,p=(n,r,{pending:t=!1,cancel:i=!1}={})=>{let o=null;const e=(...s)=>{t&&!u.has(e)&&u.set(e,new a("core/utils:debounce")),o!==null&&clearTimeout(o);const l=async()=>{const c=u.get(e);u.delete(e),await n(...s),c?.resolve()};o=setTimeout(()=>{l()},r)};return i&&(e.cancel=()=>{u.get(e)?.resolve(),o!==null&&clearTimeout(o)}),e},f=n=>n!==""&&n!=="moodle"&&n!=="core"?n:"core",g={throttle:d,debounce:p,getNormalisedComponent:f};var m=g;export{p as debounce,m as default,f as getNormalisedComponent,d as throttle};
