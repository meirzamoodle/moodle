import fs from "fs";
import path from "path";
import { createRequire } from "module";

const rootDir = process.cwd();
const esbuildDir = path.join(rootDir, ".esbuild");
const tsconfigOut = path.join(rootDir, "tsconfig.aliases.json");
const PUBLIC_ROOT = path.join(rootDir, "public");
const AUTOINIT_BUILD_DIR = path.join(PUBLIC_ROOT, "lib/react_autoinit/build");
const AUTOINIT_SRC_DIR = path.join(PUBLIC_ROOT, "lib/react_autoinit/src");
const runtimeAliasesOut = path.join(AUTOINIT_SRC_DIR, "aliases.ts");

function loadComponentPathMap() {
    const require = createRequire(import.meta.url);

    // Load Moodle's components data from .grunt/components.js.
    const { fetchComponentData } = require(
        path.join(process.cwd(), ".grunt", "components.js")
    );

    // Format: `{ components: { "public/lib": "core", ... } }`.
    return fetchComponentData().components;
}

// Check whether a react/src directory has any .tsx or .ts file recursively.
function hasReactSource(dir) {
    if (!fs.existsSync(dir)) {
        return false;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (hasReactSource(full)) {
                return true;
            }
        } else if (
            entry.isFile() &&
            (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
        ) {
            return true;
        }
    }

    return false;
}

// Check whether two path maps are equal.
function pathsEqual(a, b) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }

    for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
            return false;
        }

        const aArr = a[key] ?? [];
        const bArr = b[key] ?? [];
        if (aArr.length !== bArr.length) {
            return false;
        }

        for (let i = 0; i < aArr.length; i++) {
            if (aArr[i] !== bArr[i]) {
                return false;
            }
        }
    }

    return true;
}

function shallowObjectEqual(a, b) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    for (const k of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
        if (a[k] !== b[k]) return false;
    }
    return true;
}

// Collapse ["value"] onto one line
function stringifyFlatArrays(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/\[\s+\"(.*?)\"\s+\]/g, '["$1"]');
}

function normalizeRelativeUrlBase(rel) {
    let out = rel.replace(/\\/g, "/");
    if (!out.startsWith(".")) {
        out = `./${out}`;
    }
    if (!out.endsWith("/")) {
        out += "/";
    }
    return out;
}

/**
 * Single scan that discovers which Moodle components have React TSX|TS code.
 */
function scanReactAliases() {
    const componentPathMap = loadComponentPathMap();

    // Global alias map from components that actually have react/src/*.ts(x).
    /** @type {Record<string, string>} */
    const globalAliasMap = {};

    for (const [componentPath, componentName] of Object.entries(componentPathMap)) {
        const reactSrcDir = path.join(rootDir, componentPath, "react", "src");

        if (!hasReactSource(reactSrcDir)) {
            continue;
        }

        const aliasKey = `@moodle/${componentName}/*`;
        const targetPattern = path
            .join(componentPath, "react", "src", "*")
            .replace(/\\/g, "/");

        globalAliasMap[aliasKey] = targetPattern;
    }

    // TS paths for tsconfig.aliases.json
    const tsPaths = {};
    tsPaths["@moodle/core/*"] = ["public/lib/react/src/*"]; // Always include core alias.
    for (const [alias, target] of Object.entries(globalAliasMap)) {
        tsPaths[alias] = [target];
    }

    // Runtime alias map for react_autoinit:
    // "@moodle/mod_book/*" -> namespace "mod_book"
    // value must be relative URL base from react_autoinit/build/index.js to react/build/
    const runtimeMap = {};

    for (const [aliasPattern, targets] of Object.entries(tsPaths)) {
        const namespace = aliasPattern.replace(/^@moodle\//, "").replace(/\/\*$/, "");
        const target = targets?.[0];
        if (!target) continue;

        // Ensure src exists.
        const srcDirGuess = target
            .replace(/\/\*$/, "")
            .replace(/\/src$/, "/src")
            .replace(/\/src\/\*$/, "/src");

        const absoluteSrcDir = path.resolve(rootDir, srcDirGuess);
        if (!fs.existsSync(absoluteSrcDir)) {
            continue;
        }

        // Compute build dir.
        let absoluteBuildDir;
        if (namespace === "core") {
            // Core components are built here in your build.mjs:
            // public/lib/react/build/components/**.js
            absoluteBuildDir = path.resolve(PUBLIC_ROOT, "lib/react/build/components");
        } else {
            // public/<x>/react/src/* -> public/<x>/react/build/
            const buildPath = target
                .replace(/\/src\/\*$/, "/build")
                .replace(/\/\*$/, "/build");

            absoluteBuildDir = path.resolve(rootDir, buildPath);
        }

        const rel = path.relative(AUTOINIT_BUILD_DIR, absoluteBuildDir);
        runtimeMap[namespace] = normalizeRelativeUrlBase(rel);
    }

    return { tsPaths, runtimeMap };
}

function writeTsconfigAliases(tsPaths) {
    const tsconfig = {
        compilerOptions: { paths: tsPaths },
    };

    let previousPaths = null;
    if (fs.existsSync(tsconfigOut)) {
        try {
            const previousTsconfig = JSON.parse(fs.readFileSync(tsconfigOut, "utf8"));
            previousPaths = previousTsconfig.compilerOptions?.paths ?? {};
        } catch {
            previousPaths = null;
        }
    }

    if (previousPaths && pathsEqual(previousPaths, tsPaths)) {
        console.log("No alias changes detected, skipping tsconfig.aliases.json regeneration.");
        return false;
    }

    if (!fs.existsSync(esbuildDir)) {
        fs.mkdirSync(esbuildDir, { recursive: true });
    }

    fs.writeFileSync(tsconfigOut, stringifyFlatArrays(tsconfig));
    console.log("Generated TS alias file:", tsconfigOut);
    return true;
}

function writeRuntimeAliases(runtimeMap) {
    let previousMap = null;
    if (fs.existsSync(runtimeAliasesOut)) {
        try {
            // aliases.ts is a TS file - try to parse JSON object by a simple regex extraction.
            const content = fs.readFileSync(runtimeAliasesOut, "utf8");
            const match = content.match(/REACT_ALIAS_MAP:\s*Record<string,\s*string>\s*=\s*(\{[\s\S]*\});/);
            if (match?.[1]) {
                previousMap = JSON.parse(match[1]);
            }
        } catch {
            previousMap = null;
        }
    }

    if (previousMap && shallowObjectEqual(previousMap, runtimeMap)) {
        console.log("[react] No runtime alias changes detected, skipping react_autoinit/src/aliases.ts regeneration.");
        return false;
    }

    fs.mkdirSync(AUTOINIT_SRC_DIR, { recursive: true });

    const output =
        `/**\n` +
        ` * GENERATED FILE. DO NOT EDIT.\n` +
        ` * Runtime map for core/react_autoinit.\n` +
        ` */\n` +
        `export const REACT_ALIAS_MAP: Record<string, string> = ${JSON.stringify(runtimeMap, null, 2)};\n`;

    fs.writeFileSync(runtimeAliasesOut, output, "utf8");
    console.log("[react] Runtime alias map generated:", path.relative(rootDir, runtimeAliasesOut));
    return true;
}

export function generateAliases() {
    const { tsPaths, runtimeMap } = scanReactAliases();

    // Write tsconfig.aliases.json (skip if unchanged).
    const tsChanged = writeTsconfigAliases(tsPaths);

    // Always attempt runtime file generation (it has its own skip check).
    const runtimeChanged = writeRuntimeAliases(runtimeMap);

    return { tsChanged, runtimeChanged };
}
