import express from "express";
import cors from "cors";
import { config } from "./config/config.js";
import router from "./routes/index.js";
import licenseRoute from "./routes/licenseRoute.js";
import { logger } from "./logs/logger.js";
import {
  fetchTallyLedgers,
  fetchTallyStockItems,
  fetchTallyVouchers,
  fetchTallyVouchersChunked,
  fetchTallyLedgersChunked,
  fetchTallyGroups,
  fetchTallyGodowns,
  fetchTallyCostCentres,
  fetchTallyCompanies,
} from "./tally/tallyClient.js";
import { runFullSync, smartSyncLedgersToErpNext } from "./tally/Erpnextclient.js";
import {
  getCompanyState,
  saveCompanyState,
  getIncrementalVoucherDates,
  filterChangedMasters,
  buildAlterIdMap,
  resetCompanyState,
  loadSyncHistory,
  saveSyncHistoryRecord,
} from "./syncState.js";
import {
  isFullSyncComplete,
  markFullSyncComplete,
  markChunkDone,
  resetChunkProgress,
} from "./syncChunkState.js";


import { startErpToTallyScheduler } from "./tally/erpToTallySync.js";
if (process.env.ERP_TO_TALLY_ENABLED === "true" && process.env.ERPNEXT_URL && !process.env.ERPNEXT_URL.includes("localhost:8000")) {
  startErpToTallyScheduler(
    { url: process.env.ERPNEXT_URL, apiKey: process.env.ERPNEXT_API_KEY, apiSecret: process.env.ERPNEXT_API_SECRET },
    { companyName: process.env.TALLY_COMPANY_NAME || "Tally", intervalMs: 60000 }
  );
}


const app = express();

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ status: 400, message: err.message });
  }
  next();
});
app.use("/api", router);
app.use("/api", licenseRoute);

// ─────────────────────────────────────────────────────────────────────────────
// BUILD IDENTITY — read by electron.cjs before it attaches to a backend.
//
// The shell and the backend ship as two separate binaries, and the shell has to
// be able to tell "my backend" apart from "some other program that happens to
// be listening on this port". BUILD_ID is baked in at package time from a hash
// of the sources that produced the build (see build.mjs), so a different build
// can never report the same id.
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/build", (_req, res) => {
  res.json({
    ok: true,
    app: "tally-erpnext-integration",
    version: process.env.MIDDLEWARE_APP_VERSION || "dev",
    buildId: process.env.MIDDLEWARE_BUILD_ID || "dev",
    packaged: !!process.pkg,
  });
});

// NOTE: the terminal 404 for unknown /api routes is registered further down, just
// before the static handler. It has to be the LAST /api middleware, not the
// first: `app.use("/api", ...)` runs for every /api request, so registering the
// guard here would answer 404 before the auto-sync routes below ever got a
// chance to run.

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SYNC CONFIG — persisted to data/auto_sync_config.json
// Survives server restarts and nodemon reloads.
// The user sets it via POST /api/auto-sync/configure.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DATA_DIR lives OUTSIDE the project folder so nodemon never watches it.
// Default: a sibling folder "<project>-data" next to your project root.
// Override by setting DATA_DIR in your .env file.
// Always write to AppData — works in Electron, PKG exe, and dev.
// NOTE: the folder name is "TallyERPNextIntegration" (no spaces) so it matches
// logger.js, syncState.js, syncChunkState.js and lmsService.js. It previously
// used "Tally ERPNext Integration" here and only, which split auto-sync config
// and sync state across two different folders.
const DATA_DIR_DEFAULT = path.join(os.homedir(), "AppData", "Roaming", "TallyERPNextIntegration", "data");
const CONFIG_DIR = process.env.DATA_DIR || DATA_DIR_DEFAULT;
const CONFIG_FILE = path.join(CONFIG_DIR, "auto_sync_config.json");
const CREDS_FILE = path.join(CONFIG_DIR, "auto_sync_creds.json");  // gitignore this

const DEFAULT_CONFIG = {
  enabled: false,
  // FIX: Read from .env instead of hardcoding 24h / 30 days.
  // Set AUTO_SYNC_INTERVAL_MINUTES and AUTO_SYNC_FROM_DAYS in your .env file.
  intervalMs: (parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES, 10) || 1440) * 60 * 1000,
  intervalLabel: process.env.AUTO_SYNC_INTERVAL_MINUTES ? `${process.env.AUTO_SYNC_INTERVAL_MINUTES}m` : "daily",
  options: {
    syncChartOfAccounts: false,
    syncLedgers: true,
    syncSmartLedgers: false,
    syncOpeningBalances: false,
    syncGodowns: false,
    syncCostCentres: false,
    syncStock: true,
    syncVouchers: true,
    syncInvoices: false,
    syncTaxes: false,
  },
  creds: {
    url: "",
    apiKey: "",
    apiSecret: "",
    erpnextCompany: "",
  },
  companyName: "",
  // FIX: Read fromDays from .env — not hardcoded to 30
  fromDays: parseInt(process.env.AUTO_SYNC_FROM_DAYS, 10) || 30,
};

function loadAutoSyncConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const saved = JSON.parse(raw);
    // Load saved creds separately (apiKey + apiSecret live in their own file)
    let savedCreds = {};
    try {
      if (fs.existsSync(CREDS_FILE)) {
        savedCreds = JSON.parse(fs.readFileSync(CREDS_FILE, "utf8"));
        logger.info("Auto-sync: loaded ERPNext credentials from creds file");
      }
    } catch (e) {
      logger.warn("Could not load auto-sync creds file: " + e.message);
    }
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      options: { ...DEFAULT_CONFIG.options, ...(saved.options || {}) },
      creds: { ...DEFAULT_CONFIG.creds, ...(saved.creds || {}), ...savedCreds },
    };
  } catch (err) {
    logger.warn("Could not load auto-sync config — using defaults. (" + err.message + ")");
    return { ...DEFAULT_CONFIG };
  }
}

// ── Debounced persist — prevents rapid consecutive writes from triggering
// multiple nodemon reloads. Also add  "ignore": ["data/*"]  to your
// nodemon.json (or package.json nodemonConfig) to stop the restart loop.
let _persistTimer = null;
function persistAutoSyncConfig(immediate = false) {
  if (_persistTimer) { clearTimeout(_persistTimer); _persistTimer = null; }
  const doWrite = () => {
    _persistTimer = null;
    _writeAutoSyncConfig();
  };
  if (immediate) { doWrite(); return; }
  _persistTimer = setTimeout(doWrite, 500); // batch writes within 500ms
}
function _writeAutoSyncConfig() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    // Main config — no secrets
    const toSave = {
      ..._autoSyncConfig,
      creds: {
        url: _autoSyncConfig.creds.url,
        erpnextCompany: _autoSyncConfig.creds.erpnextCompany,
      },
    };
    const tmp = CONFIG_FILE + ".bak";
    fs.writeFileSync(tmp, JSON.stringify(toSave, null, 2), "utf8");
    fs.renameSync(tmp, CONFIG_FILE);
    // Creds file — saved separately so scheduler survives server restarts
    // Add data/auto_sync_creds.json to your .gitignore
    if (_autoSyncConfig.creds.apiKey && _autoSyncConfig.creds.apiSecret) {
      const credsToSave = {
        url: _autoSyncConfig.creds.url,
        apiKey: _autoSyncConfig.creds.apiKey,
        apiSecret: _autoSyncConfig.creds.apiSecret,
        erpnextCompany: _autoSyncConfig.creds.erpnextCompany,
      };
      fs.writeFileSync(CREDS_FILE, JSON.stringify(credsToSave, null, 2), "utf8");
    }
  } catch (err) {
    logger.warn("Could not save auto-sync config: " + err.message);
  }
} // end _writeAutoSyncConfig

// Load persisted config on startup — restores enabled/interval/options/company
// across nodemon restarts and production server restarts
let _autoSyncConfig = loadAutoSyncConfig();

let _autoSyncTimer = null;   // setInterval handle
let _syncRunning = false;  // concurrency guard
let _lastAutoSync = null;
const _lastSyncByCompany = {}; // { companyName: lastSyncResult }   // last run result, served by /status
let _nextRunAt = null;   // timestamp of next scheduled run, exposed in /status
let _autoSyncRunCount = 0;     // monotonically incrementing run counter for log messages

// ─────────────────────────────────────────────────────────────────────────────
// CORE AUTO-SYNC RUNNER
// This is intentionally identical to what a manual sync route does:
//   1. Resolve fromDate/toDate (incremental)
//   2. Fetch only changed masters
//   3. Fetch vouchers for the date window
//   4. Call runFullSync (same function manual sync calls)
//   5. Save state on success/warning
// ─────────────────────────────────────────────────────────────────────────────
async function runAutoSync(triggeredBy = "interval") {
  // ── Concurrency guard ────────────────────────────────────────────────────
  if (_syncRunning) {
    logger.human.headsUp("Auto-sync skipped — previous run is still in progress.");
    return;
  }

  const { companyName, options, creds, fromDays } = _autoSyncConfig;

  // ── Pre-flight checks (same as manual sync would fail fast on) ───────────
  logger.info(`[auto-sync] Pre-flight check — companyName="${companyName}" erpUrl="${creds.url || config.erpnext.url}" hasKey=${!!(creds.apiKey || config.erpnext.apiKey)}`);

  if (!companyName) {
    logger.human.headsUp("Auto-sync skipped — no Tally company name is set. Please go to Sync settings and enter your company name.");
    return;
  }
  const erpUrl = creds.url || config.erpnext.url;
  const erpKey = creds.apiKey || config.erpnext.apiKey;
  if (!erpUrl || !erpKey) {
    logger.human.headsUp("Auto-sync skipped — ERPNext connection details are missing. Please go to Sync settings and enter your ERPNext URL and API key.");
    return;
  }

  _syncRunning = true;
  _autoSyncRunCount++;
  const _runNum = _autoSyncRunCount;

  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);

  // Merge runtime creds with .env fallbacks — identical to manual sync
  const effectiveCreds = {
    url: erpUrl,
    apiKey: erpKey,
    apiSecret: creds.apiSecret || config.erpnext.apiSecret,
    erpnextCompany: creds.erpnextCompany || "",
  };

  const erpnextUrl = effectiveCreds.url || "default";
  const state = getCompanyState(companyName, erpnextUrl);
  const isFirstSync = !state.lastVoucherSyncDate && !state.lastMasterSyncAt;

  // ── Determine fallback fromDate for first-ever sync ───────────────────────
  // Priority:
  //   1. Tally company's booksFrom date  (the actual opening of books — correct for new ERPNext)
  //   2. fromDays setting                (user preference, e.g. "last 30 days")
  //   3. today - 30 days                 (safe hard fallback)
  //
  // This is what was broken: on a fresh ERPNext account the old code used
  // today - fromDays (e.g. 3 days), so it missed all historical vouchers.
  // Manual sync works because the user explicitly picks a fromDate.
  // Now auto-sync does the same thing automatically on first run.
  let fallbackFromDate;
  if (isFirstSync) {
    try {
      const companies = await fetchTallyCompanies();
      const match = companies.find(
        (c) => c.name && c.name.trim().toLowerCase() === companyName.trim().toLowerCase()
      ) || companies[0];
      if (match) {
        // startingFrom = the date the company was first created in Tally (covers full history).
        // booksFrom    = current year's opening date only — misses prior-year vouchers.
        // Always prefer startingFrom so a state reset doesn't silently skip historical data.
        const companyStart = match.startingFrom || match.booksFrom;
        if (companyStart) {
          fallbackFromDate = companyStart;
          logger.human.step(`First sync — using Tally company start date: ${fallbackFromDate}`);
        }
      }
    } catch (e) {
      logger.warn(`Could not fetch Tally company start date: ${e.message}`);
    }
  }
  if (!fallbackFromDate) {
    // Not first sync OR company-date fetch failed — use fromDays setting
    const d = new Date(now);
    d.setDate(d.getDate() - fromDays);
    fallbackFromDate = d.toISOString().slice(0, 10);
  }

  logger.resetLastSeenCompany(companyName);   // ← seed company BEFORE any logs
  // ── Log the trigger so Live Logs shows the run starting immediately ──
  logger.human.autoSyncTriggered(companyName, _autoSyncConfig.intervalLabel, _runNum);
  logger.human.syncStarted(companyName, effectiveCreds.url);


  _lastAutoSync = {
    startedAt: now.toISOString(),
    status: "running",
    company: companyName,
    triggeredBy,
    fromDate: state.lastVoucherSyncDate || fallbackFromDate,
    toDate,
    isIncremental: !isFirstSync,
  };

  try {
    // ── 1. MASTERS — fetch all, sync only changed (same as manual) ──────────
    let groups = [];
    let costCentres = [];
    let godowns = [];
    let ledgers = [];
    let stockItems = [];

    // Hold the full fetch arrays so we can update Alter IDs AFTER sync
    let allGroups = [];
    let allCostCentres = [];
    let allGodowns = [];
    let allLedgers = [];
    let allStock = [];

    if (options.syncChartOfAccounts || options.syncOpeningBalances) {
      logger.human.syncStepStarting("Chart of Accounts — reading account groups from Tally");
      allGroups = await fetchTallyGroups(companyName);
      const { toSync: changedGroups, unchanged: unchangedGroups } =
        filterChangedMasters(allGroups, state.groupAlterIds);
      logger.human.masterSyncResult("Groups", changedGroups.length, unchangedGroups);
      if (changedGroups.length === 0) logger.human.syncStepSkipped("Chart of Accounts", unchangedGroups);
      groups = changedGroups;
    }

    if (options.syncCostCentres) {
      logger.human.syncStepStarting("Cost Centres — reading from Tally");
      allCostCentres = await fetchTallyCostCentres(companyName);
      const { toSync: changedCostCentres, unchanged: unchangedCostCentres } =
        filterChangedMasters(allCostCentres, state.costCentreAlterIds);
      logger.human.masterSyncResult("Cost Centres", changedCostCentres.length, unchangedCostCentres);
      if (changedCostCentres.length === 0) logger.human.syncStepSkipped("Cost Centres", unchangedCostCentres);
      costCentres = changedCostCentres;
    }

    if (options.syncGodowns) {
      logger.human.syncStepStarting("Godowns — reading warehouses from Tally");
      allGodowns = await fetchTallyGodowns(companyName);
      const { toSync: changedGodowns, unchanged: unchangedGodowns } =
        filterChangedMasters(allGodowns, state.godownAlterIds);
      logger.human.masterSyncResult("Godowns", changedGodowns.length, unchangedGodowns);
      if (changedGodowns.length === 0) logger.human.syncStepSkipped("Godowns", unchangedGodowns);
      godowns = changedGodowns;
    }

    if (options.syncLedgers || options.syncOpeningBalances || options.syncSmartLedgers) {
      const stepLabel = options.syncSmartLedgers && !options.syncLedgers
        ? "Smart Ledgers — reading all ledgers from Tally (will filter by voucher usage)"
        : "Ledgers — reading from Tally";
      logger.human.syncStepStarting(stepLabel);
      allLedgers = await fetchTallyLedgers(companyName);
      const { toSync: changedLedgers, unchanged: unchangedLedgers } =
        filterChangedMasters(allLedgers, state.ledgerAlterIds);
      logger.human.masterSyncResult("Ledgers", changedLedgers.length, unchangedLedgers);
      if (changedLedgers.length === 0 && !options.syncSmartLedgers)
        logger.human.syncStepSkipped("Ledgers", unchangedLedgers);
      // For smart-ledger-only mode pass the full list so runFullSync filters by
      // voucher usage. For regular ledger sync pass only changed ones (incremental).
      ledgers = (options.syncSmartLedgers && !options.syncLedgers) ? allLedgers : changedLedgers;
    }

    if (options.syncStock || options.syncTaxes) {
      logger.human.syncStepStarting("Stock Items — reading from Tally");
      allStock = await fetchTallyStockItems(companyName);
      const { toSync: changedStock, unchanged: unchangedStock } =
        filterChangedMasters(allStock, state.stockAlterIds);
      logger.human.masterSyncResult("Stock Items", changedStock.length, unchangedStock);
      if (changedStock.length === 0) logger.human.syncStepSkipped("Stock Items", unchangedStock);
      stockItems = changedStock;
    }

    // ── 2. VOUCHERS — incremental or first-sync chunked ─────────────────────
    let vouchers = [];
    if (options.syncVouchers || options.syncInvoices || options.syncSmartLedgers) {
      const fullSyncDone = isFullSyncComplete(companyName, erpnextUrl);
      const needsFullSync = isFirstSync || !fullSyncDone;

      if (needsFullSync) {
        // First sync — fetch ALL vouchers in monthly chunks, resumable
        // Use company start date already resolved above in fallbackFromDate
        const chunkFrom = fallbackFromDate;
        const chunkTo = toDate;
        logger.human.syncStepStarting(`Vouchers (FIRST SYNC) — reading monthly chunks from ${chunkFrom} to ${chunkTo}`);
        vouchers = await fetchTallyVouchersChunked(
          companyName,
          chunkFrom,
          chunkTo,
          erpnextUrl,
          (chunkId, count, totalChunks, idx, skipped) => {
            logger.human.step(
              `Voucher chunk ${chunkId} (${idx}/${totalChunks}): ` +
              `${skipped ? "already synced, skipping" : count + " vouchers fetched"}`
            );
          }
        );
        logger.human.step(`First sync: ${vouchers.length} total vouchers fetched across all chunks`);
      } else {
        // Incremental — only new vouchers since last sync
        const { fromDate, toDate: vToDate } =
          getIncrementalVoucherDates(companyName, fallbackFromDate, toDate, erpnextUrl);
        logger.human.syncStepStarting(`Vouchers — reading from ${fromDate} to ${vToDate}`);
        vouchers = await fetchTallyVouchers(companyName, fromDate, vToDate);
        logger.human.step(`Read ${vouchers.length} voucher${vouchers.length !== 1 ? "s" : ""} from Tally (${fromDate} → ${vToDate})`);
      }
    }

    // ── 3. Run the sync — EXACT same call as manual sync ────────────────────
    const result = await runFullSync(
      companyName,
      { groups, ledgers, stockItems, vouchers, godowns, costCentres },
      options,
      effectiveCreds
    );

    // ── 4. Save incremental state (same logic as manual) ────────────────────
    const shouldSaveState = result.status === "ok" || result.status === "warning";
    if (shouldSaveState) {
      // Only save lastVoucherSyncDate if vouchers were actually requested AND
      // either some were synced OR the voucher step explicitly reported ok/uptodate.
      // This prevents the date advancing when 0 vouchers matched the window,
      // which would cause all future runs to also get 0 vouchers (stale window).
      const voucherStepOk = result.steps?.vouchers?.status === "ok" ||
        result.steps?.vouchers?.status === "uptodate";
      const vouchersWereRequested = options.syncVouchers || options.syncInvoices || options.syncSmartLedgers;
      const shouldSaveVoucherDate = !vouchersWereRequested || voucherStepOk || vouchers.length > 0;

      const newAlterIds = {};
      if (allGroups.length) newAlterIds.groupAlterIds = buildAlterIdMap(allGroups, "name", result.steps?.chartOfAccounts?.failedKeys || []);
      if (allCostCentres.length) newAlterIds.costCentreAlterIds = buildAlterIdMap(allCostCentres, "name", result.steps?.costCentres?.failedKeys || []);
      if (allGodowns.length) newAlterIds.godownAlterIds = buildAlterIdMap(allGodowns, "name", result.steps?.godowns?.failedKeys || []);
      if (allLedgers.length) newAlterIds.ledgerAlterIds = buildAlterIdMap(allLedgers, "name", result.steps?.ledgers?.failedKeys || []);
      if (allStock.length) newAlterIds.stockAlterIds = buildAlterIdMap(allStock, "name", result.steps?.stockItems?.failedKeys || []);

      saveCompanyState(companyName, {
        // Only advance the voucher checkpoint if vouchers actually synced
        ...(shouldSaveVoucherDate ? { lastVoucherSyncDate: toDate } : {}),
        lastMasterSyncAt: now.toISOString(),
        ...newAlterIds
      }, erpnextUrl);
      logger.human.stateSaved(companyName);

      // If this was the first full chunked sync, mark it complete so next run is incremental
      const fullSyncDone = isFullSyncComplete(companyName, erpnextUrl);
      const needsFullSync = isFirstSync || !fullSyncDone;
      if (needsFullSync && (options.syncVouchers || options.syncInvoices)) {
        markFullSyncComplete(companyName, erpnextUrl);
        logger.human.step(`Full sync complete — future auto-syncs for "${companyName}" will be incremental ✅`);
      }
    } else {
      logger.human.headsUp(
        `Progress was not saved for "${companyName}" because a critical step failed. ` +
        `Fix the issue and run again.`
      );
    }

    _lastAutoSync = {
      ...result,
      steps: result.steps || {},
      triggeredBy,
      runNumber: _runNum,
      fromDate: state.lastVoucherSyncDate || fallbackFromDate,
      toDate,
      isIncremental: !isFirstSync,
      startedAt: now.toISOString(),
      finishedAt: new Date().toISOString(),
    };

    saveSyncHistoryRecord(_lastAutoSync);

    logger.human.syncDone(
      companyName,
      state.lastVoucherSyncDate || fallbackFromDate,
      toDate,
      result.totalSynced ?? 0
    );
    logger.human.autoSyncRunSummary(
      companyName,
      state.lastVoucherSyncDate || fallbackFromDate,
      toDate,
      result.status || "ok",
      _runNum
    );

  } catch (err) {
    _lastAutoSync = {
      status: "failed",
      error: err.message,
      startedAt: now.toISOString(),
      company: companyName,
      fromDate: state.lastVoucherSyncDate || fallbackFromDate,
      toDate,
      triggeredBy,
      finishedAt: new Date().toISOString(),
    };
    saveSyncHistoryRecord(_lastAutoSync);
    logger.human.syncFailed(companyName, err.message);
  } finally {
    _syncRunning = false;
    // Recalculate nextRunAt AFTER run finishes so frontend countdown stays accurate.
    // Without this, _nextRunAt is stale (points to when the run STARTED) and the
    // frontend ring shows "–" for the entire duration of the next interval.
    if (_autoSyncConfig.enabled && _autoSyncTimer) {
      _nextRunAt = new Date(Date.now() + _autoSyncConfig.intervalMs);
    }
    // Log when the next run is scheduled so Live Logs shows the countdown
    if (_autoSyncConfig.enabled && _nextRunAt) {
      logger.human.autoSyncNextScheduled(
        _nextRunAt.toLocaleTimeString("en-IN", { hour12: false }),
        _autoSyncConfig.intervalLabel
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function stopScheduler() {
  if (_autoSyncTimer) {
    clearInterval(_autoSyncTimer);
    _autoSyncTimer = null;
  }
}

function startScheduler(silent = false) {
  stopScheduler();
  if (!_autoSyncConfig.enabled) return;
  _nextRunAt = new Date(Date.now() + _autoSyncConfig.intervalMs);
  _autoSyncTimer = setInterval(() => { _nextRunAt = new Date(Date.now() + _autoSyncConfig.intervalMs); runAutoSync("interval"); }, _autoSyncConfig.intervalMs);
  if (!silent) {
    logger.human.autoSyncScheduled(
      Object.entries(_autoSyncConfig.options)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", "),
      _autoSyncConfig.intervalLabel
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SYNC API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auto-sync/configure
 *
 * Set everything the scheduler needs — mirrors the manual Sync UI fields.
 *
 * Body (all fields optional, merged into current config):
 * {
 *   enabled:      true,
 *   interval:     "6h" | "12h" | "24h" | "48h" | number (minutes),
 *   companyName:  "My Tally Company",
 *   fromDays:     30,
 *   options: {
 *     syncLedgers: true, syncStock: true, syncVouchers: true, ...
 *   },
 *   creds: {
 *     url:            "https://myerpnext.frappe.cloud",
 *     apiKey:         "xxx",
 *     apiSecret:      "yyy",
 *     erpnextCompany: "My ERPNext Company"
 *   }
 * }
 */
app.post("/api/auto-sync/configure", (req, res) => {
  const body = req.body || {};

  // Parse interval — accepts human labels (from the UI buttons) or raw minutes
  if (body.interval !== undefined) {
    const PRESETS = {
      // UI button labels → minutes
      "15 min": 15, "15min": 15, "15m": 15,
      "30 min": 30, "30min": 30, "30m": 30,
      "1 hour": 60, "1hour": 60, "1h": 60,
      "2 hours": 120, "2h": 120,
      "4 hours": 240, "4h": 240,
      "8 hours": 480, "8h": 480,
      "daily": 1440, "24h": 1440, "1 day": 1440,
    };
    const raw = String(body.interval).trim().toLowerCase();
    let minutes;
    if (PRESETS[raw] !== undefined) {
      minutes = PRESETS[raw];
      _autoSyncConfig.intervalLabel = body.interval; // keep original label
    } else {
      minutes = parseInt(raw, 10);
      _autoSyncConfig.intervalLabel = `${minutes}m`;
    }
    if (!isNaN(minutes) && minutes > 0) {
      _autoSyncConfig.intervalMs = minutes * 60 * 1000;
    } else {
      return res.status(400).json({ ok: false, error: `Invalid interval "${body.interval}". Use '15 min', '30 min', '1 hour', '4 hours', '8 hours', 'daily' or a number of minutes.` });
    }
  }

  if (body.enabled !== undefined) _autoSyncConfig.enabled = !!body.enabled;
  if (body.companyName !== undefined) _autoSyncConfig.companyName = body.companyName.trim();
  if (body.fromDays !== undefined) _autoSyncConfig.fromDays = parseInt(body.fromDays, 10) || 30;

  if (body.options && typeof body.options === "object") {
    _autoSyncConfig.options = { ..._autoSyncConfig.options, ...body.options };
  }

  if (body.creds && typeof body.creds === "object") {
    _autoSyncConfig.creds = { ..._autoSyncConfig.creds, ...body.creds };
  }

  // Only restart (and log) the scheduler if a scheduling-relevant field changed.
  // When the frontend re-injects creds on mount it sends only {creds} — in that
  // case we do NOT restart the scheduler so the countdown timer is not reset.
  // Only restart scheduler when scheduling-relevant fields change.
  // options/creds changes do NOT need a restart — they are read at run time.
  // Restarting on every checkbox toggle was causing multiple "Auto-sync active"
  // log messages and resetting the countdown unnecessarily.
  const scheduleFieldChanged = (
    body.enabled !== undefined ||
    body.interval !== undefined ||
    body.companyName !== undefined
  );
  if (scheduleFieldChanged) {
    startScheduler();
  }
  persistAutoSyncConfig();

  res.json({
    ok: true,
    message: _autoSyncConfig.enabled
      ? `Auto-sync enabled — runs every ${_autoSyncConfig.intervalLabel}`
      : "Auto-sync configured but not enabled (set enabled: true to start)",
    config: _safeConfig(),
  });
});

/**
 * GET /api/auto-sync/status
 * Returns current scheduler config + last run result.
 */
app.get("/api/auto-sync/status", (req, res) => {
  const requestedCompany = req.query.company || _autoSyncConfig.companyName;
  const history = loadSyncHistory(requestedCompany);

  // Check completed jobs for this company
  let lastManual = null;
  try {
    const syncJobs = globalThis._syncJobs;
    if (syncJobs) {
      const completed = Array.from(syncJobs.values())
        .filter(j => j.status === "done" && j.result?.steps)
        .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
      lastManual = completed[0]?.result || null;
    }
  } catch (_) { }

  const lastSync = _lastSyncByCompany[requestedCompany]
    || (globalThis._lastSyncByCompany?.[requestedCompany])
    || _lastAutoSync
    || lastManual
    || history[0]
    || null;

  res.json({
    config: _safeConfig(),
    running: _syncRunning,
    lastSync,
    history,
    nextRunIn: _autoSyncConfig.enabled && _autoSyncTimer
      ? `up to ${_autoSyncConfig.intervalLabel}`
      : "not scheduled",
    nextRunAt: _nextRunAt ? _nextRunAt.toISOString() : null,
  });
});

/**
 * POST /api/auto-sync/run-now
 * Trigger an immediate run using the current config (same as the interval would).
 * Respects the same concurrency guard — won't double-run.
 */
app.post("/api/auto-sync/run-now", async (_req, res) => {
  if (_syncRunning) {
    return res.status(409).json({ ok: false, error: "A sync is already running. Wait for it to finish." });
  }
  res.json({ ok: true, message: "Auto-sync triggered manually — running in background" });
  runAutoSync("manual");
});

/**
 * POST /api/auto-sync/enable   — quick toggle on
 * POST /api/auto-sync/disable  — quick toggle off
 */
app.post("/api/auto-sync/enable", (_req, res) => {
  _autoSyncConfig.enabled = true;
  startScheduler();
  const what = Object.entries(_autoSyncConfig.options).filter(([, v]) => v).map(([k]) => k).join(", ");
  logger.human.autoSyncEnabled(_autoSyncConfig.intervalLabel, what);
  persistAutoSyncConfig();
  res.json({ ok: true, message: `Auto-sync enabled — runs every ${_autoSyncConfig.intervalLabel}` });
});

app.post("/api/auto-sync/disable", (_req, res) => {
  _autoSyncConfig.enabled = false;
  stopScheduler();
  logger.human.autoSyncDisabled();
  persistAutoSyncConfig();
  res.json({ ok: true, message: "Auto-sync disabled" });
});

/**
 * POST /api/auto-sync/reset-state
 * Clears incremental state — next run will do a full sync from scratch.
 */
app.post("/api/auto-sync/reset-state", (req, res) => {
  const company = (req.body || {}).company || _autoSyncConfig.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const erpnextUrl = _autoSyncConfig.creds.url || config.erpnext.url || "default";
  // Reset both sync state AND chunk progress so next run starts completely fresh
  resetCompanyState(company, erpnextUrl);
  resetChunkProgress(company, erpnextUrl);
  res.json({ ok: true, message: `Incremental state cleared for "${company}" — next sync will be a full sync` });
});

/**
 * GET /api/auto-sync/state
 * Returns the raw incremental sync state for the configured company.
 */
app.get("/api/auto-sync/state", (req, res) => {
  const company = req.query.company || _autoSyncConfig.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const erpnextUrl = _autoSyncConfig.creds.url || config.erpnext.url || "default";
  const state = getCompanyState(company, erpnextUrl);
  res.json({ ok: true, company, state });
});

// Strip secrets from config before sending to client
function _safeConfig() {
  return {
    enabled: _autoSyncConfig.enabled,
    interval: _autoSyncConfig.intervalLabel,
    intervalMs: _autoSyncConfig.intervalMs,
    companyName: _autoSyncConfig.companyName,
    fromDays: _autoSyncConfig.fromDays,
    options: _autoSyncConfig.options,
    erpnextUrl: _autoSyncConfig.creds.url || config.erpnext.url || "",
    erpnextCompany: _autoSyncConfig.creds.erpnextCompany || "",
    // Never expose apiKey / apiSecret
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Auto-resume scheduler on startup if it was enabled before restart ───────
// This is what makes it survive nodemon reloads and production restarts.
if (_autoSyncConfig.enabled) {
  startScheduler(true); // silent=true — startup log comes from app.listen below
}



// ── Unknown API routes must 404 as JSON, not fall through to the SPA ─────────
// Registered LAST among the /api middleware, immediately before the static
// handler, so every real API route above gets first refusal.
//
// Without it an unmatched GET /api/... reached the SPA catch-all below and got
// index.html back with HTTP 200, so the browser ran res.json() on
// "<!doctype html>..." and threw a parse error that surfaced as a meaningless
// "routes not found" message instead of a clear 404.
app.use("/api", (_req, res) => {
  res.status(404).json({
    ok: false,
    error: `No API route for ${_req.method} ${_req.originalUrl}`,
    buildId: process.env.MIDDLEWARE_BUILD_ID || "dev",
  });
});

// ── Serve bundled React frontend ─────────────────────────────────────────────────────
// In the packaged app the folder sits next to the backend executable, and
// electron.cjs tells us where that is via FRONTEND_DIR. The fallbacks below
// cover the cases where it is not set: running the bare EXE by hand, and
// running from source.
//
// This used to resolve a single path and silently do nothing if it was missing.
// That silence was the other half of the "routes not found" report — with no
// frontend-build the app still bound the port, still answered /api/*, but GET /
// returned Express's default "Cannot GET /", so the window showed a bare
// routes-not-found page. It now reports the problem loudly instead.
function frontendCandidates() {
  return [
    process.env.FRONTEND_DIR,
    // Packaged: frontend-build sits beside the exe inside resources/backend.
    process.pkg ? path.join(path.dirname(process.execPath), "frontend-build") : null,
    // Packaged, launched directly by hand from its own folder.
    process.pkg ? path.join(path.dirname(process.execPath), "..", "frontend-build") : null,
    // Dev: backend/frontend-build
    path.join(__dirname, "frontend-build"),
    // Dev: backend/dist/frontend-build (where build.mjs stages it)
    path.join(__dirname, "dist", "frontend-build"),
  ].filter(Boolean);
}

function resolveFrontendDir() {
  for (const dir of frontendCandidates()) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return null;
}

const FRONTEND_BUILD = resolveFrontendDir();

if (FRONTEND_BUILD) {
  app.use(express.static(FRONTEND_BUILD));
  // SPA fallback. Only for GET, and only for non-API paths, so a missing API
  // route can never be answered with the HTML shell.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(FRONTEND_BUILD, "index.html"));
  });
} else {
  const msg =
    "The user interface could not be found (no frontend-build/index.html). " +
    "The API is running, but there is no screen to show.";
  console.error(
    `\n${msg}\nLooked in:\n` +
      frontendCandidates().map((d) => `  - ${d}`).join("\n") +
      "\n"
  );
  // A bare JSON 503 beats Express's default HTML "Cannot GET /" page: it names
  // the actual problem instead of looking like a broken route.
  app.get("/", (_req, res) => res.status(503).json({ ok: false, error: msg }));
}

// ── Launch the user interface ─────────────────────────────────────────────────
// The shipped EXE is a headless server: double-clicking it starts Express and
// (before this existed) nothing visible happened, so the customer got no window
// and no way to reach the login screen. Open the default browser at the UI once
// the socket is actually bound.
//
// Opt out with OPEN_BROWSER=0 (or NO_BROWSER=1). Dev is left alone because the
// CRA dev server on :3000 is the surface being worked on there.
function openUiInBrowser(url) {
  try {
    let cmd, args;
    if (process.platform === "win32") {
      // The empty "" is the window title `start` would otherwise steal from the
      // URL. Without it Windows opens a cmd window titled after the address.
      cmd = "cmd";
      args = ["/c", "start", "", url];
    } else if (process.platform === "darwin") {
      cmd = "open";
      args = [url];
    } else {
      cmd = "xdg-open";
      args = [url];
    }
    // detached + unref so the browser never becomes a child this process
    // waits on, and so closing the app does not take the browser with it.
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.on("error", (e) =>
      logger.warn(`Could not open the browser automatically (${e.message}). Open ${url} manually.`)
    );
    child.unref();
    logger.info(`[UI] Opened ${url} in the default browser`);
  } catch (e) {
    logger.warn(`Could not open the browser automatically (${e.message}). Open ${url} manually.`);
  }
}

const _uiUrl = `http://localhost:${config.port}`;
const _shouldOpenUi =
  !/^(0|false|no)$/i.test(String(process.env.OPEN_BROWSER ?? "")) &&
  !/^(1|true)$/i.test(String(process.env.NO_BROWSER ?? "")) &&
  !!(process.pkg || String(process.env.OPEN_BROWSER ?? "").toLowerCase() === "1");

app.listen(config.port, () => {
  // logger.human.serverReady removed
  logger.human.tallyConnected(config.tally.url);
  logger.human.checkReady();
  if (!_autoSyncConfig.enabled) {
    logger.human.headsUp(
      'Auto-sync is off. You can turn it on from the Sync settings page and choose how often it should run.'
    );
  }
  if (_shouldOpenUi) {
    // Small delay so the browser's first request does not race the socket.
    setTimeout(() => openUiInBrowser(_uiUrl), 400);
  } else {
    logger.info(`[UI] Serving the interface at ${_uiUrl}`);
  }
});

// A busy port is the single most common reason a customer sees "nothing
// happens". Fail with an explanation instead of an unhandled crash.
app.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    const msg =
      `Port ${config.port} is already in use, so the app could not start.\n` +
      `Another copy of TallyERP Integration is probably already running — ` +
      `check the taskbar, or close it and try again.\n` +
      `If something unrelated is using that port, set PORT to a free one in the .env file.`;
    logger.error(`[STARTUP] ${msg}`);
    console.error(`\n${msg}\n`);
  } else {
    logger.error(`[STARTUP] ${err && err.message ? err.message : err}`);
  }
  process.exit(1);
});
// Trigger restart
