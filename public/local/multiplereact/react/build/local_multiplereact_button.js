var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// public/local/multiplereact/react/src/local_multiplereact_button.tsx
import { React } from "../../../../lib/react/build/react.js";
function requireAmd(mod) {
  return new Promise((resolve, reject) => {
    __require([mod], resolve, reject);
  });
}
__name(requireAmd, "requireAmd");
async function showMoodlePopup(message) {
  const Notification = await requireAmd("core/notification");
  Notification.alert(message);
}
__name(showMoodlePopup, "showMoodlePopup");
function Button({
  label,
  message = "Hello from local_multiplereact!"
}) {
  const handleClick = /* @__PURE__ */ __name(() => {
    showMoodlePopup(message).catch((e) => {
      window.console.error("Failed to show Moodle popup", e);
      window.alert(message);
    });
  }, "handleClick");
  return /* @__PURE__ */ React.createElement("button", { type: "button", onClick: handleClick }, label);
}
__name(Button, "Button");
export {
  Button as default
};
//# sourceMappingURL=local_multiplereact_button.js.map
