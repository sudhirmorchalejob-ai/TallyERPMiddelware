// build.mjs — run from the backend folder: node build.mjs

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import { rmSync } from "fs";

const require = createRequire(import.meta.url);

// Clean sensitive data before packaging
//
// The licence cache MUST be removed here. lmsService.js used to write it to
// logs/license-cache.json, and pkg.assets ships logs/**/* — so the developer's
// own cached licence (including their email) was baked into every customer
// copy of the EXE. It is now written to AppData at runtime and is never part of
// the binary, but the stale file on disk still has to go.
rmSync("data", { recursive: true, force: true });
rmSync("dist/logs", { recursive: true, force: true });
rmSync("dist/data", { recursive: true, force: true });
for (const f of ["logs/license-cache.json", "logs/feature-registry-cache.json", "logs/usage-cache.json"]) {
  rmSync(f, { force: true });
}
console.log("✓ Cleaned sensitive data before build");


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const DIST = path.join(__dirname, "dist");
const FB_DEST = path.join(DIST, "frontend-build");

// ─────────────────────────────────────────────────────────────────────────────
// BUILD IDENTITY
//
// The shipped app is two separate programs: electron.cjs (the shell) and the
// pkg-built backend EXE. electron.cjs used to attach to *anything* listening on
// port 5000, so a customer who still had an older copy installed got the new
// window pointed at the OLD backend, and every route the new version added came
// back as "Cannot GET /api/..." — the "routes not found" report.
//
// A build id fixes that. It is derived from the source that actually goes into
// the binaries, so two different builds can never collide, and it is baked into
// both halves: electron.cjs reads it from assets/build-info.json, the backend
// gets it through the esbuild banner. At startup they compare notes and refuse
// to talk to a backend that is not the one they shipped with.
//
// Hashing the inputs (rather than stamping the date) means a rebuild of
// unchanged code produces the same id, so an unchanged rebuild is still
// recognised as "already running" and reuses the live backend.
// ─────────────────────────────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
const fePkg = JSON.parse(fs.readFileSync(path.join(FRONTEND, "package.json"), "utf8"));

const HASHED_INPUTS = [
  "electron.cjs",
  "server.js",
  "syncState.js",
  "syncChunkState.js",
  "routes/index.js",
  "routes/licenseRoute.js",
  "config/config.js",
  "services/lmsService.js",
  "tally/tallyClient.js",
  "tally/Erpnextclient.js",
  "tally/erpToTallySync.js",
  "logs/logger.js",
];

function hashInputs() {
  const h = require("crypto").createHash("sha256");
  for (const rel of HASHED_INPUTS) {
    const abs = path.join(__dirname, rel);
    h.update(rel);
    if (fs.existsSync(abs)) h.update(fs.readFileSync(abs));
  }
  h.update(fePkg.version || "");
  return h.digest("hex").slice(0, 12);
}

const BUILD_ID = `${pkg.version}-${hashInputs()}`;
const BUILD_INFO_PATH = path.join(__dirname, "assets", "build-info.json");

fs.mkdirSync(path.dirname(BUILD_INFO_PATH), { recursive: true });
fs.writeFileSync(
  BUILD_INFO_PATH,
  JSON.stringify({ buildId: BUILD_ID, version: pkg.version, builtAt: new Date().toISOString() }, null, 2),
  "utf8"
);

console.log("\n[cfg] Build identity: " + BUILD_ID);
console.log(`      frontend version: ${fePkg.version}`);
console.log(`      build-info.json : ${path.relative(ROOT, BUILD_INFO_PATH)}`);

// ─────────────────────────────────────────────────────────────────────────────
// Clear previous installers.
//
// The output folder is read from build.directories.output in package.json rather
// than hardcoded, so this keeps working if the output directory changes.
//
// The folder used to keep every build ever made, so shipping 2.0.0 once meant
// it also contained "Tally ERPNext Integration 1.0.0.exe". It is very easy to
// send the customer the wrong file that way - and a 1.0.0 backend is precisely
// what produces "routes not found" if it does get run.
//
// Only finished artefacts are removed. ".icon-ico" is electron-builder's own
// scratch directory: deleting it here made makensis abort with
// "Error while loading icon ... can't open file", so it is left alone.
// win-unpacked is left for electron-builder to overwrite.
// ─────────────────────────────────────────────────────────────────────────────
const ELECTRON_DIST = path.resolve(__dirname, pkg.build?.directories?.output || "electron-dist");
if (fs.existsSync(ELECTRON_DIST)) {
  const removed = [];
  for (const entry of fs.readdirSync(ELECTRON_DIST)) {
    if (entry.endsWith(".exe") || entry.endsWith(".blockmap")) {
      try {
        fs.rmSync(path.join(ELECTRON_DIST, entry), { recursive: true, force: true });
        removed.push(entry);
      } catch (err) {
        console.warn(`Could not remove ${entry}: ${err.message}`);
      }
    }
  }
  if (removed.length) {
    console.log(`[cfg] Removed ${removed.length} stale installer(s) from ${path.basename(ELECTRON_DIST)}/:`);
    for (const r of removed) console.log(`        - ${r}`);
  }
}

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
  "process.env.LMS_BASE_URL": buildEnv.LMS_BASE_URL || "https://dashboard.licentic.org",
  "process.env.LMS_API_KEY": buildEnv.LMS_API_KEY || "",
  "process.env.LMS_PRODUCT_ID": buildEnv.LMS_PRODUCT_ID || "6a23c644247319b4b7bf7006",
  "process.env.LMS_ACTIVE_LICENSE_PATH": buildEnv.LMS_ACTIVE_LICENSE_PATH || "/api/external/actve-license",
  // Stamped, not read from .env: this is build metadata, and the .env file is
  // deliberately absent from the packaged app. electron.cjs compares this value
  // against the one in assets/build-info.json to confirm it is talking to the
  // matching backend and not a stale install squatting on the port.
  "process.env.MIDDLEWARE_BUILD_ID": BUILD_ID,
  "process.env.MIDDLEWARE_APP_VERSION": pkg.version,
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
//
// REACT_APP_APP_VERSION is passed through the child process environment rather
// than written into frontend/.env on purpose: CRA only exposes REACT_APP_*
// variables, and this keeps the version pill in the UI locked to
// frontend/package.json with no second copy to forget. See src/version.js.
console.log("\n[1/3] Building React frontend...");
execSync("npm run build", {
  cwd: FRONTEND,
  stdio: "inherit",
  env: { ...process.env, REACT_APP_APP_VERSION: fePkg.version },
});

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
    "npx pkg _bundle.cjs --targets node18-win-x64 --output dist/tally-middleware-backend-v2.exe --compress GZip",
    { cwd: __dirname, stdio: "inherit" }
  );
} finally {
  if (!process.env.KEEP_BUNDLE) {
    fs.rmSync(esbuildScriptPath, { force: true });
    fs.rmSync(bundlePath, { force: true });
  }
}

console.log("\nDone! EXE is at: dist/tally-middleware-backend-v2.exe");
console.log("Ship the entire dist/ folder (EXE + frontend-build/ together).\n");
