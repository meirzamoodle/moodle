var a=(n=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(n,{get:(r,o)=>(typeof require<"u"?require:r)[o]}):n)(function(n){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+n+'" is not supported')});function t(n){return new Promise((r,o)=>{a([n],r,o)})}async function m(n){return(await t("core/str")).get_strings(n)}async function u(n,r={}){return(await t("core/ajax")).call([{methodname:n,args:r}])[0]}async function g(n,r,o={}){return(await(await t("core/fetch")).request(n,r,o)).json()}async function l(n,r){let e=await(await t("core/modal")).create({title:n,body:r});return e.show(),e}async function w(n,r,o,e,i){let c=await t("core_form/modalform"),s=new c({formClass:n,args:r,modalConfig:{title:o},returnFocus:e});s.addEventListener(s.events.FORM_SUBMITTED,i),s.show()}export{u as callAjax,g as fetchRoute,m as getStrings,l as openModal,w as openModalForm,t as requireAmd};
/**
 * Utilities for loading AMD modules and Moodle language strings from ESM/React code.
 *
 * Moodle's AMD ecosystem (RequireJS) is separate from the ESM import map.
 * These helpers wrap the global `require()` function so React components can
 * await AMD modules and language strings without coupling to RequireJS directly.
 *
 * @module     core/amd
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
