import d from"@moodle/lms/core/config";import{getString as f}from"@moodle/lms/core/stringUtils";import{requireAsync as l}from"@moodle/lms/core/amd";/**
 * The core/deprecated module allows you to mark things as deprecated and warn appropriately.
 *
 * It emits a console error for non-final deprecations, or throws an Error for final ones.
 * When developer debugging is enabled (or running under Behat), a toast notification is
 * also displayed via core/notification.
 *
 * @module     core/deprecated
 * @copyright  Andrew Lyons <andrew@nicols.co.uk>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 * @example
 * import emitDeprecation from '@moodle/lms/core/deprecated';
 *
 * emitDeprecation('myFunction', {
 *     replacement: 'myNewFunction',
 *     since: '5.0',
 *     mdl: 'MDL-12345',
 * });
 */const n=t=>t!==void 0&&t!=="",h=({thing:t,alternativeNotice:o,replacement:r,since:a,reason:s,mdl:i})=>{const e=["Deprecation: "];return n(o)?e.push(o):e.push(`${t} has been deprecated`),n(a)&&e.push(` since ${a}`),e.push("."),n(s)&&e.push(` ${s}`),n(r)&&e.push(` Please use ${r} instead.`),n(i)&&e.push(` See ${i} for more information.`),e.join("")},m=({thing:t,alternativeNotice:o,replacement:r,since:a,reason:s,mdl:i})=>{const e=["<h2>Deprecation</h2>"];if(n(o)?e.push(`<p>${o}`):e.push(`<p><code>${t}</code> is deprecated`),a!==null&&e.push(` since ${a}`),e.push(".</p>"),n(s)&&e.push(`<p>${s}</p>`),n(r)&&e.push(`<p>Please use <code>${r}</code> instead.</p>`),n(i)){const p=`https://moodle.atlassian.net/browse/${i}`;e.push(`<p>See <a href="${p}" target="_blank" rel="noopener noreferrer">${i}</a> for more information.</p>`)}return e.join("")},$=t=>d.deprecationignorelist.includes(t),D=()=>!!(d.developerdebug||document.querySelector("body.behat-site"));function b(t,{alternativeNotice:o,replacement:r,since:a,reason:s,mdl:i,final:e=!1,emit:p=!0}={}){if(!n(r)&&!n(s)&&!n(i))throw new Error("You must provide at least one of replacement, reason or mdl when marking something as deprecated.");const c={thing:t,alternativeNotice:o,replacement:r,since:a,reason:s,mdl:i},u=h(c);if((e||D())&&(e||p&&!$(t))&&l("core/notification").then(g=>{g.alert("Deprecation Warning",m(c),f("ok"))}),e)throw new Error(u);console.error(u)}export{b as default};
