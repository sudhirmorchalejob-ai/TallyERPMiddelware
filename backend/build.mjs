// build.mjs — run from the backend folder: node build.mjs

import { execSync } from "child_process";
import fs           from "fs";
import path         from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import { rmSync } from "fs";

const require = createRequire(import.meta.url);

// Clean sensitive data before packaging
rmSync("data", { recursive: true, force: true });
rmSync("dist/logs", { recursive: true, force: true });
rmSync("dist/data", { recursive: true, force: true });
console.log("✓ Cleaned sensitive data before build");


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const FRONTEND  = path.join(ROOT, "frontend");
const DIST      = path.join(__dirname, "dist");
const FB_DEST   = path.join(DIST, "frontend-build");

// ─────────────────────────────────────────────────────────────────────────────
// Licentic build configuration
//
// The packaged EXE ships WITHOUT a .env — package.json extraResources copies
// only the EXE and frontend-build, and pkg.assets has no .env either. Anything
// read from process.env at runtime is therefore EMPTY in production, which is
// what silently broke licence verification in the shipped build: with no
// product id the request went out with no ?productId=, and Licentic answered
// "License not found for this product" for every single paying customer.
//
// So the values are injected here at build time. They end up baked into the
// binary — unavoidable for an app that must call the API unattended — but they
// stay OUT of git, because they are read from the gitignored backend/.env.
//
// The API key is never printed, only its length.
// ─────────────────────────────────────────────────────────────────────────────
const buildEnv = {};
try {
  const parsed = require("dotenv").config({ path: path.join(__dirname, ".env") }).parsed || {};
  for (const k of ["LMS_BASE_URL", "LMS_API_KEY", "LMS_PRODUCT_ID", "LMS_ACTIVE_LICENSE_PATH"]) {
    if (parsed[k]) buildEnv[k] = parsed[k];
  }
} catch {
  console.warn("  (dotenv unavailable at build time - using defaults)");
}

const INJECT = {
  "process.env.LMS_BASE_URL":            buildEnv.LMS_BASE_URL || "https://dashboard.licentic.org",
  "process.env.LMS_API_KEY":             buildEnv.LMS_API_KEY || "",
  "process.env.LMS_PRODUCT_ID":          buildEnv.LMS_PRODUCT_ID || "6a23c644247319b4b7bf7006",
  "process.env.LMS_ACTIVE_LICENSE_PATH": buildEnv.LMS_ACTIVE_LICENSE_PATH || "/api/external/actve-license",
};

console.log("\n[cfg] Licentic build config:");
console.log(`      LMS_BASE_URL            = ${INJECT["process.env.LMS_BASE_URL"]}`);
console.log(`      LMS_PRODUCT_ID          = ${INJECT["process.env.LMS_PRODUCT_ID"]}`);
console.log(`      LMS_ACTIVE_LICENSE_PATH = ${INJECT["process.env.LMS_ACTIVE_LICENSE_PATH"]}`);
console.log(`      LMS_API_KEY             = ${buildEnv.LMS_API_KEY ? `present (len=${buildEnv.LMS_API_KEY.length}, baked into binary)` : "*** MISSING ***"}`);

if (!buildEnv.LMS_API_KEY) {
  console.error("\n  ERROR: LMS_API_KEY was not found in backend/.env.");
  console.error("  The packaged app could not verify any licence. Add it and rebuild.\n");
  process.exit(1);
}

// Injected as a banner rather than through esbuild `define`: define on
// process.env.* is unreliable in esbuild 0.28 for string values, and a banner
// is evaluated before any module body runs, so lmsService sees these values
// when it captures them at import time. JSON.stringify handles quoting.
const bannerJs = Object.entries(INJECT)
  .map(([k, v]) => `try { ${k} = ${JSON.stringify(v)}; } catch (e) {}`)
  .join(" ");

// 1. Build React
console.log("\n[1/3] Building React frontend...");
execSync("npm run build", { cwd: FRONTEND, stdio: "inherit" });

// 2. Copy frontend build to dist/
console.log("\n[2/3] Copying frontend build to dist/frontend-build...");
fs.rmSync(FB_DEST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(FRONTEND, "build"), FB_DEST, { recursive: true });

// 3. Bundle + package
console.log("\n[3/3] Packaging backend into EXE...");

const esbuildScript = `
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: '_bundle.cjs',

  banner: {
    js: ${JSON.stringify("const __importMetaUrl = require('url').pathToFileURL(__filename).href; " + bannerJs)},
  },
  define: {
    // Required: in a cjs bundle esbuild empties import.meta, which makes
    // fileURLToPath(import.meta.url) throw and stops the EXE booting at all.
    'import.meta.url': '__importMetaUrl',
  },

  external: [
    'axios', 'form-data', 'proxy-from-env', 'follow-redirects',
    'xml2js', 'xmlbuilder', 'sax',
    'cors', 'object-assign',
    'agentkeepalive', 'humanize-ms',
    'express', 'dotenv', 'node-cron',
  ],
});
console.log('esbuild bundle complete');
`;

const esbuildScriptPath = path.join(__dirname, "_esbuild.mjs");
fs.writeFileSync(esbuildScriptPath, esbuildScript);
const bundlePath = path.join(__dirname, "_bundle.cjs");

try {
  execSync("node _esbuild.mjs", { cwd: __dirname, stdio: "inherit" });

  execSync(
    "npx pkg _bundle.cjs --targets node18-win-x64 --output dist/tally-middleware-backend.exe --compress GZip",
    { cwd: __dirname, stdio: "inherit" }
  );
} finally {
  if (!process.env.KEEP_BUNDLE) {
    fs.rmSync(esbuildScriptPath, { force: true });
    fs.rmSync(bundlePath, { force: true });
  }
}

console.log("\nDone! EXE is at: dist/tally-middleware-backend.exe");
console.log("Ship the entire dist/ folder (EXE + frontend-build/ together).\n");
