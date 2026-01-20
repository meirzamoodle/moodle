var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// public/lib/react/src/profiler.ts
import { createElement, Profiler } from "react";
var isDev = true;
var onRenderCallback = /* @__PURE__ */ __name((id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  if (!isDev) return;
  console.groupCollapsed(`[${phase}] ${id} - ${actualDuration.toFixed(2)}ms`);
  console.table({
    Component: id,
    Phase: phase,
    "Duration (ms)": actualDuration.toFixed(2),
    "Base Duration (ms)": baseDuration.toFixed(2),
    "Start Time": startTime.toFixed(2),
    "Commit Time": commitTime.toFixed(2)
  });
  if (actualDuration > 16) {
    console.warn(
      `Slow render: ${actualDuration.toFixed(2)}ms (target: <16ms for 60fps)`
    );
  }
  if (actualDuration > 50) {
    console.error(
      `Very slow render: ${actualDuration.toFixed(
        2
      )}ms - Consider optimization!`
    );
  }
  console.groupEnd();
}, "onRenderCallback");
var isProfilerEnabled = /* @__PURE__ */ __name(() => {
  return isDev;
}, "isProfilerEnabled");
var getProfilerCallback = /* @__PURE__ */ __name(() => {
  return isDev ? onRenderCallback : void 0;
}, "getProfilerCallback");
function withProfiler(Component, id) {
  if (!isDev) {
    return Component;
  }
  const componentId = id || Component.displayName || Component.name || "Component";
  const ProfiledComponent = /* @__PURE__ */ __name((props) => createElement(
    Profiler,
    { id: componentId, onRender: onRenderCallback },
    createElement(Component, props)
  ), "ProfiledComponent");
  ProfiledComponent.displayName = `withProfiler(${componentId})`;
  return ProfiledComponent;
}
__name(withProfiler, "withProfiler");
export {
  getProfilerCallback,
  isProfilerEnabled,
  onRenderCallback,
  withProfiler
};
//# sourceMappingURL=profiler.js.map
