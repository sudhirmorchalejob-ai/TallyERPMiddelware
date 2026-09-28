const { app, BrowserWindow, shell } = require("electron");
const path    = require("path");
const { spawn } = require("child_process");
const http    = require("http");

let mainWindow;
let backendProcess;

const PORT = 5000;

// ── Resolve backend EXE path ──────────────────────────────────────────────────
// In production (installed): sibling backend/ directory next to the exe
// In dev: ../dist/tally-middleware-backend.exe
function getBackendPath() {
  if (app.isPackaged) {
    // When packaged, extraResources are placed in process.resourcesPath
    return path.join(process.resourcesPath, "backend", "tally-middleware-backend.exe");
  }
  return path.join(__dirname, "dist", "tally-middleware-backend.exe");
}

// ── Start backend EXE ─────────────────────────────────────────────────────────
function startBackend() {
  const exePath = getBackendPath();
  const exeDir  = path.dirname(exePath);  // resources/backend/

  backendProcess = spawn(exePath, [], {
    detached: false,
    stdio: "pipe",
    windowsHide: true,
    cwd: exeDir,
    env: {
      ...process.env,
      FRONTEND_DIR: exeDir,   // ← tell the backend where it lives
    },
  });
}

// ── Wait for backend to be ready ──────────────────────────────────────────────
function waitForBackend(retries = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      http.get(`http://localhost:${PORT}`, () => {
        resolve();
      }).on("error", () => {
        attempts++;
        if (attempts >= retries) {
          reject(new Error("Backend did not start in time"));
        } else {
          setTimeout(check, delay);
        }
      });
    };
    check();
  });
}

// ── Create app window ─────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    title:  "Tally ERPNext Integration",
    icon:   path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // ── Fresh Installation Check ────────────────────────────────────────────────
  try {
    const { session } = require("electron");
    const fs = require("fs");
    const exePath = app.getPath("exe");
    const exeBirthtime = fs.statSync(exePath).birthtimeMs;
    const userDataPath = app.getPath("userData");
    const installIdPath = path.join(userDataPath, "install_id.txt");
    
    let isFreshInstall = false;
    if (fs.existsSync(installIdPath)) {
      const savedBirthtime = parseFloat(fs.readFileSync(installIdPath, "utf8"));
      if (savedBirthtime !== exeBirthtime) {
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
      const backendDataOld = path.join(app.getPath("appData"), "TallyERPNextIntegration");
      const backendDataNew = path.join(app.getPath("appData"), "Tally ERPNext Integration", "data");
      
      if (fs.existsSync(backendDataOld)) {
        fs.rmSync(backendDataOld, { recursive: true, force: true });
      }
      if (fs.existsSync(backendDataNew)) {
        fs.rmSync(backendDataNew, { recursive: true, force: true });
      }

      // Save the new birthtime so normal restarts persist data
      fs.writeFileSync(installIdPath, exeBirthtime.toString(), "utf8");
    }
  } catch (err) {
    console.error("Failed to check for fresh installation:", err.message);
  }

  // Kill any existing backend on port 5000 before starting fresh
  try {
    await new Promise((resolve) => {
      http.get(`http://localhost:${PORT}`, () => {
        // Already running — don't start a new one
        console.log("Backend already running on port 4000");
        resolve();
      }).on("error", () => {
        // Not running — start it
        startBackend();
        resolve();
      });
    });
  } catch (_) {
    startBackend();
  }

  try {
    await waitForBackend();
    createWindow();
  } catch (err) {
    console.error(err.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    try { backendProcess.kill(); } catch (_) {}
  }
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
