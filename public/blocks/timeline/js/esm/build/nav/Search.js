import{useRef as T,useState as n,useCallback as m,useEffect as w,useId as x}from"react";import{getString as p}from"@moodle/lms/core/String";import{jsx as e,jsxs as f}from"react/jsx-runtime";/**
 * Search input for the Timeline block.
 *
 * Matches the DOM structure of core/search_input_auto (used by the legacy nav-search.mustache).
 *
 * @module     block_timeline/nav/Search
 * @copyright  2026 Meirza Arson <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const E=1e3;function I({onSearch:l,onSearching:a}){const r=x().replace(/:/g,""),s=`searchinput-${r}`,c=`searchinput-label-${r}`,h=`searchform-auto-${r}`,[o,i]=n(""),[u,b]=n("Search by activity type or name"),[v,y]=n("Clear search"),t=T(null);w(()=>{p("searchevents","block_timeline").then(b),p("clearsearch","core").then(y)},[]);const C=m(N=>{const d=N.target.value;i(d),a?.(!0),t.current&&clearTimeout(t.current),t.current=setTimeout(()=>{a?.(!1),l(d)},E)},[l,a]),g=m(()=>{i(""),t.current&&clearTimeout(t.current),a?.(!1),l("")},[l,a]);return e("div",{className:"w-100",children:e("div",{id:h,className:"d-flex flex-wrap align-items-center simplesearchform",children:f("div",{className:"input-group searchbar w-100",role:"search","aria-labelledby":c,children:[e("label",{htmlFor:s,id:c,children:e("span",{className:"visually-hidden",children:u})}),e("input",{type:"text","data-region":"input","data-action":"search",id:s,className:"form-control withclear rounded",placeholder:u,name:"search",value:o,autoComplete:"off",onChange:C}),o&&f("button",{className:"btn btn-clear","data-action":"clearsearch",type:"button",onClick:g,children:[e("i",{className:"icon fa fa-xmark fa-fw","aria-hidden":"true"}),e("span",{className:"visually-hidden",children:v})]})]})})})}export{I as default};
