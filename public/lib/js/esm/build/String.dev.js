var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import { Component, Suspense, use } from "react";
import { forgetString, getString } from "./stringUtils";
function StringInner({ identifier, component, params }) {
  return /* @__PURE__ */ jsxDEV(Fragment, { children: use(getString(identifier, component, params)) }, void 0, false, {
    fileName: "public/lib/js/esm/src/String.tsx",
    lineNumber: 26,
    columnNumber: 12
  }, this);
}
__name(StringInner, "StringInner");
class StringErrorBoundary extends Component {
  static {
    __name(this, "StringErrorBoundary");
  }
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function String({ children, identifier, component = "core", params }) {
  const fallback = children ?? `${identifier}, ${component}`;
  return /* @__PURE__ */ jsxDEV(StringErrorBoundary, { fallback, onError: () => forgetString(identifier, component, params), children: /* @__PURE__ */ jsxDEV(Suspense, { fallback, children: /* @__PURE__ */ jsxDEV(StringInner, { identifier, component, params }, void 0, false, {
    fileName: "public/lib/js/esm/src/String.tsx",
    lineNumber: 52,
    columnNumber: 17
  }, this) }, void 0, false, {
    fileName: "public/lib/js/esm/src/String.tsx",
    lineNumber: 51,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "public/lib/js/esm/src/String.tsx",
    lineNumber: 50,
    columnNumber: 9
  }, this);
}
__name(String, "String");
var String_default = String;
export {
  String_default as default
};
//# sourceMappingURL=String.dev.js.map
