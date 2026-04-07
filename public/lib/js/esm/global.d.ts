// Global ambient declaration for CSS Modules (*.module.css).
// esbuild-css-modules-plugin transforms these imports into a scoped class-name
// map and injects the CSS at runtime — no separate .css file is produced.
// This single declaration satisfies the TypeScript compiler for every plugin.
declare module '*.module.css' {
    const styles: Record<string, string>;
    export default styles;
}
