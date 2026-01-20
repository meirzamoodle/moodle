var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// public/mod/book/react/src/travel.tsx
import { React, ReactDOM } from "../../../../lib/react/build/react.js";
import { withProfiler } from "../../../../lib/react/build/profiler.js";
function requireAmd(mod) {
  return new Promise((resolve, reject) => {
    __require([mod], resolve, reject);
  });
}
__name(requireAmd, "requireAmd");
async function getString(key, component, params = {}) {
  const str = await requireAmd("core/str");
  return str.get_string(key, component, params);
}
__name(getString, "getString");
var loadModalForm = /* @__PURE__ */ __name(async (event) => {
  event?.preventDefault();
  window.console.log("Do I hit this?");
  const ModalForm = await requireAmd("core_form/modalform");
  const contextid = window.M.cfg.contextid ?? 1;
  const form = new ModalForm({
    formClass: "mod_book\\output\\simple2complex_form",
    args: { contextid },
    modalConfig: { title: "Simple to complex form" },
    returnFocus: event?.currentTarget ?? null
  });
  form.show();
}, "loadModalForm");
function App(props) {
  window.console.log(props);
  const [label, setLabel] = React.useState("");
  React.useEffect(() => {
    async function load() {
      const text = await getString("toc", "mod_book");
      setLabel(text);
    }
    __name(load, "load");
    load().catch(
      (error) => window.console.error("Failed to load string", error)
    );
  }, []);
  return /* @__PURE__ */ React.createElement("div", null, label || "Hello from my new file", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("a", { href: "#", onClick: loadModalForm }, "Modal form?"));
}
__name(App, "App");
var ProfiledApp = withProfiler(App, "BookTravelApp");
var travel_default = ProfiledApp;
function init(selector, props = {}) {
  const container = document.querySelector(selector);
  if (!container) {
    window.console.warn(`React container not found for selector: ${selector}`);
    return;
  }
  const root = ReactDOM.createRoot(container);
  root.render(/* @__PURE__ */ React.createElement(ProfiledApp, { ...props }));
}
__name(init, "init");
init("#book-react-node", {});
export {
  travel_default as default,
  init
};
//# sourceMappingURL=travel.js.map
