var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// public/lib/js/esm/src/example.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
import { Suspense, use, useEffect } from "react";
import String, { getString } from "@moodle/lms/core/String";
function TitleSetter() {
  const label = use(getString("activityclipboard"));
  useEffect(() => {
    document.title = label;
  }, [label]);
  return /* @__PURE__ */ jsxDEV("p", { children: [
    "document.title was set to: ",
    /* @__PURE__ */ jsxDEV("strong", { children: label }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 37,
      columnNumber: 42
    }, this)
  ] }, void 0, true, {
    fileName: "public/lib/js/esm/src/example.tsx",
    lineNumber: 37,
    columnNumber: 12
  }, this);
}
__name(TitleSetter, "TitleSetter");
function AccessibleButton() {
  const label = use(getString("activityclipboard"));
  return /* @__PURE__ */ jsxDEV("button", { "aria-label": label, children: label }, void 0, false, {
    fileName: "public/lib/js/esm/src/example.tsx",
    lineNumber: 45,
    columnNumber: 12
  }, this);
}
__name(AccessibleButton, "AccessibleButton");
function Example() {
  return /* @__PURE__ */ jsxDEV("div", { id: "example", children: [
    /* @__PURE__ */ jsxDEV("h3", { children: "Basic rendering via <String />" }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 52,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(String, { identifier: "activityclipboard" }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 53,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(String, { identifier: "activityclipboard", params: "Here!!!" }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 54,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(String, { identifier: "allowstealthmodules_help", children: "Some help content would go here." }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 55,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("h3", { children: "useEffect receives the resolved string" }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 59,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Suspense, { fallback: "Loading...", children: /* @__PURE__ */ jsxDEV(TitleSetter, {}, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 61,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 60,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("h3", { children: "aria-label from a resolved string" }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 64,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Suspense, { fallback: "Loading...", children: /* @__PURE__ */ jsxDEV(AccessibleButton, {}, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 66,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/lib/js/esm/src/example.tsx",
      lineNumber: 65,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "public/lib/js/esm/src/example.tsx",
    lineNumber: 50,
    columnNumber: 9
  }, this);
}
__name(Example, "Example");
export {
  Example as default
};
/**
 * ESM wrapper for the core/ajax AMD module.
 *
 * @module     core/ajax
 * @copyright  Andrew Lyons <andrew@nicols.co.uk>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2V4YW1wbGUudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBUaGlzIGZpbGUgaXMgcGFydCBvZiBNb29kbGUgLSBodHRwOi8vbW9vZGxlLm9yZy9cbi8vXG4vLyBNb29kbGUgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuLy8gaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbi8vIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4vLyAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuLy9cbi8vIE1vb2RsZSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuLy8gYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbi8vIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbi8vIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4vL1xuLy8gWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2Vcbi8vIGFsb25nIHdpdGggTW9vZGxlLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuXG4vKipcbiAqIEVTTSB3cmFwcGVyIGZvciB0aGUgY29yZS9hamF4IEFNRCBtb2R1bGUuXG4gKlxuICogQG1vZHVsZSAgICAgY29yZS9hamF4XG4gKiBAY29weXJpZ2h0ICBBbmRyZXcgTHlvbnMgPGFuZHJld0BuaWNvbHMuY28udWs+XG4gKiBAbGljZW5zZSAgICBodHRwOi8vd3d3LmdudS5vcmcvY29weWxlZnQvZ3BsLmh0bWwgR05VIEdQTCB2MyBvciBsYXRlclxuICovXG5cbmltcG9ydCB7U3VzcGVuc2UsIHVzZSwgdXNlRWZmZWN0fSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgU3RyaW5nLCB7Z2V0U3RyaW5nfSBmcm9tICdAbW9vZGxlL2xtcy9jb3JlL1N0cmluZyc7XG5cbi8vIFVzZUVmZmVjdCByZWNlaXZlcyB0aGUgcmVzb2x2ZWQgc3RyaW5nIGJlY2F1c2UgdXNlKCkgc3VzcGVuZHNcbi8vIHRoZSBjb21wb25lbnQgYmVmb3JlIHRoZSBib2R5IHJ1bnMgXHUyMDE0IGJ5IHRoZSB0aW1lIHVzZUVmZmVjdCBmaXJlcyxcbi8vIGxhYmVsIGlzIGFscmVhZHkgYSBzdHJpbmcsIG5vdCBhIFByb21pc2UuXG5mdW5jdGlvbiBUaXRsZVNldHRlcigpIHtcbiAgICBjb25zdCBsYWJlbCA9IHVzZShnZXRTdHJpbmcoJ2FjdGl2aXR5Y2xpcGJvYXJkJykpO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBsYWJlbDtcbiAgICB9LCBbbGFiZWxdKTtcblxuICAgIHJldHVybiA8cD5kb2N1bWVudC50aXRsZSB3YXMgc2V0IHRvOiA8c3Ryb25nPntsYWJlbH08L3N0cm9uZz48L3A+O1xufVxuXG4vLyBBcmlhLWxhYmVsIHJlcXVpcmVzIGEgc3RyaW5nIFx1MjAxNCBUeXBlU2NyaXB0IGFjY2VwdHMgdGhpcyBiZWNhdXNlXG4vLyB1c2UoKSB1bndyYXBzIFByb21pc2U8c3RyaW5nPiB0byBzdHJpbmcuXG5mdW5jdGlvbiBBY2Nlc3NpYmxlQnV0dG9uKCkge1xuICAgIGNvbnN0IGxhYmVsID0gdXNlKGdldFN0cmluZygnYWN0aXZpdHljbGlwYm9hcmQnKSk7XG5cbiAgICByZXR1cm4gPGJ1dHRvbiBhcmlhLWxhYmVsPXtsYWJlbH0+e2xhYmVsfTwvYnV0dG9uPjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gRXhhbXBsZSgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGlkPVwiZXhhbXBsZVwiPlxuXG4gICAgICAgICAgICA8aDM+QmFzaWMgcmVuZGVyaW5nIHZpYSAmbHQ7U3RyaW5nIC8mZ3Q7PC9oMz5cbiAgICAgICAgICAgIDxTdHJpbmcgaWRlbnRpZmllcj1cImFjdGl2aXR5Y2xpcGJvYXJkXCIgLz5cbiAgICAgICAgICAgIDxTdHJpbmcgaWRlbnRpZmllcj1cImFjdGl2aXR5Y2xpcGJvYXJkXCIgcGFyYW1zPVwiSGVyZSEhIVwiIC8+XG4gICAgICAgICAgICA8U3RyaW5nIGlkZW50aWZpZXI9XCJhbGxvd3N0ZWFsdGhtb2R1bGVzX2hlbHBcIj5cbiAgICAgICAgICAgICAgICBTb21lIGhlbHAgY29udGVudCB3b3VsZCBnbyBoZXJlLlxuICAgICAgICAgICAgPC9TdHJpbmc+XG5cbiAgICAgICAgICAgIDxoMz51c2VFZmZlY3QgcmVjZWl2ZXMgdGhlIHJlc29sdmVkIHN0cmluZzwvaDM+XG4gICAgICAgICAgICA8U3VzcGVuc2UgZmFsbGJhY2s9XCJMb2FkaW5nLi4uXCI+XG4gICAgICAgICAgICAgICAgPFRpdGxlU2V0dGVyIC8+XG4gICAgICAgICAgICA8L1N1c3BlbnNlPlxuXG4gICAgICAgICAgICA8aDM+YXJpYS1sYWJlbCBmcm9tIGEgcmVzb2x2ZWQgc3RyaW5nPC9oMz5cbiAgICAgICAgICAgIDxTdXNwZW5zZSBmYWxsYmFjaz1cIkxvYWRpbmcuLi5cIj5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiAvPlxuICAgICAgICAgICAgPC9TdXNwZW5zZT5cblxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7OztBQW9DeUM7QUFiekMsU0FBUSxVQUFVLEtBQUssaUJBQWdCO0FBQ3ZDLE9BQU8sVUFBUyxpQkFBZ0I7QUFLaEMsU0FBUyxjQUFjO0FBQ25CLFFBQU0sUUFBUSxJQUFJLFVBQVUsbUJBQW1CLENBQUM7QUFFaEQsWUFBVSxNQUFNO0FBQ1osYUFBUyxRQUFRO0FBQUEsRUFDckIsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUVWLFNBQU8sdUJBQUMsT0FBRTtBQUFBO0FBQUEsSUFBMkIsdUJBQUMsWUFBUSxtQkFBVDtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQWU7QUFBQSxPQUE3QztBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQXNEO0FBQ2pFO0FBUlM7QUFZVCxTQUFTLG1CQUFtQjtBQUN4QixRQUFNLFFBQVEsSUFBSSxVQUFVLG1CQUFtQixDQUFDO0FBRWhELFNBQU8sdUJBQUMsWUFBTyxjQUFZLE9BQVEsbUJBQTVCO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FBa0M7QUFDN0M7QUFKUztBQU1NLFNBQVIsVUFBMkI7QUFDOUIsU0FDSSx1QkFBQyxTQUFJLElBQUcsV0FFSjtBQUFBLDJCQUFDLFFBQUcsOENBQUo7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUF3QztBQUFBLElBQ3hDLHVCQUFDLFVBQU8sWUFBVyx1QkFBbkI7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUF1QztBQUFBLElBQ3ZDLHVCQUFDLFVBQU8sWUFBVyxxQkFBb0IsUUFBTyxhQUE5QztBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQXdEO0FBQUEsSUFDeEQsdUJBQUMsVUFBTyxZQUFXLDRCQUEyQixnREFBOUM7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUVBO0FBQUEsSUFFQSx1QkFBQyxRQUFHLHNEQUFKO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FBMEM7QUFBQSxJQUMxQyx1QkFBQyxZQUFTLFVBQVMsY0FDZixpQ0FBQyxpQkFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQWEsS0FEakI7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUVBO0FBQUEsSUFFQSx1QkFBQyxRQUFHLGlEQUFKO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FBcUM7QUFBQSxJQUNyQyx1QkFBQyxZQUFTLFVBQVMsY0FDZixpQ0FBQyxzQkFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQWtCLEtBRHRCO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FFQTtBQUFBLE9BakJKO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FtQkE7QUFFUjtBQXZCd0I7IiwKICAibmFtZXMiOiBbXQp9Cg==
