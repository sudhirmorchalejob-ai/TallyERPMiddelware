/**
 * Single source of truth for where the backend API lives.
 *
 * Why this exists
 * ---------------
 * Six files used to hardcode `http://localhost:5000/api`. That is baked into the
 * production bundle at build time, so the packaged app could only ever talk to a
 * backend on port 5000 of the local machine. If a customer's port 5000 was taken
 * by something else, or the port was changed, every screen in the UI - including
 * the licence login - silently failed with a network error, and there was no way
 * for the app to recover because the address was compiled in.
 *
 * A relative path fixes that: the browser resolves `/api/...` against whichever
 * origin actually served the page. In the packaged app the page is served BY the
 * backend itself, so `/api` is always correct by construction.
 *
 * In development the UI runs on :3000 (CRA) while the API is on :5000. That gap
 * is bridged by the `proxy` entry in package.json, so the same relative path
 * keeps working there too.
 *
 * `REACT_APP_API_URL` is still honoured as an explicit override, for anyone who
 * really does need to point the UI at a different host.
 */
export const API_BASE =
  (process.env.REACT_APP_API_URL || "/api").replace(/\/+$/, "");

export default API_BASE;
