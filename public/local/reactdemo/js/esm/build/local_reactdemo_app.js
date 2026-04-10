import{createRoot as r}from"react-dom/client";import{userId as d}from"@moodle/lms/core/config";import c from"@moodle/lms/local_reactdemo/local_reactdemo_button";import m from"@moodle/lms/local_reactdemo/local_reactdemo_counter";import a from"@moodle/lms/local_reactdemo/local_reactdemo_card";import i from"@moodle/lms/local_reactdemo/local_reactdemo_greeting";import{Fragment as s,jsx as e,jsxs as o}from"react/jsx-runtime";function l(){return o(s,{children:[e("h3",{children:"Swizzle demo"}),o("p",{children:["Each component below uses its ",e("code",{children:"@moodle/lms/"})," specifier. When the active theme provides an override in its ",e("code",{children:"js/esm/build/"})," directory, the import map automatically redirects to the theme's version \u2014 no PHP registration required. This page renders entirely from a React root with no Mustache template."]}),o("h4",{children:["Button ",e("code",{children:"@moodle/lms/local_reactdemo/local_reactdemo_button"})]}),e("div",{className:"p-3 border rounded mb-4",children:e(c,{label:"Click me",message:"Hello from local_reactdemo!"})}),o("h4",{children:["Counter ",e("code",{children:"@moodle/lms/local_reactdemo/local_reactdemo_counter"})]}),e("div",{className:"p-3 border rounded mb-4",children:e(m,{initial:0})}),o("h4",{children:["Card ",e("code",{children:"@moodle/lms/local_reactdemo/local_reactdemo_card"})]}),e("div",{className:"mb-4",children:e(a,{title:"Example card",body:"This component is directory-based: index.tsx imports CardContent.tsx. Ejecting copies both files.",footer:"local_reactdemo_card/index.tsx + CardContent.tsx"})}),o("h4",{children:["Greeting ",e("code",{children:"@moodle/lms/local_reactdemo/local_reactdemo_greeting"})]}),e("div",{className:"p-3 border rounded mb-4",children:e(i,{userid:d})})]})}var t=document.getElementById("local-reactdemo-app");t&&r(t).render(e(l,{}));
/**
 * React-only swizzle demo app entry point.
 *
 * Replaces the Mustache template approach: PHP outputs a single mount div;
 * this module bootstraps itself without any Mustache helper or react_autoinit
 * scan. User context is read from @moodle/lms/core/config (M.cfg).
 *
 * Each component is imported via its @moodle/lms/ specifier so theme overrides
 * via the import map apply automatically — the swizzle mechanism still works.
 *
 * @module     local_reactdemo/local_reactdemo_app
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
