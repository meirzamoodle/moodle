// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

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

import { React, ReactDOM } from "@moodle/core/react";

import { onRenderCallback, isProfilerEnabled } from "@moodle/core/profiler";

// Generated at build time from tsconfig.aliases.json (via generateRuntimeAliases()).
import { REACT_ALIAS_MAP } from "./aliases";

const SELECTOR = "[data-react-component]";
const MOUNTED_FLAG = "reactMounted";
const reactUnmountMap = new WeakMap<Element, () => void>();

const isDev = isProfilerEnabled();

/**
 * DOM ready promise.
 */
const domReady = () =>
    document.readyState === "loading"
        ? new Promise((resolve) =>
              document.addEventListener("DOMContentLoaded", resolve, {
                  once: true,
              })
          )
        : Promise.resolve();

/**
 * Decode the most common HTML entities.
 */
const decodeHtmlEntities = (raw: string): string =>
    raw.replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/**
 * Safe JSON parsing from data-react-props.
 */
const parseProps = (el: Element): Record<string, any> => {
    const raw = el.getAttribute("data-react-props") || "";
    if (!raw) return {};
    try {
        return JSON.parse(decodeHtmlEntities(raw));
    } catch (e) {
        console.error("[react_autoinit] invalid JSON", raw, e);
        return {};
    }
};

/**
 * Normalise inline handlers + AMD handlers.
 */
const normalizeHandlers = (props: Record<string, any>): Record<string, any> => {
    const out = { ...props };

    for (const key of Object.keys(out)) {
        if (!key.startsWith("on")) continue;

        const value = out[key];

        // AMD handler: { amd: "core/notification", method: "alert", args: [...] }
        if (value && typeof value === "object" && value.amd) {
            const { amd, method = null, args = [] } = value;

            out[key] = () => {
                // @ts-ignore - RequireJS global.
                require([amd], (mod: any) => {
                    const fn = method ? mod[method] : mod;
                    if (typeof fn !== "function") {
                        console.warn(
                            `[react_autoinit] ${amd}.${method} is not callable`
                        );
                        return;
                    }
                    fn.apply(mod, args);
                });
            };
        }
    }

    return out;
};

/**
 * Resolve a component name into a URL.
 *
 * The base is looked up from REACT_ALIAS_MAP generated at build time:
 *   {
 *     "core": "../react/build/components/",
 *     "mod_book": "../../../mod/book/react/build/",
 *     ...
 *   }
 */
const resolveComponentUrl = (componentName: string): string | null => {
    const match = componentName.match(/^@([^/]+)\/(.+)$/);
    if (!match) return null;

    const namespace = match[1]; // "core", "mod_book", "local_multiplereact"
    const componentPath = match[2];

    const base = REACT_ALIAS_MAP[namespace];
    if (!base) return null;

    return new URL(`${base}${componentPath}.js`, import.meta.url).href;
};

/**
 * Dynamic import of a component using real ESM.
 *
 * Supports two module shapes:
 *  - init-first:   export function init(mount: Element, props: any): void | (() => void)
 *  - component:    export default function Component(props: any) { ... }
 *
 * Rule:
 *  - If init() exists → use it
 *  - Else → fall back to default React component
 */
const resolveComponent = async (componentName: string): Promise<any> => {
    if (!componentName) return null;

    try {
        const url = resolveComponentUrl(componentName);
        if (!url) {
            console.error("[react_autoinit] Unknown component namespace:", componentName);
            return null;
        }

        if (isDev) {
            console.log(`[react_autoinit] Loading: ${componentName} → ${url}`);
        }

        const module = await import(url);
        return module;
    } catch (e) {
        console.error(`[react_autoinit] Failed to import: ${componentName}`, e);
        return null;
    }
};

/**
 * Mount a single React component with profiler support.
 */
const mountReactComponent = (
    el: Element,
    Component: any,
    props: Record<string, any>
) => {
    const root = ReactDOM.createRoot(el);

    // Wrap with Profiler in dev mode using global callback.
    if (isDev) {
        const componentName =
            el.getAttribute("data-react-component") || "Unknown";
        root.render(
            React.createElement(
                React.Profiler,
                { id: componentName, onRender: onRenderCallback },
                React.createElement(Component, props)
            )
        );
    } else {
        root.render(React.createElement(Component, props));
    }

    reactUnmountMap.set(el, () => root.unmount());
};

/**
 * Mount an element with the `data-react-component` attribute.
 */
const mountOne = async (el: Element) => {
    if ((el as any).dataset[MOUNTED_FLAG]) return;

    const componentName = el.getAttribute("data-react-component");
    if (!componentName) return;

    const mod = await resolveComponent(componentName);

    if (!mod) {
        console.warn("[react_autoinit] Component not found:", componentName);
        return;
    }

    const props = normalizeHandlers(parseProps(el));

    try {
        // If init() exists → use it.
        if (typeof mod.init === "function") {
            const disposer = mod.init(el, props);

            // If init returns a cleanup function, register it for unmount support.
            if (typeof disposer === "function") {
                reactUnmountMap.set(el, disposer);
            }

            (el as any).dataset[MOUNTED_FLAG] = "1";

            if (isDev) {
                console.log(
                    `[react_autoinit] Mounted via init(): ${componentName}`
                );
            }

            return;
        }

        // Else → fall back to default React component.
        const Component = mod.default;

        if (!Component) {
            console.warn(
                "[react_autoinit] Module has no init() and no default export:",
                componentName
            );
            return;
        }

        mountReactComponent(el, Component, props);
        (el as any).dataset[MOUNTED_FLAG] = "1";

        if (isDev) {
            console.log(
                `[react_autoinit] Mounted via default: ${componentName}`
            );
        }
    } catch (e) {
        console.error("[react_autoinit] Mount failed:", componentName, e);
    }
};

/**
 * Unmount a single element.
 */
const unmountOne = (el: Element) => {
    const unmount = reactUnmountMap.get(el);
    if (unmount) {
        try {
            unmount();
            if (isDev) {
                const componentName = el.getAttribute("data-react-component");
                console.log(`[react_autoinit] Unmounted: ${componentName}`);
            }
        } catch (e) {
            console.error("[react_autoinit] Error unmounting:", e);
        }
        reactUnmountMap.delete(el);
    }
    delete (el as any).dataset[MOUNTED_FLAG];
};

const scanAndMount = async (root: Element | Document) => {
    const elements = root.querySelectorAll(SELECTOR);
    if (isDev && elements.length > 0) {
        console.log(
            `[react_autoinit] Found ${elements.length} component(s) to mount`
        );
    }

    for (const el of elements) {
        await mountOne(el);
    }
};

const scanAndUnmount = (root: Element | Document) => {
    for (const el of root.querySelectorAll(SELECTOR)) {
        unmountOne(el);
    }
};

/**
 * MutationObserver support.
 */
const handleAddedNode = (node: Node) => {
    if (!(node instanceof Element)) return;

    if (node.matches?.(SELECTOR)) {
        if (isDev) {
            console.log("[react_autoinit] New component detected");
        }
        mountOne(node);
    }
    node.querySelectorAll?.(SELECTOR).forEach(mountOne);
};

const handleRemovedNode = (node: Node) => {
    if (!(node instanceof Element)) return;

    if (node.matches?.(SELECTOR)) unmountOne(node);
    node.querySelectorAll?.(SELECTOR).forEach(unmountOne);
};

const installObserver = () => {
    const obs = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            m.addedNodes?.forEach(handleAddedNode);
            m.removedNodes?.forEach(handleRemovedNode);
        });
    });

    obs.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });

    return obs;
};

let observer: MutationObserver | null = null;

const resolveRoot = (
    selectorOrRoot?: string | Element | null
): Element | Document => {
    if (!selectorOrRoot) return document;
    if (typeof selectorOrRoot === "string") {
        return document.querySelector(selectorOrRoot) || document;
    }
    return selectorOrRoot;
};

/**
 * Main init.
 */
export const init = async (selectorOrRoot: string | Element | null = null) => {
    await domReady();

    if (isDev) {
        console.log("[react_autoinit] Initializing (DEV MODE)...");
    }

    const root = resolveRoot(selectorOrRoot);
    await scanAndMount(root);

    if (!observer) {
        observer = installObserver();
        if (isDev) {
            console.log("[react_autoinit] MutationObserver active");
        }
    }

    if (isDev) {
        console.log("[react_autoinit] Ready");
    }
};

/**
 * Manual unmount API.
 */
export const unmount = (selectorOrRoot: string | Element | null = null) => {
    const root = resolveRoot(selectorOrRoot);
    scanAndUnmount(root);
};

init();
