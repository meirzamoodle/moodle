var a=(n=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(n,{get:(o,r)=>(typeof require<"u"?require:o)[r]}):n)(function(n){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+n+'" is not supported')});function t(n){return new Promise((o,r)=>{a([n],o,r)})}async function m(n){return(await t("core/str")).get_strings(n)}async function g(n,o,r={}){return(await(await t("core/fetch")).request(n,o,r)).json()}async function u(n,o){let e=await(await t("core/modal")).create({title:n,body:o});return e.show(),e}async function w(n,o,r,e,i){let c=await t("core_form/modalform"),s=new c({formClass:n,args:o,modalConfig:{title:r},returnFocus:e});s.addEventListener(s.events.FORM_SUBMITTED,i),s.show()}export{g as fetchRoute,m as getStrings,u as openModal,w as openModalForm,t as requireAmd};
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
