/**
 * Single source of truth for the version shown in the UI.
 *
 * Why this exists
 * ---------------
 * The sidebar pill said "v1.0 · online" in two separate files
 * (DashboardWrapper.jsx and pages/Dashboard.jsx) as a hardcoded string literal.
 * Releasing 2.0.0 shipped both copies still reading "v1.0", so the app
 * advertised a version it was not running.
 *
 * How the value gets here
 * -----------------------
 * CRA only exposes environment variables prefixed with REACT_APP_, and it
 * cannot import files from outside src/, so this file cannot read
 * package.json directly. Instead backend/build.mjs passes
 * REACT_APP_APP_VERSION in the environment of the `npm run build` child
 * process, taking the value from frontend/package.json. That makes the pill
 * track package.json automatically and leaves no literal to forget again.
 *
 * The literal below is only a fallback for a plain `npm run build` that was not
 * started by build.mjs. Keep it in sync with package.json if you ever change it.
 */
export const APP_VERSION = process.env.REACT_APP_APP_VERSION || "3.0.0";

/** "3.0.0" -> "v3.0", matching the compact style the pill has always used. */
export const APP_VERSION_SHORT = (() => {
  const [major, minor] = String(APP_VERSION).split(".");
  return major && minor ? `v${major}.${minor}` : `v${APP_VERSION}`;
})();

export default APP_VERSION;
