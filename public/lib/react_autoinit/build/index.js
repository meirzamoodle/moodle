var g=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,n)=>(typeof require<"u"?require:e)[n]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});import{React as s,ReactDOM as h}from"../../react/build/react.js";import{onRenderCallback as v,isProfilerEnabled as A}from"../../react/build/profiler.js";var y={core:"../../react/build/components/",mod_book:"../../../mod/book/react/build/",local_multiplereact:"../../../local/multiplereact/react/build/"};var i="[data-react-component]",l="reactMounted",u=new WeakMap,a=A(),M=()=>document.readyState==="loading"?new Promise(t=>document.addEventListener("DOMContentLoaded",t,{once:!0})):Promise.resolve(),w=t=>t.replace(/&quot;/g,'"').replace(/&#039;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"),R=t=>{let e=t.getAttribute("data-react-props")||"";if(!e)return{};try{return JSON.parse(w(e))}catch(n){return console.error("[react_autoinit] invalid JSON",e,n),{}}},$=t=>{let e={...t};for(let n of Object.keys(e)){if(!n.startsWith("on"))continue;let o=e[n];if(o&&typeof o=="object"&&o.amd){let{amd:r,method:c=null,args:b=[]}=o;e[n]=()=>{g([r],d=>{let p=c?d[c]:d;if(typeof p!="function"){console.warn(`[react_autoinit] ${r}.${c} is not callable`);return}p.apply(d,b)})}}}return e},O=t=>{let e=t.match(/^@([^/]+)\/(.+)$/);if(!e)return null;let n=e[1],o=e[2],r=y[n];return r?new URL(`${r}${o}.js`,import.meta.url).href:null},S=async t=>{if(!t)return null;try{let e=O(t);return e?(a&&console.log(`[react_autoinit] Loading: ${t} \u2192 ${e}`),await import(e)):(console.error("[react_autoinit] Unknown component namespace:",t),null)}catch(e){return console.error(`[react_autoinit] Failed to import: ${t}`,e),null}},C=(t,e,n)=>{let o=h.createRoot(t);if(a){let r=t.getAttribute("data-react-component")||"Unknown";o.render(s.createElement(s.Profiler,{id:r,onRender:v},s.createElement(e,n)))}else o.render(s.createElement(e,n));u.set(t,()=>o.unmount())},m=async t=>{if(t.dataset[l])return;let e=t.getAttribute("data-react-component");if(!e)return;let n=await S(e);if(!n){console.warn("[react_autoinit] Component not found:",e);return}let o=$(R(t));try{if(typeof n.init=="function"){let c=n.init(t,o);typeof c=="function"&&u.set(t,c),t.dataset[l]="1",a&&console.log(`[react_autoinit] Mounted via init(): ${e}`);return}let r=n.default;if(!r){console.warn("[react_autoinit] Module has no init() and no default export:",e);return}C(t,r,o),t.dataset[l]="1",a&&console.log(`[react_autoinit] Mounted via default: ${e}`)}catch(r){console.error("[react_autoinit] Mount failed:",e,r)}},f=t=>{let e=u.get(t);if(e){try{if(e(),a){let n=t.getAttribute("data-react-component");console.log(`[react_autoinit] Unmounted: ${n}`)}}catch(n){console.error("[react_autoinit] Error unmounting:",n)}u.delete(t)}delete t.dataset[l]},D=async t=>{let e=t.querySelectorAll(i);a&&e.length>0&&console.log(`[react_autoinit] Found ${e.length} component(s) to mount`);for(let n of e)await m(n)},L=t=>{for(let e of t.querySelectorAll(i))f(e)},N=t=>{t instanceof Element&&(t.matches?.(i)&&(a&&console.log("[react_autoinit] New component detected"),m(t)),t.querySelectorAll?.(i).forEach(m))},P=t=>{t instanceof Element&&(t.matches?.(i)&&f(t),t.querySelectorAll?.(i).forEach(f))},k=()=>{let t=new MutationObserver(e=>{e.forEach(n=>{n.addedNodes?.forEach(N),n.removedNodes?.forEach(P)})});return t.observe(document.documentElement,{childList:!0,subtree:!0}),t},E=null,_=t=>t?typeof t=="string"?document.querySelector(t)||document:t:document,U=async(t=null)=>{await M(),a&&console.log("[react_autoinit] Initializing (DEV MODE)...");let e=_(t);await D(e),E||(E=k(),a&&console.log("[react_autoinit] MutationObserver active")),a&&console.log("[react_autoinit] Ready")},I=(t=null)=>{let e=_(t);L(e)};U();export{U as init,I as unmount};
/**
 * Auto-init shim for Mustache React helper components.
 *
 * It looks for [data-react-component] in the DOM and mounts matching
 * React components from window.ReactComponents using the React APIs
 * exposed on window.
 *
 * The contract is roughly:
 * ```
 *   <div
 *     data-react-component="@core/button"
 *     data-react-props='{"label":"Save","onClick":{"amd":"core/notification","method":"alert","args":["hi"]}}'
 *   ></div>
 * ```
 *
 * A MutationObserver is used so that if new HTML is injected into the page
 * (via fragments, AJAX, etc.) and it contains data-react-component nodes,
 * those nodes are mounted automatically without needing to call init() again.
 *
 * @module     core/react_autoinit
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
