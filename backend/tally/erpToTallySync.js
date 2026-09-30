// @ts-nocheck
/**
 * erpToTallySync.js
 * ─────────────────
 * One-way sync service: pushes ERPNext vouchers into Tally.
 *
 * Covers four voucher types:
 *   1. Sales Invoice   → Tally Sales Voucher
 *   2. Purchase Invoice → Tally Purchase Voucher
 *   3. Payment Entry   → Tally Payment / Receipt Voucher
 *   4. Journal Entry   → Tally Journal Voucher
 *
 * Workflow per type:
 *   Fetch ERPNext records → Normalise data → Call Tally create function → Log → Return results
 *
 * Place at: backend/tally/erpToTallySync.js
 */

import {
  fetchSalesInvoices,
  fetchPurchaseInvoices,
  fetchExpenseEntries,
  fetchJournalEntries,
} from "./Erpnextclient.js";

import {
  createSalesVoucher,
  createPurchaseVoucher,
  createPaymentVoucher,
  createJournalVoucher,
} from "./tallyClient.js";

import { logger } from "../logs/logger.js";

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Delay between Tally import calls — avoids overwhelming single-threaded Tally.
 */
const TALLY_IMPORT_DELAY_MS = 600;

/**
 * Build a sync result object for a single voucher type.
 */
function _newTypeResult(typeName) {
  return {
    type:       typeName,
    fetched:    0,
    created:    0,
    updated:    0,
    failed:     0,
    skipped:    0,
    errors:     [],
    startedAt:  null,
    finishedAt: null,
  };
}

/**
 * Create a keyed lookup map by ERPNext doc name for dedup / status checks.
 */
function _buildLookupMap(items) {
  const map = new Map();
  for (const item of items) {
    if (item && item.name) map.set(item.name, item);
  }
  return map;
}

// ═════════════════════════════════════════════════════════════════════════════
// Sync functions — one per voucher type
// ═════════════════════════════════════════════════════════════════════════════

/**
 * syncSalesInvoices(creds?, options?)
 *
 * Fetch submitted Sales Invoices from ERPNext → push into Tally as Sales Vouchers.
 *
 * @param {Object}  creds              - optional ERPNext { url, apiKey, apiSecret }
 * @param {Object}  options            - optional filters
 * @param {String}  options.companyName - Tally company name
 * @param {String}  options.fromDate   - ISO date (YYYY-MM-DD)
 * @param {String}  options.toDate     - ISO date (YYYY-MM-DD)
 * @returns {Object} sync result summary
 */
export async function syncSalesInvoices(creds = {}, options = {}) {
  const result = _newTypeResult("Sales Invoice → Sales Voucher");
  result.startedAt = new Date().toISOString();
  const companyName = options.companyName || "default";

  try {
    logger.info("[ERP→Tally] Starting Sales Invoice sync → Tally Sales Voucher");

    // ── 1. Fetch from ERPNext ──────────────────────────────────────────────
    const invoices = await fetchSalesInvoices(creds, {
      fromDate:  options.fromDate,
      toDate:    options.toDate,
      limit:     options.limit || 50,
      filters:   options.filters || [],
    });
    result.fetched = invoices.length;

    if (invoices.length === 0) {
      logger.info("[ERP→Tally] No Sales Invoices to sync");
      result.finishedAt = new Date().toISOString();
      return result;
    }

    // ── 2. Push each invoice into Tally ────────────────────────────────────
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      try {
        const res = await createSalesVoucher(inv, companyName);
        if (res.success) {
          if (res.message === "created") result.created++;
          else result.updated++;
        } else {
          result.failed++;
          result.errors.push({ name: inv.name, error: res.message });
        }
      } catch (err) {
        result.failed++;
        result.errors.push({ name: inv.name, error: err.message });
        logger.error("[ERP→Tally] Sales Voucher failed for " + inv.name + ": " + err.message);
      }
      if (i < invoices.length - 1) await sleep(TALLY_IMPORT_DELAY_MS);
    }

    logger.info(
      "[ERP→Tally] Sales Invoice sync complete: " + invoices.length + " fetched, " +
      result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP→Tally] Sales Invoice sync failed: " + err.message);
  }

  result.finishedAt = new Date().toISOString();
  return result;
}

/**
 * syncPurchaseInvoices(creds?, options?)
 *
 * Fetch submitted Purchase Invoices from ERPNext → push into Tally as Purchase Vouchers.
 *
 * @param {Object}  creds              - optional ERPNext { url, apiKey, apiSecret }
 * @param {Object}  options            - optional filters
 * @param {String}  options.companyName - Tally company name
 * @param {String}  options.fromDate   - ISO date (YYYY-MM-DD)
 * @param {String}  options.toDate     - ISO date (YYYY-MM-DD)
 * @returns {Object} sync result summary
 */
export async function syncPurchaseInvoices(creds = {}, options = {}) {
  const result = _newTypeResult("Purchase Invoice → Purchase Voucher");
  result.startedAt = new Date().toISOString();
  const companyName = options.companyName || "default";

  try {
    logger.info("[ERP→Tally] Starting Purchase Invoice sync → Tally Purchase Voucher");

    const invoices = await fetchPurchaseInvoices(creds, {
      fromDate:  options.fromDate,
      toDate:    options.toDate,
      limit:     options.limit || 50,
      filters:   options.filters || [],
    });
    result.fetched = invoices.length;

    if (invoices.length === 0) {
      logger.info("[ERP→Tally] No Purchase Invoices to sync");
      result.finishedAt = new Date().toISOString();
      return result;
    }

    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      try {
        const res = await createPurchaseVoucher(inv, companyName);
        if (res.success) {
          if (res.message === "created") result.created++;
          else result.updated++;
        } else {
          result.failed++;
          result.errors.push({ name: inv.name, error: res.message });
        }
      } catch (err) {
        result.failed++;
        result.errors.push({ name: inv.name, error: err.message });
        logger.error("[ERP→Tally] Purchase Voucher failed for " + inv.name + ": " + err.message);
      }
      if (i < invoices.length - 1) await sleep(TALLY_IMPORT_DELAY_MS);
    }

    logger.info(
      "[ERP→Tally] Purchase Invoice sync complete: " + invoices.length + " fetched, " +
      result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP→Tally] Purchase Invoice sync failed: " + err.message);
  }

  result.finishedAt = new Date().toISOString();
  return result;
}

/**
 * syncExpenseEntries(creds?, options?)
 *
 * Fetch submitted Payment Entries from ERPNext → push into Tally as Payment/Receipt Vouchers.
 *
 * @param {Object}  creds              - optional ERPNext { url, apiKey, apiSecret }
 * @param {Object}  options            - optional filters
 * @param {String}  options.companyName - Tally company name
 * @param {String}  options.fromDate   - ISO date (YYYY-MM-DD)
 * @param {String}  options.toDate     - ISO date (YYYY-MM-DD)
 * @returns {Object} sync result summary
 */
export async function syncExpenseEntries(creds = {}, options = {}) {
  const result = _newTypeResult("Payment Entry → Payment/Receipt Voucher");
  result.startedAt = new Date().toISOString();
  const companyName = options.companyName || "default";

  try {
    logger.info("[ERP→Tally] Starting Payment Entry sync → Tally Payment/Receipt Voucher");

    const entries = await fetchExpenseEntries(creds, {
      fromDate:  options.fromDate,
      toDate:    options.toDate,
      limit:     options.limit || 50,
      filters:   options.filters || [],
    });
    result.fetched = entries.length;

    if (entries.length === 0) {
      logger.info("[ERP→Tally] No Payment Entries to sync");
      result.finishedAt = new Date().toISOString();
      return result;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        const res = await createPaymentVoucher(entry, companyName);
        if (res.success) {
          if (res.message === "created") result.created++;
          else result.updated++;
        } else {
          result.failed++;
          result.errors.push({ name: entry.name, error: res.message });
        }
      } catch (err) {
        result.failed++;
        result.errors.push({ name: entry.name, error: err.message });
        logger.error("[ERP→Tally] Payment Voucher failed for " + entry.name + ": " + err.message);
      }
      if (i < entries.length - 1) await sleep(TALLY_IMPORT_DELAY_MS);
    }

    logger.info(
      "[ERP→Tally] Payment Entry sync complete: " + entries.length + " fetched, " +
      result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP→Tally] Payment Entry sync failed: " + err.message);
  }

  result.finishedAt = new Date().toISOString();
  return result;
}

/**
 * syncJournalEntries(creds?, options?)
 *
 * Fetch submitted Journal Entries from ERPNext → push into Tally as Journal Vouchers.
 *
 * @param {Object}  creds              - optional ERPNext { url, apiKey, apiSecret }
 * @param {Object}  options            - optional filters
 * @param {String}  options.companyName - Tally company name
 * @param {String}  options.fromDate   - ISO date (YYYY-MM-DD)
 * @param {String}  options.toDate     - ISO date (YYYY-MM-DD)
 * @returns {Object} sync result summary
 */
export async function syncJournalEntries(creds = {}, options = {}) {
  const result = _newTypeResult("Journal Entry → Journal Voucher");
  result.startedAt = new Date().toISOString();
  const companyName = options.companyName || "default";

  try {
    logger.info("[ERP→Tally] Starting Journal Entry sync → Tally Journal Voucher");

    const entries = await fetchJournalEntries(creds, {
      fromDate:  options.fromDate,
      toDate:    options.toDate,
      limit:     options.limit || 50,
      filters:   options.filters || [],
    });
    result.fetched = entries.length;

    if (entries.length === 0) {
      logger.info("[ERP→Tally] No Journal Entries to sync");
      result.finishedAt = new Date().toISOString();
      return result;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        const res = await createJournalVoucher(entry, companyName);
        if (res.success) {
          if (res.message === "created") result.created++;
          else result.updated++;
        } else {
          result.failed++;
          result.errors.push({ name: entry.name, error: res.message });
        }
      } catch (err) {
        result.failed++;
        result.errors.push({ name: entry.name, error: err.message });
        logger.error("[ERP→Tally] Journal Voucher failed for " + entry.name + ": " + err.message);
      }
      if (i < entries.length - 1) await sleep(TALLY_IMPORT_DELAY_MS);
    }

    logger.info(
      "[ERP→Tally] Journal Entry sync complete: " + entries.length + " fetched, " +
      result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP→Tally] Journal Entry sync failed: " + err.message);
  }

  result.finishedAt = new Date().toISOString();
  return result;
}

// ═════════════════════════════════════════════════════════════════════════════
// Full ERPNext → Tally sync orchestrator
// ═════════════════════════════════════════════════════════════════════════════

/**
 * runErpToTallySync(creds?, options?)
 *
 * Master sync function — runs all four voucher type syncs sequentially and
 * returns a combined result object.
 *
 * @param {Object}  creds                 - optional ERPNext { url, apiKey, apiSecret }
 * @param {Object}  options               - optional settings
 * @param {String}  options.companyName   - Tally company name (default "default")
 * @param {String}  options.fromDate      - ISO date lower bound
 * @param {String}  options.toDate        - ISO date upper bound
 * @param {Number}  options.limit         - page size for ERPNext API (default 50)
 * @param {Boolean} options.syncSales     - include Sales Invoice sync (default true)
 * @param {Boolean} options.syncPurchase  - include Purchase Invoice sync (default true)
 * @param {Boolean} options.syncExpenses  - include Payment Entry sync (default true)
 * @param {Boolean} options.syncJournals  - include Journal Entry sync (default true)
 * @returns {Object} full sync result with per-type breakdown
 */
export async function runErpToTallySync(creds = {}, options = {}) {
  const startedAt = new Date().toISOString();
  const companyName = options.companyName || "default";

  logger.info("[ERP→Tally] ═══ Full ERPNext → Tally sync started ═══");
  logger.info("[ERP→Tally] Company: " + companyName + " | Date range: " + (options.fromDate || "all") + " → " + (options.toDate || "all"));

  const result = {
    company:     companyName,
    startedAt,
    finishedAt:  null,
    status:      "running",
    sales:       null,
    purchase:    null,
    expenses:    null,
    journals:    null,
    totals:      { fetched: 0, created: 0, updated: 0, failed: 0, skipped: 0 },
    errors:      [],
  };

  // ── Run each type sequentially — Tally is single-threaded ────────────────
  const steps = [];
  if (options.syncSales    !== false) steps.push(["sales",    () => syncSalesInvoices(creds, options)]);
  if (options.syncPurchase !== false) steps.push(["purchase", () => syncPurchaseInvoices(creds, options)]);
  if (options.syncExpenses !== false) steps.push(["expenses", () => syncExpenseEntries(creds, options)]);
  if (options.syncJournals !== false) steps.push(["journals", () => syncJournalEntries(creds, options)]);

  for (const [key, fn] of steps) {
    try {
      const res = await fn();
      result[key] = res;
      result.totals.fetched += res.fetched;
      result.totals.created += res.created;
      result.totals.updated += res.updated;
      result.totals.failed  += res.failed;
      result.totals.skipped += res.skipped;
      result.errors.push(...(res.errors || []));
    } catch (err) {
      logger.error("[ERP→Tally] " + key + " step crashed: " + err.message);
      result.errors.push({ name: key + "-step", error: err.message });
      result.totals.failed++;
    }
  }

  // ── Status logic ─────────────────────────────────────────────────────────
  const hasCriticalFail = result.errors.length > 0 && result.totals.created === 0;
  const hasPartialFail  = result.totals.failed > 0 && result.totals.created > 0;
  result.status = hasCriticalFail ? "failed" : hasPartialFail ? "warning" : "ok";

  result.finishedAt = new Date().toISOString();

  logger.info(
    "[ERP→Tally] ═══ Full sync complete: " + result.status + " ═══ | " +
    "Fetched: " + result.totals.fetched + ", Created: " + result.totals.created +
    ", Updated: " + result.totals.updated + ", Failed: " + result.totals.failed
  );

  return result;
}

// ═════════════════════════════════════════════════════════════════════════════
//  Polling Scheduler
//  Periodically polls ERPNext for new/updated vouchers and pushes them to Tally.
//  Tracks last sync time in a JSON file so it survives restarts.
// ═════════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import os from "os";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;   // 5 minutes
// Not process.cwd(): the packaged EXE inherits whatever directory it was
// launched from, so on a machine that installs to C:\Program Files this write
// fails and the scheduler forgets its last run on every restart. Use the same
// AppData folder as the rest of the app.
const STATE_FILE          = join(
  process.env.DATA_DIR
    || join(os.homedir(), "AppData", "Roaming", "TallyERPNextIntegration", "data"),
  "erpToTallyScheduler.json"
);

// ── Scheduler state ────────────────────────────────────────────────────────
let _timer           = null;
let _running         = false;
let _lastSyncTime    = null;
let _intervalMs      = DEFAULT_INTERVAL_MS;
let _schedulerOpts   = {};
let _schedulerCreds  = {};
let _syncCount       = 0;
let _lastResult      = null;

// ── State persistence ──────────────────────────────────────────────────────

function _loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, "utf8"));
      _lastSyncTime = data.lastSyncTime || null;
      _syncCount    = data.syncCount    || 0;
      logger.info("[Scheduler] State loaded — last sync: " + (_lastSyncTime || "never") + ", total runs: " + _syncCount);
    }
  } catch (err) {
    logger.warn("[Scheduler] Could not load state file: " + err.message + " — starting fresh");
  }
}

function _saveState() {
  try {
    writeFileSync(STATE_FILE, JSON.stringify({
      lastSyncTime: _lastSyncTime,
      syncCount:    _syncCount,
      updatedAt:    new Date().toISOString(),
    }, null, 2), "utf8");
  } catch (err) {
    logger.warn("[Scheduler] Could not save state file: " + err.message);
  }
}

// ── Single tick ────────────────────────────────────────────────────────────

async function _tick() {
  if (_running) {
    logger.warn("[Scheduler] Previous sync still running — skipping this tick");
    return;
  }

  _running = true;
  const tickStart = new Date().toISOString();

  try {
    logger.info("[Scheduler] ═══ Tick #" + (_syncCount + 1) + " — polling ERPNext ═══");

    const result = await runErpToTallySync(_schedulerCreds, {
      ..._schedulerOpts,
      fromDate: _lastSyncTime || undefined,
    });

    _lastResult  = result;
    _syncCount++;

    if (result.totals.fetched > 0) {
      _lastSyncTime = tickStart;
    }

    _saveState();

    logger.info(
      "[Scheduler] Tick #" + _syncCount + " complete: " + result.status + " | " +
      "Fetched: " + result.totals.fetched + ", Created: " + result.totals.created +
      ", Failed: " + result.totals.failed
    );
  } catch (err) {
    logger.error("[Scheduler] Tick #" + (_syncCount + 1) + " crashed: " + err.message);
    _lastResult = { status: "crashed", error: err.message, finishedAt: new Date().toISOString() };
  } finally {
    _running = false;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * startScheduler(creds?, options?)
 *
 * Starts the polling scheduler. On each interval it calls runErpToTallySync()
 * with fromDate = last sync time, so only new/updated records are pushed.
 *
 * @param {Object}  creds                 - ERPNext { url, apiKey, apiSecret }
 * @param {Object}  options               - settings
 * @param {Number}  options.intervalMs    - poll interval in ms (default 300000 = 5 min)
 * @param {String}  options.companyName   - Tally company name
 * @param {String}  options.fromDate      - initial fromD(ignored after first successful sync)
 * @param {Boolean} options.syncSales     - include Sales Invoice (default true)
 * @param {Boolean} options.syncPurchase  - include Purchase Invoice (default true)
 * @param {Boolean} options.syncExpenses  - include Payment Entry (default true)
 * @param {Boolean} options.syncJournals  - include Journal Entry (default true)
 * @returns {Object} { started, intervalMs }
 */
export function startErpToTallyScheduler(creds = {}, options = {}) {
  if (!creds?.url || !creds?.apiKey || creds.url.includes("your-erpnext-domain") || creds.apiKey === "your_api_key_here") {
    logger.info("[Scheduler] Scheduler idle — configure ERPNext credentials in Settings or Sync UI to enable auto-sync.");
    return { started: false, message: "Credentials not configured" };
  }

  if (_timer) {
    logger.warn("[Scheduler] Already running — call stopErpToTallyScheduler() first");
    return { started: false, intervalMs: _intervalMs };
  }

  _schedulerCreds  = creds;
  _schedulerOpts   = { ...options };
  _intervalMs      = options.intervalMs || DEFAULT_INTERVAL_MS;

  _loadState();

  if (options.fromDate && !_lastSyncTime) {
    _lastSyncTime = options.fromDate;
  }

  logger.info("[Scheduler] Starting — interval: " + (_intervalMs / 1000) + "s | company: " + (options.companyName || "default"));

  _tick();
  _timer = setInterval(_tick, _intervalMs);

  return { started: true, intervalMs: _intervalMs };
}

/**
 * stopScheduler()
 *
 * Stops the polling scheduler gracefully. Does NOT interrupt a sync that is
 * currently in progress — it will finish, then the timer is cleared.
 *
 * @returns {Object} { stopped, syncCount, lastSyncTime }
 */
export function stopErpToTallyScheduler() {
  if (!_timer) {
    logger.info("[Scheduler] Not running");
    return { stopped: false, syncCount: _syncCount, lastSyncTime: _lastSyncTime };
  }

  clearInterval(_timer);
  _timer = null;
  _saveState();

  logger.info("[Scheduler] Stopped — total runs: " + _syncCount + " | last sync: " + (_lastSyncTime || "never"));
  return { stopped: true, syncCount: _syncCount, lastSyncTime: _lastSyncTime };
}

/**
 * schedulerStatus()
 *
 * Returns current scheduler state without modifying anything.
 *
 * @returns {Object} { running, syncing, syncCount, lastSyncTime, intervalMs, lastResult }
 */
export function erpToTallySchedulerStatus() {

  return {
    running:      !!_timer,
    syncing:      _running,
    syncCount:    _syncCount,
    lastSyncTime: _lastSyncTime,
    intervalMs:   _intervalMs,
    lastResult:   _lastResult,
  };
}

/**
 * resetSchedulerState()
 *
 * Clears persisted state — next sync will fetch from the beginning (or fromDate
 * if provided in options). Useful after a schema change or manual data fix.
 */
export function resetErpToTallySchedulerState() {
  _lastSyncTime = null;
  _syncCount    = 0;
  _lastResult   = null;
  _saveState();
  logger.info("[Scheduler] State reset — next sync will start fresh");
}
