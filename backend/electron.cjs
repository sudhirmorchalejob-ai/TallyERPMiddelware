const { app, BrowserWindow, shell, dialog } = require("electron");
const path    = require("path");
const fs      = require("fs");
const net     = require("net");
const { spawn } = require("child_process");
const http    = require("http");

let mainWindow;
let backendProcess;
let backendPort = null;

// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE CHANGED
//
// The shell used to do this before starting anything:
//
//     http.get("http://localhost:5000", () => { /* reuse it */ })
//
// i.e. it attached to WHATEVER answered on port 5000, with no idea what that
// was, and then pointed the window at it. On the developer's machine that was
// harmless. On a customer's machine it was the "routes not found" bug: if an
// older copy of the app was still installed (or its backend had been orphaned
// by a hard kill and was still listening), the new 2.0 window was served by the
// OLD backend, and every route 2.0 introduced came back as Express's
// "Cannot GET /api/...".
//
// The fix is a build identity. build.mjs hashes the sources that go into the
// binaries and writes assets/build-info.json; the backend reports the same id
// on /api/build. Before attaching, we check that the id matches. If the port
// holds a different build - or something that is not our backend at all - we
// move to the next free port and start our own backend there, passing PORT
// through to it. The UI talks to a relative /api path, so it does not care
// which port it ended up on.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PORT   = 5000;
const PORT_SCAN_SIZE = 12;          // 5000..5011 before we give up
const PROBE_TIMEOUT  = 1500;
const STARTUP_TIMEOUT = 45_000;

// ── Expected build identity ─────────────────────────────────────────────────
function readBuildInfo() {
  try {
    const p = path.join(__dirname, "assets", "build-info.json");
    if (fs.existsSync(p)) {
      const info = JSON.parse(fs.readFileSync(p, "utf8"));
      if (info && info.buildId) return info;
    }
  } catch (_) { /* fall through to the dev default */ }
  // Only reachable when running `npm run electron` straight from source, before
  // a build has ever produced build-info.json.
  return { buildId: "dev", version: "dev" };
}

const BUILD = readBuildInfo();

// ── Resolve backend EXE path ─────────────────────────────────────────────────
// In production (installed): sibling backend/ directory next to the exe
// In dev: ../dist/tally-middleware-backend-v2.exe
function getBackendPath() {
  if (app.isPackaged) {
    // When packaged, extraResources are placed in process.resourcesPath
    return path.join(process.resourcesPath, "backend", "tally-middleware-backend-v2.exe");
  }
  return path.join(__dirname, "dist", "tally-middleware-backend-v2.exe");
}

// ── Network probes ───────────────────────────────────────────────────────────
// 127.0.0.1 rather than "localhost": on Windows the name can resolve to ::1
// first, and a mismatch there looks exactly like "nothing is listening".

// Ask a port whether it is one of our backends, and which build it is.
function probeBackend(port, timeoutMs = PROBE_TIMEOUT) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: "127.0.0.1", port, path: "/api/build", timeout: timeoutMs },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => { if (body.length < 4096) body += c; });
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve(json && json.buildId ? json : null);
          } catch (_) {
            resolve(null); // something is listening, but it is not our backend
          }
        });
      }
    );
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.on("error",   () => resolve(null));
  });
}

// Is the port genuinely free? Needed because a non-HTTP program (or a different
// server) also makes probeBackend return null, and spawning onto it would just
// produce EADDRINUSE.
function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "127.0.0.1");
  });
}

// ── Start backend EXE ─────────────────────────────────────────────────────────
function backendLogStream() {
  const logDir = path.join(app.getPath("userData"), "logs");
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, "backend.log");
    // Keep one run's worth of output. Without a cap this grows without bound on
    // a machine that syncs on a schedule.
    try {
      if (fs.existsSync(logFile) && fs.statSync(logFile).size > 4 * 1024 * 1024) {
        fs.rmSync(logFile, { force: true });
      }
    } catch (_) {}
    return { fd: fs.openSync(logFile, "a"), logFile };
  } catch (_) {
    return { fd: "ignore", logFile: null };
  }
}

function startBackend(port) {
  const exePath = getBackendPath();

  if (!fs.existsSync(exePath)) {
    throw new Error(
      `The application backend is missing from this install.\n\n` +
      `Expected it at:\n  ${exePath}\n\n` +
      `This usually means the app was copied or extracted incompletely. ` +
      `Reinstall it, or copy the whole folder rather than just the EXE.`
    );
  }

  const exeDir = path.dirname(exePath);  // resources/backend/
  const { fd, logFile } = backendLogStream();

  backendProcess = spawn(exePath, [], {
    detached: false,
    // A log FILE, not a pipe. The previous code used stdio: "pipe" and never
    // read stdout, so once the OS pipe buffer filled (around 64 KB) the child
    // blocked on write and stopped serving requests - a hang that looked like a
    // dead app and could not be diagnosed because the output went nowhere.
    stdio: ["ignore", fd, fd],
    windowsHide: true,
    cwd: exeDir,
    env: {
      ...process.env,
      // Tell the backend which port to bind. This is what lets the app move off
      // a port that a stale install is still holding.
      PORT: String(port),
      // ← tell the backend where the UI lives
      FRONTEND_DIR: exeDir,
      // The backend opens a browser on startup so that a bare copy of the EXE
      // is still usable. Inside Electron that is wrong: this window IS the UI,
      // and a stray browser tab would pop up on every launch.
      OPEN_BROWSER: "0",
    },
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to launch backend:", err.message);
  });

  if (logFile) {
    fs.writeFileSync(logFile, `\n──── launch ${new Date().toISOString()} on port ${port} ────\n`, { flag: "a" });
  }

  return logFile;
}

// ── Wait for OUR backend to be ready ─────────────────────────────────────────
// Matching the build id is the whole point: "something answered" is exactly the
// check that let the wrong backend through in the first place.
function waitForBackend(port, logFile) {
  const deadline = Date.now() + STARTUP_TIMEOUT;
  return new Promise((resolve, reject) => {
    const check = async () => {
      const info = await probeBackend(port);
      if (info && info.buildId === BUILD.buildId) return resolve(info);
      if (Date.now() > deadline) {
        return reject(new Error(
          logFile
            ? `The application backend did not start on port ${port}.\n\nIts output is in:\n  ${logFile}\n\n` +
              `Windows Defender or another antivirus may have blocked it — ` +
              `allow the app and try again.`
            : `The application backend did not start on port ${port}.`
        ));
      }
      setTimeout(check, 500);
    };
    check();
  });
}

// ── Find a backend to use, or start one ──────────────────────────────────────
async function ensureBackend() {
  const foreign = [];
  const taken   = [];

  for (let i = 0; i < PORT_SCAN_SIZE; i++) {
    const port = DEFAULT_PORT + i;
    const info = await probeBackend(port);

    if (info) {
      if (info.buildId === BUILD.buildId) {
        console.log(`Reusing the running backend on port ${port} (build ${info.buildId})`);
        return { port, spawned: false };
      }
      // A real backend, but a different build. This is the case that produced
      // the "routes not found" report: an older install still running.
      console.warn(
        `Port ${port} is serving a different build ` +
        `(${info.version || "?"} / ${info.buildId}). Leaving it alone.`
      );
      foreign.push({ port, version: info.version, buildId: info.buildId });
      taken.push(port);
      continue;
    }

    if (await isPortFree(port)) {
      const logFile = startBackend(port);
      await waitForBackend(port, logFile);
      console.log(`Backend started on port ${port} (build ${BUILD.buildId})`);
      return { port, spawned: true, movedBecause: foreign };
    }

    taken.push(port);
  }

  const detail = foreign.length
    ? `\n\nPorts already running another build of this app: ` +
      foreign.map((f) => `${f.port} (v${f.version || "?"})`).join(", ") +
      `.\nClose the other copy of TallyERP Integration from the taskbar and start this one again.`
    : taken.length
      ? `\n\nPorts ${DEFAULT_PORT}-${DEFAULT_PORT + PORT_SCAN_SIZE - 1} are all in use by other programs.`
      : "";

  throw new Error(`Could not find a free port to run on.${detail}`);
}

// ── Create app window ─────────────────────────────────────────────────────────
function createWindow(port) {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    title:  "TallyERP Integration",
    icon:   path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = `http://127.0.0.1:${port}/`;
  mainWindow.loadURL(url);
  mainWindow.setMenuBarVisibility(false);

  // A blank window is indistinguishable from a hang. Say what happened.
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, failedUrl) => {
    if (failedUrl && failedUrl.startsWith(`http://127.0.0.1:${port}`)) {
      showFatal(
        "Could not load the interface",
        `The backend is not answering at ${url}.\n\n` +
        `${desc || "Connection failed"} (code ${code}).\n\n` +
        `Close any other copy of this app, then start it again.`
      );
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function showFatal(title, message) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  dialog.showErrorBox(title, message);
  app.quit();
}

// ── Single instance ─────────────────────────────────────────────────────────
// When the user double-clicks the app again (or opens a new window), focus the
// existing window instead of launching a second copy. Also helps prevent two
// backends from spawning and "ports in use" confusion on other machines.
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
  return;
}

app.on("second-instance", (_event, _argv, _cwd) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else if (backendPort) {
    createWindow(backendPort);
  }
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // ── Fresh Installation Check ────────────────────────────────────────────────
  try {
    const { session } = require("electron");
    const exePath = app.getPath("exe");
    const exeBirthtime = fs.statSync(exePath).birthtimeMs;
    const userDataPath = app.getPath("userData");
    const installIdPath = path.join(userDataPath, "install_id.txt");

    let isFreshInstall = false;
    if (fs.existsSync(installIdPath)) {
      const savedBirthtime = parseFloat(fs.readFileSync(installIdPath, "utf8"));
      // Only a genuinely missing marker counts as fresh.
      //
      // This used to also treat "the EXE's birthtime changed" as fresh, which is
      // exactly what happens on every UPDATE. The result: shipping a new version
      // wiped the customer's saved licence, ERPNext credentials and sync state.
      // An update must preserve their configuration. Use the presence of the
      // marker file as the signal instead - it lives in userData, which survives
      // replacing the application files.
      if (Number.isNaN(savedBirthtime)) {
        isFreshInstall = true;
      }
    } else {
      isFreshInstall = true;
    }

    if (isFreshInstall) {
      console.log("Fresh installation detected! Clearing previous user data...");

      // 1. Clear Electron local storage (frontend settings, license, etc)
      await session.defaultSession.clearStorageData({
        storages: ['localstorage', 'cookies', 'indexdb', 'caches']
      });

      // 2. Clear Backend Configuration Data
      // The data folder was renamed (and the space removed) so that it matches
      // logger.js / syncState.js / lmsService.js. Both spellings are cleared so
      // an old install does not leave a stale copy behind.
      const backendDataOld = path.join(app.getPath("appData"), "TallyERPNextIntegration");
      const backendDataLegacy = path.join(app.getPath("appData"), "Tally ERPNext Integration", "data");

      if (fs.existsSync(backendDataOld)) {
        fs.rmSync(backendDataOld, { recursive: true, force: true });
      }
      if (fs.existsSync(backendDataLegacy)) {
        fs.rmSync(backendDataLegacy, { recursive: true, force: true });
      }

      // Save the new birthtime so normal restarts persist data
      fs.writeFileSync(installIdPath, exeBirthtime.toString(), "utf8");
    }
  } catch (err) {
    console.error("Failed to check for fresh installation:", err.message);
  }

  try {
    const { port } = await ensureBackend();
    backendPort = port;
    watchBackendExit();
    createWindow(port);
  } catch (err) {
    showFatal("TallyERP Integration could not start", err.message);
  }
});

app.on("window-all-closed", () => {
  stopBackend();
  app.quit();
});

// The backend outliving the window means the next launch finds a stray process
// squatting on the port, which is how this whole class of bug started.
function stopBackend() {
  if (!backendProcess) return;
  try { backendProcess.kill(); } catch (_) {}
  backendProcess = null;
}

// If the backend dies on its own, close the window instead of leaving the user
// staring at a frozen UI that can no longer reach the API.
function watchBackendExit() {
  if (!backendProcess) return;
  backendProcess.on("exit", (code) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("backend-exited", code);
    }
  });
}

app.on("activate", () => {
  if (mainWindow === null && backendPort) createWindow(backendPort);
});
