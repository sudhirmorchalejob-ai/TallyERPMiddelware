const __importMetaUrl = require('url').pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// config/config.js
var import_dotenv, config;
var init_config = __esm({
  "config/config.js"() {
    import_dotenv = __toESM(require("dotenv"), 1);
    import_dotenv.default.config();
    config = {
      port: parseInt(process.env.PORT) || 5e3,
      tally: {
        url: process.env.TALLY_URL || "http://localhost:9000",
        companyName: process.env.TALLY_COMPANY_NAME || "",
        timeoutMs: 6e5
      },
      erpnext: {
        url: process.env.ERPNEXT_URL || "",
        // e.g. https://mysite.frappe.cloud
        apiKey: process.env.ERPNEXT_API_KEY || "",
        // from ERPNext → Settings → API Access
        apiSecret: process.env.ERPNEXT_API_SECRET || ""
      }
    };
  }
});

// logs/logger.js
function ensureDir() {
  if (!import_fs.default.existsSync(LOG_DIR)) {
    import_fs.default.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function formatTs() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function write(level, message, meta) {
  ensureDir();
  const line = {
    ts: formatTs(),
    level,
    message,
    ...meta ? { meta } : {}
  };
  import_fs.default.appendFileSync(LOG_FILE, `${JSON.stringify(line)}
`, "utf8");
}
function safeString(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
var import_fs, import_path, import_os, LOG_DIR, LOG_FILE, _lastSeenCompany, base, logger;
var init_logger = __esm({
  "logs/logger.js"() {
    import_fs = __toESM(require("fs"), 1);
    import_path = __toESM(require("path"), 1);
    import_os = __toESM(require("os"), 1);
    LOG_DIR = import_path.default.join(import_os.default.homedir(), "AppData", "Roaming", "TallyERPNextIntegration", "logs");
    LOG_FILE = import_path.default.join(LOG_DIR, "middleware.log");
    _lastSeenCompany = null;
    base = {
      info(message, meta) {
        write("info", safeString(message), meta);
      },
      warn(message, meta) {
        write("warn", safeString(message), meta);
      },
      error(message, meta) {
        write("error", safeString(message), meta);
      },
      success(message, meta) {
        write("success", safeString(message), meta);
      },
      debug(message, meta) {
        write("debug", safeString(message), meta);
      },
      resetLastSeenCompany(company) {
        _lastSeenCompany = company || null;
      },
      getLastSeenCompany() {
        return _lastSeenCompany;
      },
      getLogs({ company = null, fromDate = null, toDate = null, level = null, limit = 200 } = {}) {
        try {
          if (!import_fs.default.existsSync(LOG_FILE)) return [];
          const lines = import_fs.default.readFileSync(LOG_FILE, "utf8").trim().split("\n");
          const logs = [];
          for (let i = lines.length - 1; i >= 0; i--) {
            if (!lines[i]) continue;
            try {
              const log = JSON.parse(lines[i]);
              if (company && log.meta?.company !== company && log.message.indexOf(company) === -1) continue;
              if (level && log.level !== level) continue;
              if (fromDate || toDate) {
                const logDate = log.ts.split("T")[0];
                if (fromDate && logDate < fromDate) continue;
                if (toDate && logDate > toDate) continue;
              }
              logs.push(log);
              if (logs.length >= limit) break;
            } catch (e) {
            }
          }
          return logs;
        } catch (e) {
          return [];
        }
      },
      listCompanies() {
        try {
          if (!import_fs.default.existsSync(LOG_FILE)) return [];
          const lines = import_fs.default.readFileSync(LOG_FILE, "utf8").trim().split("\n");
          const companies = /* @__PURE__ */ new Set();
          for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5e3); i--) {
            if (!lines[i]) continue;
            try {
              const log = JSON.parse(lines[i]);
              if (log.meta && log.meta.company) {
                companies.add(log.meta.company);
              }
            } catch (e) {
            }
          }
          return Array.from(companies);
        } catch (e) {
          return [];
        }
      },
      human: {
        headsUp(msg) {
          console.log(`
[HEADS-UP] ${msg}`);
        },
        step(msg) {
          console.log(`[STEP] ${msg}`);
        },
        syncStarted(company, url) {
          console.log(`[SYNC START] ${company} -> ${url}`);
        },
        autoSyncTriggered(company, interval, runNum) {
          console.log(`[AUTO-SYNC #${runNum}] ${company} (${interval})`);
        },
        autoSyncEnabled(interval, what) {
          console.log(`[AUTO-SYNC] Enabled (${interval}) ${what}`);
        },
        autoSyncDisabled() {
          console.log("[AUTO-SYNC] Disabled");
        },
        syncStepStarting(name) {
          console.log(`[SYNC] ${name}`);
        },
        masterSyncResult(label, changed, unchecked) {
          console.log(`[SYNC] ${label}: changed=${changed}, unchanged=${unchecked}`);
        },
        syncStepSkipped(label, count) {
          console.log(`[SYNC] ${label} skipped (${count})`);
        },
        stateSaved(company) {
          console.log(`[SYNC] State saved for ${company}`);
        },
        stepDone(label) {
          console.log(`[SYNC] ${label} done`);
        },
        syncDone(company, summary) {
          console.log(`[SYNC DONE] ${company}: ${summary}`);
        },
        autoSyncRunSummary(company, summary) {
          console.log(`[AUTO-SYNC SUMMARY] ${company}: ${summary}`);
        },
        syncFailed(company, reason) {
          console.log(`[SYNC FAILED] ${company}: ${reason}`);
        },
        autoSyncNextScheduled(nextRun) {
          console.log(`[AUTO-SYNC] Next run: ${nextRun}`);
        },
        autoSyncScheduled(intervalLabel) {
          console.log(`[AUTO-SYNC] Scheduled every ${intervalLabel}`);
        },
        serverReady(url, info) {
          console.log(`[SERVER] Ready at ${url}`);
        },
        tallyConnected(url) {
          console.log(`[TALLY] Connected to ${url}`);
        },
        checkReady() {
          console.log("[CHECK] Ready");
        },
        autoSyncTriggeredFor() {
          console.log("[AUTO-SYNC] Triggered");
        }
      }
    };
    logger = base;
  }
});

// syncChunkState.js
function ensureDir2() {
  if (!import_fs2.default.existsSync(STATE_DIR)) import_fs2.default.mkdirSync(STATE_DIR, { recursive: true });
}
function loadChunkState() {
  ensureDir2();
  if (!import_fs2.default.existsSync(CHUNK_FILE)) return {};
  try {
    const raw = import_fs2.default.readFileSync(CHUNK_FILE, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (err) {
    logger.warn("syncChunkState: could not parse chunk_progress.dat \u2014 starting fresh (" + err.message + ")");
    try {
      import_fs2.default.copyFileSync(CHUNK_FILE, CHUNK_FILE + ".corrupt." + Date.now());
    } catch (_) {
    }
    return {};
  }
}
function saveChunkState(state) {
  ensureDir2();
  const tmp = CHUNK_FILE + ".tmp";
  import_fs2.default.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  import_fs2.default.renameSync(tmp, CHUNK_FILE);
}
function stateKey(company, erpnextUrl) {
  const url = (erpnextUrl || "default").replace(/\/+$/, "").toLowerCase();
  return `${company}::${url}`;
}
function getTenantState(company, erpnextUrl) {
  const all = loadChunkState();
  const key = stateKey(company, erpnextUrl);
  return all[key] || {
    fullSyncComplete: false,
    startedAt: null,
    vouchers: {},
    ledgers: {}
  };
}
function saveTenantState(company, erpnextUrl, tenantState) {
  const all = loadChunkState();
  const key = stateKey(company, erpnextUrl);
  all[key] = tenantState;
  saveChunkState(all);
}
function isFullSyncComplete(company, erpnextUrl) {
  return getTenantState(company, erpnextUrl).fullSyncComplete === true;
}
function markFullSyncComplete(company, erpnextUrl) {
  const state = getTenantState(company, erpnextUrl);
  state.fullSyncComplete = true;
  state.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveTenantState(company, erpnextUrl, state);
  logger.info(`syncChunkState: full sync marked complete for "${stateKey(company, erpnextUrl)}"`);
}
function isChunkDone(company, erpnextUrl, dataType, chunkId) {
  const state = getTenantState(company, erpnextUrl);
  return !!state[dataType]?.[chunkId]?.doneAt;
}
function markChunkDone(company, erpnextUrl, dataType, chunkId, meta = {}) {
  const state = getTenantState(company, erpnextUrl);
  if (!state[dataType]) state[dataType] = {};
  if (!state.startedAt) state.startedAt = (/* @__PURE__ */ new Date()).toISOString();
  state[dataType][chunkId] = {
    ...meta,
    doneAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveTenantState(company, erpnextUrl, state);
  logger.info(
    `syncChunkState: chunk done \u2014 ${stateKey(company, erpnextUrl)} / ${dataType} / ${chunkId}`,
    meta
  );
}
function getChunkProgress(company, erpnextUrl) {
  const state = getTenantState(company, erpnextUrl);
  const vDone = Object.keys(state.vouchers || {}).length;
  const lDone = Object.keys(state.ledgers || {}).length;
  return {
    fullSyncComplete: state.fullSyncComplete || false,
    startedAt: state.startedAt || null,
    completedAt: state.completedAt || null,
    vouchers: {
      chunksCompleted: vDone,
      chunks: state.vouchers || {}
    },
    ledgers: {
      chunksCompleted: lDone,
      chunks: state.ledgers || {}
    }
  };
}
function resetChunkProgress(company, erpnextUrl) {
  const all = loadChunkState();
  const key = stateKey(company, erpnextUrl);
  delete all[key];
  saveChunkState(all);
  logger.info(`syncChunkState: reset chunk progress for "${key}" \u2014 next sync will be full`);
}
function listAllTenants() {
  const all = loadChunkState();
  return Object.keys(all).map((key) => {
    const [company, url] = key.split("::");
    return {
      key,
      company,
      erpnextUrl: url,
      fullSyncComplete: all[key].fullSyncComplete || false,
      startedAt: all[key].startedAt || null,
      completedAt: all[key].completedAt || null
    };
  });
}
var import_fs2, import_path2, import_os2, STATE_DIR, CHUNK_FILE;
var init_syncChunkState = __esm({
  "syncChunkState.js"() {
    import_fs2 = __toESM(require("fs"), 1);
    import_path2 = __toESM(require("path"), 1);
    import_os2 = __toESM(require("os"), 1);
    init_logger();
    STATE_DIR = import_path2.default.join(
      import_os2.default.homedir(),
      "AppData",
      "Roaming",
      "TallyERPNextIntegration",
      "data"
    );
    CHUNK_FILE = import_path2.default.join(STATE_DIR, "chunk_progress.dat");
  }
});

// tally/tallyClient.js
var tallyClient_exports = {};
__export(tallyClient_exports, {
  createJournalVoucher: () => createJournalVoucher,
  createPaymentVoucher: () => createPaymentVoucher,
  createPurchaseVoucher: () => createPurchaseVoucher,
  createSalesVoucher: () => createSalesVoucher,
  fetchTallyBudgets: () => fetchTallyBudgets,
  fetchTallyCompanies: () => fetchTallyCompanies,
  fetchTallyCostCategories: () => fetchTallyCostCategories,
  fetchTallyCostCentres: () => fetchTallyCostCentres,
  fetchTallyCurrencies: () => fetchTallyCurrencies,
  fetchTallyGodowns: () => fetchTallyGodowns,
  fetchTallyGroups: () => fetchTallyGroups,
  fetchTallyLedgers: () => fetchTallyLedgers,
  fetchTallyLedgersChunked: () => fetchTallyLedgersChunked,
  fetchTallyStockCategories: () => fetchTallyStockCategories,
  fetchTallyStockGroups: () => fetchTallyStockGroups,
  fetchTallyStockItems: () => fetchTallyStockItems,
  fetchTallyUnits: () => fetchTallyUnits,
  fetchTallyVoucherTypes: () => fetchTallyVoucherTypes,
  fetchTallyVouchers: () => fetchTallyVouchers,
  fetchTallyVouchersChunked: () => fetchTallyVouchersChunked,
  pingTally: () => pingTally,
  runMiddlewareCheck: () => runMiddlewareCheck
});
function escapeXml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function val(v) {
  if (v === void 0 || v === null) return null;
  if (Array.isArray(v)) return val(v[0]);
  if (typeof v === "object" && v._) return cleanVal(v._);
  if (typeof v === "string" || typeof v === "number") return cleanVal(String(v));
  return null;
}
function cleanVal(s) {
  if (!s) return s;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 31 || c === 127 || c === 8203 || c === 8204 || c === 8205 || c === 65279) continue;
    out += s[i];
  }
  return out.trim();
}
function extractAddress(addr) {
  if (!addr) return null;
  if (Array.isArray(addr)) {
    const parts = addr.map((a) => extractAddress(a)).filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  if (typeof addr === "object") {
    if (addr.ADDRESS) return extractAddress(addr.ADDRESS);
    if (addr["ADDRESS.LIST"]) return extractAddress(addr["ADDRESS.LIST"]);
    if (addr._) return String(addr._).trim();
    const vals = Object.values(addr).map((v) => typeof v === "string" ? v.trim() : v?._ ? String(v._).trim() : null).filter(Boolean);
    if (vals.length) return vals.join(", ");
    return null;
  }
  const str = String(addr).trim();
  return str && str !== "[object Object]" ? str : null;
}
function extractPhone(blob) {
  if (!blob) return null;
  const m = String(blob).match(/\b[6-9]\d{9}\b/g);
  return m ? m[0] : null;
}
function extractEmail(blob) {
  if (!blob) return null;
  const m = String(blob).match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  return m ? m[0] : null;
}
function parseTallyAmount(raw) {
  if (!raw) return 0;
  const str = String(raw).replace(/[, ]/g, "");
  const n = parseFloat(str);
  return isNaN(n) ? 0 : Math.abs(n);
}
function parseTallyQty(raw) {
  if (!raw) return 1;
  const n = parseFloat(String(raw));
  return isNaN(n) || n === 0 ? 1 : Math.abs(n);
}
function parseTallyRate(raw) {
  if (!raw) return 0;
  const n = parseFloat(String(raw));
  return isNaN(n) ? 0 : Math.abs(n);
}
function parseTallyAmountSigned(raw) {
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && raw._) {
    const str2 = String(raw._).replace(/[, ]/g, "");
    const n2 = parseFloat(str2);
    if (isNaN(n2) || n2 === 0) return 0;
    const attrs = raw.$ || {};
    const type = (attrs.TYPE || attrs.type || "").trim().toLowerCase();
    const isDr = type === "dr" || type === "debit" || (attrs.ISDEEMEDPOSITIVE || "").toLowerCase() === "no";
    if (type || attrs.ISDEEMEDPOSITIVE) {
      return isDr ? -Math.abs(n2) : Math.abs(n2);
    }
    return n2;
  }
  const str = String(raw).replace(/[, ]/g, "");
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}
function tallyDateToISO(raw) {
  if (!raw || String(raw).length < 8) return null;
  const s = String(raw).replace(/-/g, "");
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
function buildCollectionXml(collectionName, type, fetch, companyName, extra = "") {
  const companyTag = companyName ? `<SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>` : "";
  return `
<ENVELOPE>
 <HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export Data</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>${collectionName}</ID>
 </HEADER>
 <BODY>
  <DESC>
   <STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    ${companyTag}
    ${extra}
   </STATICVARIABLES>
   <TDL>
    <TDLMESSAGE>
     <COLLECTION NAME="${collectionName}">
      <TYPE>${type}</TYPE>
      <FETCH>${fetch}</FETCH>
     </COLLECTION>
    </TDLMESSAGE>
   </TDL>
  </DESC>
 </BODY>
</ENVELOPE>`;
}
async function postXml(xml) {
  const res = await tallyAxios.post("", xml);
  return res.data;
}
async function parseXml(raw, explicitArray = true) {
  return (0, import_xml2js.parseStringPromise)(raw, { explicitArray });
}
async function pingTally() {
  const xml = buildCollectionXml("Company Collection", "Company", "NAME");
  const start = Date.now();
  try {
    const raw = await postXml(xml);
    const latencyMs = Date.now() - start;
    if (!raw || typeof raw !== "string") throw new Error("Empty response from Tally");
    return { connected: true, latencyMs, url: config.tally.url };
  } catch (err) {
    return {
      connected: false,
      error: err.code === "ECONNREFUSED" ? `Tally not running on ${config.tally.url}. Open TallyPrime \u2192 Gateway of Tally \u2192 Enable Tally.NET \u2192 HTTP Port 9000.` : err.message,
      url: config.tally.url
    };
  }
}
async function fetchTallyCompanies() {
  logger.info("Fetching companies from Tally");
  const xml = buildCollectionXml(
    "Company Collection",
    "Company",
    "NAME,GUID,STARTINGFROM,BOOKSBEGINNINGFROM,COUNTRYNAME,STATENAME,GSTIN,INCOMETAXNUMBER"
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, true);
  const companies = parsed?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION?.[0]?.COMPANY || [];
  return companies.map((c) => ({
    guid: val(c.GUID),
    name: val(c.NAME),
    startingFrom: tallyDateToISO(val(c.STARTINGFROM)),
    booksFrom: tallyDateToISO(val(c.BOOKSBEGINNINGFROM)),
    country: val(c.COUNTRYNAME),
    state: val(c.STATENAME),
    gstin: val(c.GSTIN),
    pan: val(c.INCOMETAXNUMBER)
  })).filter((c) => c.name);
}
async function fetchTallyGroups(companyName) {
  logger.info("Fetching groups from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "GroupCollection",
    "Group",
    "NAME,GUID,PARENT,ALTERID,ISREVENUE,ISBILLWISEON,AFFECTSSTOCK,ISSUBLEDGER,BASICGROUPISCALCULABLE",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawGroups = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.GROUP || [];
  const arr = Array.isArray(rawGroups) ? rawGroups : [rawGroups];
  const groups = arr.map((g) => {
    const name = g.$?.NAME || val(g.NAME) || null;
    if (!name) return null;
    return {
      guid: val(g.GUID),
      name,
      alterId: val(g.ALTERID) || null,
      parent: val(g.PARENT) || "Primary",
      isRevenue: val(g.ISREVENUE) === "Yes",
      isBillwise: val(g.ISBILLWISEON) === "Yes",
      affectsStock: val(g.AFFECTSSTOCK) === "Yes",
      isSubledger: val(g.ISSUBLEDGER) === "Yes"
    };
  }).filter(Boolean);
  logger.success(`Fetched ${groups.length} groups`, { company: companyName });
  return groups;
}
async function fetchTallyLedgers(companyName) {
  logger.info("Fetching ledgers from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "Ledger Collection",
    "Ledger",
    "NAME,GUID,PARENT,ALTERID,ADDRESS,ADDRESS.LIST,ADDRESS.LIST.STATENAME,ADDRESS.LIST.PINCODE,MAILINGNAME,MAILINGDETAILS.LIST,MAILINGDETAILS.LIST.STATENAME,MAILINGDETAILS.LIST.PINCODE,MAILINGDETAILS.LIST.COUNTRYNAME,STATE,STATENAME,OPENINGBALANCE,CLOSINGBALANCE,ISBILLWISEON,LEDGERPHONE,LEDGERMOBILE,EMAIL,INCOMETAXNUMBER,PARTYGSTIN,LEDGSTREGDETAILS.LIST,COUNTRYNAME,PINCODE,BANKDETAILS,BANKDETAILS.LIST,IFSCODE,SWIFTCODE,BANKINGCONFIGBANK,BANKACCHOLDERNAME,BRANCHNAME,BANKBSRCODE,MSMEREGISTRATIONDETAILS.LIST.MSMEENTERPRISETYPE,MSMEREGISTRATIONDETAILS.LIST.UDYAMREGISTRATIONNUMBER,MSMEREGISTRATIONDETAILS.LIST.MSMEACTIVITYTYPE,CREDITLIMIT,ISCREDITCHECK,CREDITDAYS,ISOVERRIDECREDITLIMIT,LANGUAGENAME.LIST,LANGUAGENAME.LIST.LANGUAGEALIASLABEL,UPIID,ACCOUNTNUMBER,BANKNAME,TRANSACTIONTYPE",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawLedgers = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER || [];
  const ledgersArr = Array.isArray(rawLedgers) ? rawLedgers : [rawLedgers];
  const ledgers = [];
  for (const l of ledgersArr) {
    const name = l.$?.NAME || val(l.NAME) || null;
    const guid = val(l.GUID) || null;
    if (!name || !guid) continue;
    const rawPhone = val(l.LEDGERMOBILE) || val(l.LEDGERPHONE) || null;
    const rawEmail = val(l.EMAIL) || null;
    const KNOWN_LEDGER_KEYS = /* @__PURE__ */ new Set([
      "$",
      "GUID",
      "NAME",
      "PARENT",
      "ALTERID",
      "ADDRESS",
      "MAILINGNAME",
      "MAILINGDETAILS.LIST",
      "MAILINGDETAILS",
      "OPENINGBALANCE",
      "CLOSINGBALANCE",
      "ISBILLWISEON",
      "LEDGERPHONE",
      "LEDGERMOBILE",
      "EMAIL",
      "INCOMETAXNUMBER",
      "GSTIN.LIST",
      "PARTYGSTIN",
      "LEDGSTREGDETAILS.LIST",
      "COUNTRYNAME",
      "STATENAME",
      "PINCODE",
      "BANKDETAILS",
      "IFSCODE",
      "SWIFTCODE",
      "BANKINGCONFIGBANK",
      "BANKACCHOLDERNAME",
      "BRANCHNAME",
      "BANKBSRCODE",
      "MSMEREGISTRATIONDETAILS.LIST",
      "MSMEREGISTRATIONDETAILS.LIST.ENTERPRISETYPE",
      "MSMEREGISTRATIONDETAILS.LIST.UDYAMREGNUMBER",
      "MSMEREGISTRATIONDETAILS.LIST.MSMEACTIVITYTYPE",
      "CREDITLIMIT",
      "CREDITPERIOD",
      "ISCREDITCHECK",
      "ISOVERRIDECREDITLIMIT",
      "ALIAS",
      "LANGUAGEINFOLIST.LIST",
      "LANGUAGEINFOLIST.LIST.LANGUAGEALIASLABEL",
      "ADDRESS.LIST",
      "LANGUAGENAME.LIST",
      "BANKDETAILS.LIST"
    ]);
    const customFields = {};
    for (const key of Object.keys(l)) {
      if (!KNOWN_LEDGER_KEYS.has(key)) {
        const v2 = val(l[key]);
        if (v2 !== null && v2 !== void 0 && v2 !== "") {
          customFields[key] = v2;
        }
      }
    }
    let placeOfSupply = (() => {
      const reg = l["LEDGSTREGDETAILS.LIST"];
      if (!reg) return null;
      const arr = Array.isArray(reg) ? reg : [reg];
      for (const item of arr) {
        if (!item) continue;
        const v = val(item.PLACEOFSUPPLY);
        if (v && v.trim()) return v.trim();
      }
      return null;
    })();
    let addr = extractAddress(l.ADDRESS);
    let state = val(l.STATENAME) || val(l.STATE) || null;
    let country = val(l.COUNTRYNAME) || val(l.COUNTRYOFRESIDENCE) || null;
    let pincode = val(l.PINCODE) || null;
    if (!state && placeOfSupply) {
      state = placeOfSupply;
    }
    if (l["ADDRESS.LIST"]) {
      if (!addr) addr = extractAddress(l["ADDRESS.LIST"]);
      const aList = Array.isArray(l["ADDRESS.LIST"]) ? l["ADDRESS.LIST"] : [l["ADDRESS.LIST"]];
      for (const a of aList) {
        if (!a) continue;
        if (!state && a.STATENAME) state = val(a.STATENAME);
        if (!country && a.COUNTRYNAME) country = val(a.COUNTRYNAME);
        if (!pincode && a.PINCODE) pincode = val(a.PINCODE);
      }
    }
    const mListRaw = l["MAILINGDETAILS.LIST"];
    if (mListRaw) {
      const mList = Array.isArray(mListRaw) ? mListRaw : [mListRaw];
      for (const m of mList) {
        if (!m) continue;
        if (!addr && m.ADDRESS) addr = extractAddress(m.ADDRESS);
        if (!addr && m["ADDRESS.LIST"]) addr = extractAddress(m["ADDRESS.LIST"]);
        if (!state && m.STATENAME) state = val(m.STATENAME);
        if (!country && m.COUNTRYNAME) country = val(m.COUNTRYNAME);
        if (!pincode && m.PINCODE) pincode = val(m.PINCODE);
      }
    }
    ledgers.push({
      address: addr,
      state,
      country,
      pincode,
      placeOfSupply,
      guid,
      name,
      alterId: val(l.ALTERID) || null,
      parentGroup: val(l.PARENT) || "Sundry Debtors",
      openingBalance: parseTallyAmountSigned(l.OPENINGBALANCE?._ || l.OPENINGBALANCE),
      closingBalance: parseTallyAmountSigned(l.CLOSINGBALANCE?._ || l.CLOSINGBALANCE),
      type: val(l.ISBILLWISEON) === "Yes" ? "Party" : "General",
      phone: extractPhone(rawPhone),
      email: extractEmail(rawEmail),
      pan: val(l.INCOMETAXNUMBER) || null,
      gstin: (() => {
        const direct = val(l.PARTYGSTIN);
        if (direct && direct.trim().length > 5) return direct.trim();
        const reg = l["LEDGSTREGDETAILS.LIST"];
        if (reg) {
          const regArr = Array.isArray(reg) ? reg : [reg];
          for (const item of regArr) {
            if (!item) continue;
            const list = item.LIST;
            if (list) {
              const listArr = Array.isArray(list) ? list : [list];
              for (const li of listArr) {
                const v2 = val(li?.GSTIN) || val(li?.GSTREGISTRATIONNUMBER) || null;
                if (v2 && v2.trim().length > 5) return v2.trim();
              }
            }
            const v = val(item.GSTIN) || val(item.GSTREGISTRATIONNUMBER) || null;
            if (v && v.trim().length > 5) return v.trim();
          }
        }
        const g = l["GSTIN.LIST"];
        if (g) {
          const arr = Array.isArray(g) ? g : [g];
          for (const item of arr) {
            if (!item) continue;
            if (typeof item === "string" && item.trim().length > 5) return item.trim();
            const list = item.LIST;
            if (list) {
              const listArr = Array.isArray(list) ? list : [list];
              for (const li of listArr) {
                const v2 = val(li?.GSTIN) || val(li?._) || null;
                if (v2 && v2.trim().length > 5) return v2.trim();
              }
            }
            const v = val(item.GSTIN) || val(item._) || null;
            if (v && v.trim().length > 5) return v.trim();
          }
        }
        return null;
      })(),
      registrationType: (() => {
        const reg = l["LEDGSTREGDETAILS.LIST"];
        if (!reg) return null;
        const arr = Array.isArray(reg) ? reg : [reg];
        for (const item of arr) {
          if (!item) continue;
          const v = val(item.GSTREGISTRATIONTYPE) || val(item.REGISTRATIONTYPE);
          if (v && v.trim()) {
            return v.trim();
          }
        }
        return null;
      })(),
      isTransporter: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return "Undefined";
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const v = val(item.ISTRANSPORTER);
          if (v && v.trim()) {
            return v.trim();
          }
        }
        return "Undefined";
      })(),
      transporterId: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return "Undefined";
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const v = val(item.TRANSPORTERID);
          if (v && v.trim()) {
            return v.trim();
          }
        }
        return "Undefined";
      })(),
      bankTransactionType: (() => {
        const b = l["BANKDETAILS.LIST"] || l.BANKDETAILS || {};
        return val(b.TRANSACTIONTYPE) || null;
      })(),
      bankDetailsRaw: (() => {
        return l["BANKDETAILS.LIST"] || null;
      })(),
      upiId: (() => {
        const b = l["BANKDETAILS.LIST"] || l.BANKDETAILS || {};
        return val(b.UPIID) || null;
      })(),
      popupBankAccountNo: (() => {
        const b = l["BANKDETAILS.LIST"] || l.BANKDETAILS || {};
        return val(b.ACCOUNTNUMBER) || val(b.ACNO) || null;
      })(),
      popupIfscCode: (() => {
        const b = l["BANKDETAILS.LIST"] || l.BANKDETAILS || {};
        return val(b.IFSCODE) || null;
      })(),
      popupBankName: (() => {
        const b = l["BANKDETAILS.LIST"] || l.BANKDETAILS || {};
        return val(b.BANKNAME) || null;
      })(),
      bankAccount: val(l.BANKDETAILS) || null,
      // Tally XML: BANKDETAILS (was BANKACCNO)
      ifsc: val(l.IFSCODE) || null,
      // Tally XML: IFSCODE ✓
      swiftCode: val(l.SWIFTCODE) || null,
      // Tally XML: SWIFTCODE ✓
      bankName: val(l.BANKINGCONFIGBANK) || null,
      // Tally XML: BANKINGCONFIGBANK (was BANKNAME)
      holderName: val(l.BANKACCHOLDERNAME) || null,
      // Tally XML: BANKACCHOLDERNAME (was ACHOLDERNAM)
      bankBranch: val(l.BRANCHNAME) || null,
      // Tally XML: BRANCHNAME (was BANKBRANCH)
      bsrCode: val(l.BANKBSRCODE) || null,
      // Tally XML: BANKBSRCODE (was BSRCODE)
      msmeType: (() => {
        const m = l["MSMEREGISTRATIONDETAILS.LIST"];
        if (!m) return null;
        const arr = Array.isArray(m) ? m : [m];
        for (const item of arr) {
          if (!item) continue;
          const v = val(item.ENTERPRISETYPE);
          if (v && v.trim().toLowerCase() !== "not applicable") return v.trim();
        }
        return null;
      })(),
      udyamNo: (() => {
        const m = l["MSMEREGISTRATIONDETAILS.LIST"];
        if (!m) return null;
        const arr = Array.isArray(m) ? m : [m];
        for (const item of arr) {
          if (!item) continue;
          const v = val(item.UDYAMREGNUMBER);
          if (v && v.trim()) return v.trim();
        }
        return null;
      })(),
      msmeActivity: (() => {
        const m = l["MSMEREGISTRATIONDETAILS.LIST"];
        if (!m) return null;
        const arr = Array.isArray(m) ? m : [m];
        for (const item of arr) {
          if (!item) continue;
          const v = val(item.MSMEACTIVITYTYPE);
          if (v && v.trim().toLowerCase() !== "not applicable") return v.trim();
        }
        return null;
      })(),
      creditLimit: parseTallyAmount(l.CREDITLIMIT?._ || l.CREDITLIMIT) || 0,
      creditDays: val(l.DEFAULTCREDITPERIOD) || val(l.CREDITPERIOD) || val(l.CREDITDAYS) || "",
      isCreditCheck: String(
        val(l.CHECKFORCREDITDAYS) || val(l.ISCREDITCHECK) || "No"
      ).trim(),
      isOverrideCreditLimit: String(
        val(l.OVERRIDECREDITLIMIT) || val(l.ISOVERRIDECREDITLIMIT) || "No"
      ).trim(),
      hsnCode: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return null;
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const code = val(item.HSNCODE) || val(item.GSTHSNNAME) || val(item.SACCODE);
          if (code && code.trim()) {
            return code.trim();
          }
        }
        return null;
      })(),
      gstRate: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return null;
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const rate = val(item.GSTRATE) || val(item.GSTREGRATE);
          if (rate) {
            const parsed2 = parseFloat(
              String(rate).replace(/[^0-9.]/g, "")
            );
            if (!isNaN(parsed2)) {
              return parsed2;
            }
          }
        }
        return null;
      })(),
      taxability: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return null;
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const tax = val(item.TAXABILITY);
          if (tax && tax.trim()) {
            return tax.trim();
          }
        }
        return null;
      })(),
      ////////////////////
      gstRegistrationType: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return null;
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const reg = val(item.GSTREGISTRATIONTYPE) || val(item.REGISTRATIONTYPE);
          if (reg && reg.trim()) {
            return reg.trim();
          }
        }
        return null;
      })(),
      /////////////
      placeOfSupply: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return null;
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const place = val(item.PLACEOFSUPPLY) || val(item.PPLACEOFSUPPLY);
          if (place && place.trim()) {
            return place.trim();
          }
        }
        return null;
      })(),
      ////////////
      typeOfSupply: (() => {
        const gst = l["LEDGSTREGDETAILS.LIST"];
        if (!gst) return null;
        const arr = Array.isArray(gst) ? gst : [gst];
        for (const item of arr) {
          if (!item) continue;
          const supply = val(item.GSTTYPEOFSUPPLY) || val(item.TYPEOFSUPPLY);
          if (supply && supply.trim()) {
            return supply.trim();
          }
        }
        return null;
      })(),
      alias: (() => {
        const langList = l["LANGUAGENAME.LIST"];
        if (!langList) return null;
        const nameList = langList["NAME.LIST"];
        if (!nameList) return null;
        const nameField = nameList.NAME;
        if (Array.isArray(nameField) && nameField.length >= 2) {
          const a = nameField[1];
          if (a && String(a).trim()) return String(a).trim();
        }
        return null;
      })(),
      customFields: Object.keys(customFields).length > 0 ? customFields : void 0
    });
  }
  logger.success(`Fetched ${ledgers.length} ledgers`, { company: companyName });
  return ledgers;
}
async function fetchTallyVoucherTypes(companyName) {
  logger.info("Fetching voucher types from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "VoucherTypeCollection",
    "VoucherType",
    "NAME,GUID,PARENT,BASEVOUCHERTYPE,NUMBERINGMETHOD,ISOPTIONAL,ISACTIVE,COMMONNARRATION,AFFECTSSTOCK",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawVT = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHERTYPE || parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.["VOUCHER-TYPE"] || [];
  const arr = Array.isArray(rawVT) ? rawVT : [rawVT];
  const types = arr.map((v) => {
    const name = v.$?.NAME || val(v.NAME) || null;
    if (!name) return null;
    return {
      guid: val(v.GUID),
      name,
      parent: val(v.PARENT),
      baseType: val(v.BASEVOUCHERTYPE) || val(v.PARENT) || name,
      // base standard type
      numberingMethod: val(v.NUMBERINGMETHOD),
      isOptional: val(v.ISOPTIONAL) === "Yes",
      isActive: val(v.ISACTIVE) !== "No",
      commonNarration: val(v.COMMONNARRATION) === "Yes",
      affectsStock: val(v.AFFECTSSTOCK) === "Yes"
    };
  }).filter(Boolean);
  logger.success(`Fetched ${types.length} voucher types`, { company: companyName });
  return types;
}
async function fetchTallyCostCategories(companyName) {
  logger.info("Fetching cost categories from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "CostCategoryCollection",
    "Cost Category",
    "NAME,GUID,ALLOCATEREVENUE,ALLOCATENONREVENUE",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawCC = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.["COST-CATEGORY"] || parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.COSTCATEGORY || [];
  const arr = Array.isArray(rawCC) ? rawCC : [rawCC];
  const cats = arr.map((c) => {
    const name = c.$?.NAME || val(c.NAME) || null;
    if (!name) return null;
    return {
      guid: val(c.GUID),
      name,
      allocateRevenue: val(c.ALLOCATEREVENUE) === "Yes",
      allocateNonRevenue: val(c.ALLOCATENONREVENUE) === "Yes"
    };
  }).filter(Boolean);
  logger.success(`Fetched ${cats.length} cost categories`, { company: companyName });
  return cats;
}
async function fetchTallyCostCentres(companyName) {
  logger.info("Fetching cost centres from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "CostCentreCollection",
    "Cost Centre",
    "NAME,GUID,PARENT,ALTERID,CATEGORY",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawCentre = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.["COST-CENTRE"] || parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.COSTCENTRE || [];
  const arr = Array.isArray(rawCentre) ? rawCentre : [rawCentre];
  const centres = arr.map((c) => {
    const name = c.$?.NAME || val(c.NAME) || null;
    if (!name) return null;
    return {
      guid: val(c.GUID),
      name,
      parent: (val(c.PARENT) || "Primary").trim(),
      category: val(c.CATEGORY) || null,
      alterId: val(c.ALTERID) || null
    };
  }).filter(Boolean);
  logger.success(`Fetched ${centres.length} cost centres`, { company: companyName });
  return centres;
}
async function fetchTallyCurrencies(companyName) {
  logger.info("Fetching currencies from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "CurrencyCollection",
    "Currency",
    "NAME,GUID,MAILINGNAME,ISSUFFIX,INWORDSSUBUNITS,DECIMALPLACES,EXPANSSYMBOL",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawCur = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.CURRENCY || [];
  const arr = Array.isArray(rawCur) ? rawCur : [rawCur];
  const currencies = arr.map((c) => {
    const name = c.$?.NAME || val(c.NAME) || null;
    if (!name) return null;
    return {
      guid: val(c.GUID),
      name,
      mailingName: val(c.MAILINGNAME),
      symbol: val(c.EXPANSSYMBOL),
      isSuffix: val(c.ISSUFFIX) === "Yes",
      decimalPlaces: parseInt(val(c.DECIMALPLACES) || "2", 10),
      inWordsSubUnits: val(c.INWORDSSUBUNITS)
    };
  }).filter(Boolean);
  logger.success(`Fetched ${currencies.length} currencies`, { company: companyName });
  return currencies;
}
async function fetchTallyBudgets(companyName) {
  logger.info("Fetching budgets from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "BudgetCollection",
    "Budget",
    "NAME,GUID,PARENT,STARTDATE,ENDDATE",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawBudget = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.BUDGET || [];
  const arr = Array.isArray(rawBudget) ? rawBudget : [rawBudget];
  const budgets = arr.map((b) => {
    const name = b.$?.NAME || val(b.NAME) || null;
    if (!name) return null;
    return {
      guid: val(b.GUID),
      name,
      parent: val(b.PARENT) || "Primary",
      startDate: tallyDateToISO(val(b.STARTDATE)),
      endDate: tallyDateToISO(val(b.ENDDATE))
    };
  }).filter(Boolean);
  logger.success(`Fetched ${budgets.length} budgets`, { company: companyName });
  return budgets;
}
async function fetchTallyStockGroups(companyName) {
  logger.info("Fetching stock groups from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "StockGroupCollection",
    "Stock Group",
    "NAME,GUID,PARENT,ISADDABLE",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawSG = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.["STOCK-GROUP"] || parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.STOCKGROUP || [];
  const arr = Array.isArray(rawSG) ? rawSG : [rawSG];
  const groups = arr.map((g) => {
    const name = g.$?.NAME || val(g.NAME) || null;
    if (!name) return null;
    return {
      guid: val(g.GUID),
      name,
      parent: val(g.PARENT) || "Primary",
      isAddable: val(g.ISADDABLE) === "Yes"
    };
  }).filter(Boolean);
  logger.success(`Fetched ${groups.length} stock groups`, { company: companyName });
  return groups;
}
async function fetchTallyStockItems(companyName) {
  logger.info("Fetching stock items from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "StockItemCollection",
    "Stock Item",
    // FIX: Use HSNDETAILS.LIST.HSNCODE (nested list path) instead of flat HSNDETAILS.HSNCODE.
    // TallyPrime stores HSN data inside a HSNDETAILS.LIST sub-list; the flat key returns empty.
    // Also fetch GSTRATE, GSTTYPEOFSUPPLY, and TAXABILITY for complete GST info.
    "NAME,GUID,PARENT,ALTERID,CATEGORY,BASEUNITS,HSNDETAILS.LIST.HSNCODE,HSNDETAILS.LIST.GSTRATE,GSTAPPLICABLE,GSTTYPEOFSUPPLY,TAXABILITY,OPENINGBALANCE,CLOSINGBALANCE,OPENINGVALUE,CLOSINGVALUE",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawItems = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.["STOCK-ITEM"] || parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.STOCKITEM || [];
  const itemsArr = Array.isArray(rawItems) ? rawItems : [rawItems];
  function extractHsnDetails(s) {
    let hsnCode = null;
    let gstRate = null;
    const detailsList = s["HSNDETAILS.LIST"];
    if (detailsList) {
      const arr = Array.isArray(detailsList) ? detailsList : [detailsList];
      for (const entry of arr) {
        if (!hsnCode) {
          const code = val(entry.HSNCODE) || val(entry["HSNDETAILS.LIST.HSNCODE"]);
          if (code && code.trim()) hsnCode = code.trim();
        }
        if (gstRate === null) {
          const rate = val(entry.GSTRATE) || val(entry["HSNDETAILS.LIST.GSTRATE"]);
          if (rate !== null && rate !== void 0 && rate !== "") {
            const parsed2 = parseFloat(String(rate).replace(/[^0-9.]/g, ""));
            if (!isNaN(parsed2)) gstRate = parsed2;
          }
        }
        if (hsnCode && gstRate !== null) break;
      }
    }
    if (!hsnCode || gstRate === null) {
      const hsnDetails = s.HSNDETAILS;
      if (hsnDetails) {
        const arr = Array.isArray(hsnDetails) ? hsnDetails : [hsnDetails];
        for (const entry of arr) {
          const list = entry?.LIST || entry?.["HSNDETAILS.LIST"];
          if (list) {
            const listArr = Array.isArray(list) ? list : [list];
            for (const le of listArr) {
              if (!hsnCode) {
                const code = val(le.HSNCODE);
                if (code && code.trim()) hsnCode = code.trim();
              }
              if (gstRate === null) {
                const rate = val(le.GSTRATE);
                if (rate !== null && rate !== void 0 && rate !== "") {
                  const parsed2 = parseFloat(String(rate).replace(/[^0-9.]/g, ""));
                  if (!isNaN(parsed2)) gstRate = parsed2;
                }
              }
            }
          }
          if (!hsnCode) {
            const code = val(entry.HSNCODE);
            if (code && code.trim()) hsnCode = code.trim();
          }
          if (gstRate === null) {
            const rate = val(entry.GSTRATE);
            if (rate !== null && rate !== void 0 && rate !== "") {
              const parsed2 = parseFloat(String(rate).replace(/[^0-9.]/g, ""));
              if (!isNaN(parsed2)) gstRate = parsed2;
            }
          }
        }
      }
    }
    if (!hsnCode) {
      const flat = val(s["HSNDETAILS.HSNCODE"]) || val(s.HSNCODE);
      if (flat && flat.trim()) hsnCode = flat.trim();
    }
    if (gstRate === null) {
      const rate = val(s["HSNDETAILS.GSTRATE"]) || val(s.GSTRATE);
      if (rate !== null && rate !== void 0 && rate !== "") {
        const parsed2 = parseFloat(String(rate).replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed2)) gstRate = parsed2;
      }
    }
    return { hsnCode, gstRate };
  }
  const KNOWN_STOCK_KEYS = /* @__PURE__ */ new Set([
    "$",
    "GUID",
    "NAME",
    "PARENT",
    "ALTERID",
    "CATEGORY",
    "BASEUNITS",
    "HSNDETAILS.LIST",
    "HSNDETAILS",
    "HSNDETAILS.LIST.HSNCODE",
    "HSNDETAILS.LIST.GSTRATE",
    "GSTAPPLICABLE",
    "GSTTYPEOFSUPPLY",
    "TAXABILITY",
    "OPENINGBALANCE",
    "CLOSINGBALANCE",
    "OPENINGVALUE",
    "CLOSINGVALUE"
  ]);
  const items = itemsArr.map((s) => {
    const name = s.$?.NAME || val(s.NAME) || null;
    if (!name) return null;
    const { hsnCode, gstRate } = extractHsnDetails(s);
    const customFields = {};
    for (const key of Object.keys(s)) {
      if (!KNOWN_STOCK_KEYS.has(key)) {
        const v2 = val(s[key]);
        if (v2 !== null && v2 !== void 0 && v2 !== "") {
          customFields[key] = v2;
        }
      }
    }
    if (Object.keys(customFields).length > 0) {
      logger.human ? logger.human.headsUp(`Stock item "${name}" has ${Object.keys(customFields).length} extra field(s) from Tally: ${Object.keys(customFields).join(", ")}. These will be synced as custom fields in ERPNext.`) : logger.info(`Stock item "${name}" has extra Tally fields: ${Object.keys(customFields).join(", ")}`);
    }
    return {
      guid: val(s.GUID),
      name,
      alterId: val(s.ALTERID) || null,
      group: val(s.PARENT) || "Primary",
      category: val(s.CATEGORY) || null,
      baseUnit: val(s.BASEUNITS),
      hsnCode,
      gstRate,
      // numeric GST % from Tally (e.g. 18, 5, 28) — used for Item Tax Template
      gstApplicable: val(s.GSTAPPLICABLE),
      gstTypeOfSupply: val(s.GSTTYPEOFSUPPLY),
      taxability: val(s.TAXABILITY),
      // "Taxable" / "Non-GST" / "Exempt" / "Nil-Rated"
      openingQty: parseTallyAmount(s.OPENINGBALANCE?._ || s.OPENINGBALANCE),
      closingQty: parseTallyAmount(s.CLOSINGBALANCE?._ || s.CLOSINGBALANCE),
      openingValue: parseTallyAmount(s.OPENINGVALUE?._ || s.OPENINGVALUE),
      closingValue: parseTallyAmount(s.CLOSINGVALUE?._ || s.CLOSINGVALUE),
      customFields: Object.keys(customFields).length > 0 ? customFields : void 0
    };
  }).filter(Boolean);
  const withHsn = items.filter((i) => i.hsnCode).length;
  const withGstRate = items.filter((i) => i.gstRate !== null && i.gstRate !== void 0).length;
  logger.success(`Fetched ${items.length} stock items (${withHsn} with HSN/SAC, ${withGstRate} with GST rate)`, { company: companyName });
  return items;
}
async function fetchTallyStockCategories(companyName) {
  logger.info("Fetching stock categories from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "StockCategoryCollection",
    "Stock Category",
    "NAME,GUID,PARENT",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawSC = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.["STOCK-CATEGORY"] || parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.STOCKCATEGORY || [];
  const arr = Array.isArray(rawSC) ? rawSC : [rawSC];
  const cats = arr.map((c) => {
    const name = c.$?.NAME || val(c.NAME) || null;
    if (!name) return null;
    return {
      guid: val(c.GUID),
      name,
      parent: val(c.PARENT) || "Primary"
    };
  }).filter(Boolean);
  logger.success(`Fetched ${cats.length} stock categories`, { company: companyName });
  return cats;
}
async function fetchTallyUnits(companyName) {
  logger.info("Fetching units from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "UnitCollection",
    "Unit",
    "NAME,GUID,ISSIMPLEUNIT,BASEUNITS,ADDITIONALUNITS,CONVERSIONFACTOR,DECIMALPLACES",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawUnits = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.UNIT || [];
  const arr = Array.isArray(rawUnits) ? rawUnits : [rawUnits];
  const units = arr.map((u) => {
    const name = u.$?.NAME || val(u.NAME) || null;
    if (!name) return null;
    return {
      guid: val(u.GUID),
      name,
      isSimple: val(u.ISSIMPLEUNIT) !== "No",
      baseUnit: val(u.BASEUNITS) || null,
      additionalUnit: val(u.ADDITIONALUNITS) || null,
      conversionFactor: parseTallyAmount(u.CONVERSIONFACTOR),
      decimalPlaces: parseInt(val(u.DECIMALPLACES) || "0", 10)
    };
  }).filter(Boolean);
  logger.success(`Fetched ${units.length} units`, { company: companyName });
  return units;
}
async function fetchTallyGodowns(companyName) {
  logger.info("Fetching godowns from Tally", { company: companyName });
  const xml = buildCollectionXml(
    "GodownCollection",
    "Godown",
    "NAME,GUID,PARENT,ALTERID,ADDRESS,HASSPACE,ISINTERNAL,ISEXTERNAL",
    companyName
  );
  const raw = await postXml(xml);
  const parsed = await parseXml(raw, false);
  const rawGD = parsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.GODOWN || [];
  const arr = Array.isArray(rawGD) ? rawGD : [rawGD];
  const godowns = arr.map((g) => {
    const name = g.$?.NAME || val(g.NAME) || null;
    if (!name) return null;
    return {
      guid: val(g.GUID),
      name,
      parent: val(g.PARENT) || "Primary",
      address: extractAddress(g.ADDRESS) || null,
      hasSpace: val(g.HASSPACE) === "Yes",
      isInternal: val(g.ISINTERNAL) !== "No",
      alterId: val(g.ALTERID) || null
    };
  }).filter(Boolean);
  logger.success(`Fetched ${godowns.length} godowns`, { company: companyName });
  return godowns;
}
function tallyLock() {
  return new Promise((resolve) => {
    if (!_tallyBusy) {
      _tallyBusy = true;
      resolve();
    } else _tallyQueue.push(resolve);
  });
}
function tallyUnlock() {
  if (_tallyQueue.length > 0) {
    const next = _tallyQueue.shift();
    next();
  } else {
    _tallyBusy = false;
  }
}
async function fetchTallyVouchersChunk(companyName, fromDate, toDate) {
  const tallyFrom = fromDate ? String(fromDate).replace(/-/g, "") : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
  const tallyTo = toDate ? String(toDate).replace(/-/g, "") : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
  const xml = `
<ENVELOPE>
 <HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export Data</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>VoucherCollection</ID>
 </HEADER>
 <BODY>
  <DESC>
   <STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>
    <SVFROMDATE>${tallyFrom}</SVFROMDATE>
    <SVTODATE>${tallyTo}</SVTODATE>
   </STATICVARIABLES>
   <TDL>
    <TDLMESSAGE>
     <COLLECTION NAME="VoucherCollection" ISMODIFY="No">
      <TYPE>Voucher</TYPE>
      <FETCH>GUID,DATE,VOUCHERNUMBER,VOUCHERTYPENAME,PARTYLEDGERNAME,NARRATION,REFERENCE,ISINVOICE,ISOPTIONAL,ISPOSTDATED,ALLLEDGERENTRIES.LIST,ALLLEDGERENTRIES.LIST.COSTCENTREDETAILS.LIST,ALLINVENTORYENTRIES.LIST,ALLINVENTORYENTRIES.LIST.BATCHALLOCATIONS.LIST,INVENTORYENTRIES.LIST,BILLALLOCATIONS.LIST</FETCH>
     </COLLECTION>
    </TDLMESSAGE>
   </TDL>
  </DESC>
 </BODY>
</ENVELOPE>`;
  await tallyLock();
  let raw;
  try {
    raw = await postXml(xml);
  } finally {
    tallyUnlock();
  }
  const parsed = await parseXml(raw, false);
  const body = parsed?.ENVELOPE?.BODY;
  const rawVouchers = body?.DATA?.COLLECTION?.VOUCHER || body?.DATA?.TALLYMESSAGE?.VOUCHER || body?.DATA?.VOUCHER || body?.TALLYMESSAGE?.VOUCHER || [];
  const vArr = Array.isArray(rawVouchers) ? rawVouchers : rawVouchers ? [rawVouchers] : [];
  logger.info(`Raw vouchers received from Tally: ${vArr.length}`, { company: companyName });
  const vouchers = [];
  for (const v of vArr) {
    const guid = v.$?.GUID || val(v.GUID) || `${val(v.DATE)}-${val(v.VOUCHERNUMBER)}-${val(v.VOUCHERTYPENAME)}`;
    const allEntries = v["ALLLEDGERENTRIES.LIST"] || v["LEDGERENTRIES.LIST"] || [];
    const entryArr = Array.isArray(allEntries) ? allEntries : [allEntries];
    let netAmount = 0;
    const entries = [];
    for (const e of entryArr) {
      if (!e || typeof e !== "object") continue;
      const ledgerName = val(e.LEDGERNAME);
      const isDeemedPositive = val(e.ISDEEMEDPOSITIVE) === "Yes";
      const amount = parseTallyAmount(val(e.AMOUNT));
      if (isDeemedPositive) netAmount += amount;
      const ccDetails = e["COSTCENTREDETAILS.LIST"] || e["COSTCENTREDETAILS"] || [];
      const ccArr = Array.isArray(ccDetails) ? ccDetails : ccDetails ? [ccDetails] : [];
      const costCentre = val(ccArr[0]?.COSTCENTRENAME) || null;
      if (ledgerName) entries.push({
        ledger: ledgerName,
        amount,
        isDebit: isDeemedPositive,
        costCentre,
        // ← Tally cost centre name (null if not set)
        isDeemedPositive
        // ← raw flag kept for downstream logic
      });
    }
    const rawInvAll = v["ALLINVENTORYENTRIES.LIST"] || [];
    const rawInvSimp = v["INVENTORYENTRIES.LIST"] || [];
    const rawInvEntries = [
      ...Array.isArray(rawInvAll) ? rawInvAll : rawInvAll ? [rawInvAll] : [],
      ...Array.isArray(rawInvSimp) ? rawInvSimp : rawInvSimp ? [rawInvSimp] : []
    ];
    const inventoryItems = [];
    for (const ie of rawInvEntries) {
      if (!ie || typeof ie !== "object") continue;
      const itemName = val(ie.STOCKITEMNAME) || val(ie.NAME);
      if (!itemName) continue;
      const qty = parseTallyQty(val(ie.BILLEDQTY) || val(ie.ACTUALQTY));
      const rate = parseTallyRate(val(ie.RATE));
      const amount = parseTallyAmount(val(ie.AMOUNT));
      const finalRate = rate || (qty ? amount / qty : 0);
      const finalAmount = amount || rate * qty;
      const batchAllocs = ie["BATCHALLOCATIONS.LIST"] || ie["BATCHALLOCATIONS"] || [];
      const batchArr = Array.isArray(batchAllocs) ? batchAllocs : batchAllocs ? [batchAllocs] : [];
      const godownName = val(batchArr[0]?.GODOWNNAME) || val(ie.GODOWNNAME) || null;
      const batchName = val(batchArr[0]?.BATCHNAME) || val(ie.BATCHNAME) || null;
      inventoryItems.push({
        itemName,
        qty,
        rate: Math.abs(finalRate),
        amount: Math.abs(finalAmount),
        godownName,
        // ← Tally godown / warehouse name
        batchName
        // ← Tally batch / lot name
      });
    }
    const billAllocs = v["BILLALLOCATIONS.LIST"] || [];
    const billArr = Array.isArray(billAllocs) ? billAllocs : billAllocs ? [billAllocs] : [];
    const firstBill = billArr.find((b) => b && val(b.BILLDATE));
    const dueDate = firstBill ? tallyDateToISO(val(firstBill.BILLDATE)) : null;
    const billRefName = firstBill ? val(firstBill.NAME) || val(firstBill.BILLNAME) : null;
    const partyLedgerName = val(v.PARTYLEDGERNAME);
    const salesLedgerEntry = entries.find(
      (e) => e.ledger && e.ledger !== partyLedgerName
    );
    const salesLedgerName = salesLedgerEntry?.ledger || null;
    const salesCostCentre = salesLedgerEntry?.costCentre || null;
    const firstCostCentre = entries.find((e) => e.costCentre)?.costCentre || null;
    vouchers.push({
      guid: guid || `voucher-${vouchers.length}`,
      voucherDate: tallyDateToISO(val(v.DATE)),
      voucherType: val(v.VOUCHERTYPENAME) || val(v.VOUCHERTYPE),
      voucherNumber: val(v.VOUCHERNUMBER),
      referenceNo: val(v.REFERENCE) || billRefName,
      // bill ref name as fallback
      partyName: val(v.PARTYLEDGERNAME),
      narration: val(v.NARRATION),
      dueDate,
      // ← bill due date from Tally credit terms (null if not set)
      netAmount,
      entries,
      inventoryItems,
      // ← real item rows from Tally
      salesLedgerName,
      // ← Tally sales/purchase ledger name
      salesCostCentre,
      // ← cost centre on the sales ledger entry
      firstCostCentre,
      // ← first cost centre found on any entry
      lineItemCount: entries.length,
      isInvoice: val(v.ISINVOICE) === "Yes",
      isOptional: val(v.ISOPTIONAL) === "Yes",
      isPostDated: val(v.ISPOSTDATED) === "Yes"
    });
  }
  logger.info(`Vouchers parsed successfully: ${vouchers.length}`, { company: companyName });
  return vouchers;
}
async function fetchTallyVouchers(companyName, fromDate = null, toDate = null) {
  logger.info(`Fetching ALL vouchers from Tally`, { company: companyName, fromDate, toDate });
  const allVouchers = await fetchTallyVouchersChunk(companyName, fromDate, toDate);
  const seen = /* @__PURE__ */ new Set();
  const unique = allVouchers.filter((v) => {
    if (seen.has(v.guid)) return false;
    seen.add(v.guid);
    return true;
  });
  if (fromDate || toDate) {
    const filtered = unique.filter((v) => {
      if (!v.voucherDate) return true;
      const d = v.voucherDate.slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
    logger.success(`Fetched ${filtered.length} vouchers (filtered: ${fromDate} \u2192 ${toDate}) from ${unique.length} total`, { company: companyName });
    if (filtered.length === 0 && unique.length > 0) {
      const dates = unique.map((v) => v.voucherDate).filter(Boolean).sort();
      const earliest = dates[0] || "unknown";
      const latest = dates[dates.length - 1] || "unknown";
      logger.warn(
        `All ${unique.length} Tally vouchers are outside the requested window (${fromDate} \u2192 ${toDate}). Actual voucher dates in Tally: ${earliest} \u2192 ${latest}. If this is unexpected, reset the sync state so the next run uses the company start date as fromDate.`,
        { company: companyName }
      );
    }
    return filtered;
  }
  logger.success(`Fetched ${unique.length} total vouchers (all dates)`, { company: companyName });
  return unique;
}
async function runMiddlewareCheck(companyName, options = {}) {
  const result = {
    company: companyName,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "running",
    checks: {
      // ── Connection ──────────────────────────────────────────────────────────
      ping: { status: "pending" },
      companies: { status: "pending" },
      // ── Accounting Masters ──────────────────────────────────────────────────
      groups: { status: "pending" },
      ledgers: { status: "pending" },
      voucherTypes: { status: "pending" },
      costCategories: { status: "pending" },
      costCentres: { status: "pending" },
      currencies: { status: "pending" },
      budgets: { status: "pending" },
      // ── Inventory Masters ───────────────────────────────────────────────────
      stockGroups: { status: "pending" },
      stockItems: { status: "pending" },
      stockCategories: { status: "pending" },
      units: { status: "pending" },
      godowns: { status: "pending" },
      // ── Transactions ────────────────────────────────────────────────────────
      vouchers: { status: "pending" }
    },
    summary: null,
    readyToSync: false,
    errors: []
  };
  async function softCheck(key, fn) {
    try {
      return await fn();
    } catch (e) {
      result.checks[key] = { status: "warn", error: e.message, count: 0 };
      return null;
    }
  }
  try {
    const ping = await pingTally();
    result.checks.ping = {
      status: ping.connected ? "ok" : "fail",
      latencyMs: ping.latencyMs,
      url: ping.url,
      error: ping.error || null
    };
    if (!ping.connected) {
      result.status = "failed";
      result.errors.push(`Connection failed: ${ping.error}`);
      result.readyToSync = false;
      result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
      return result;
    }
  } catch (e) {
    result.checks.ping = { status: "fail", error: e.message };
    result.status = "failed";
    result.readyToSync = false;
    result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    return result;
  }
  try {
    const companies = await fetchTallyCompanies();
    result.checks.companies = {
      status: companies.length > 0 ? "ok" : "warn",
      count: companies.length,
      data: companies
    };
    if (companies.length === 0) result.errors.push("No companies found in Tally");
  } catch (e) {
    result.checks.companies = { status: "fail", error: e.message };
    result.errors.push(`Companies: ${e.message}`);
  }
  await softCheck("groups", async () => {
    const groups = await fetchTallyGroups(companyName);
    result.checks.groups = {
      status: groups.length > 0 ? "ok" : "warn",
      count: groups.length,
      sample: groups.slice(0, 5)
    };
  });
  try {
    const ledgers = await fetchTallyLedgers(companyName);
    const partyLedgers = ledgers.filter((l) => l.type === "Party");
    result.checks.ledgers = {
      status: ledgers.length > 0 ? "ok" : "warn",
      count: ledgers.length,
      partyCount: partyLedgers.length,
      withGstin: ledgers.filter((l) => l.gstin).length,
      withEmail: ledgers.filter((l) => l.email).length,
      withPhone: ledgers.filter((l) => l.phone).length,
      sample: ledgers.slice(0, 5)
    };
    if (ledgers.length === 0) result.errors.push("No ledgers found");
  } catch (e) {
    result.checks.ledgers = { status: "fail", error: e.message };
    result.errors.push(`Ledgers: ${e.message}`);
  }
  await softCheck("voucherTypes", async () => {
    const vt = await fetchTallyVoucherTypes(companyName);
    result.checks.voucherTypes = {
      status: vt.length > 0 ? "ok" : "warn",
      count: vt.length,
      sample: vt.slice(0, 8)
    };
  });
  await softCheck("costCategories", async () => {
    const cc = await fetchTallyCostCategories(companyName);
    result.checks.costCategories = {
      status: "ok",
      count: cc.length,
      sample: cc.slice(0, 5)
    };
  });
  await softCheck("costCentres", async () => {
    const centres = await fetchTallyCostCentres(companyName);
    result.checks.costCentres = {
      status: "ok",
      count: centres.length,
      sample: centres.slice(0, 5)
    };
  });
  await softCheck("currencies", async () => {
    const cur = await fetchTallyCurrencies(companyName);
    result.checks.currencies = {
      status: cur.length > 0 ? "ok" : "warn",
      count: cur.length,
      sample: cur
    };
  });
  await softCheck("budgets", async () => {
    const bud = await fetchTallyBudgets(companyName);
    result.checks.budgets = {
      status: "ok",
      count: bud.length,
      sample: bud.slice(0, 5)
    };
  });
  await softCheck("stockGroups", async () => {
    const sg = await fetchTallyStockGroups(companyName);
    result.checks.stockGroups = {
      status: "ok",
      count: sg.length,
      sample: sg.slice(0, 5)
    };
  });
  await softCheck("stockItems", async () => {
    const items = await fetchTallyStockItems(companyName);
    const totalClosingValue = items.reduce((s, i) => s + i.closingValue, 0);
    result.checks.stockItems = {
      status: items.length > 0 ? "ok" : "warn",
      count: items.length,
      totalClosingValue,
      sample: items.slice(0, 5)
    };
  });
  await softCheck("stockCategories", async () => {
    const sc = await fetchTallyStockCategories(companyName);
    result.checks.stockCategories = {
      status: "ok",
      count: sc.length,
      sample: sc.slice(0, 5)
    };
  });
  await softCheck("units", async () => {
    const units = await fetchTallyUnits(companyName);
    result.checks.units = {
      status: units.length > 0 ? "ok" : "warn",
      count: units.length,
      sample: units.slice(0, 8)
    };
  });
  await softCheck("godowns", async () => {
    const gd = await fetchTallyGodowns(companyName);
    result.checks.godowns = {
      status: "ok",
      count: gd.length,
      sample: gd.slice(0, 5)
    };
  });
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const from365 = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const voucherFrom = options.fromDate || from365;
    const voucherTo = options.toDate || today;
    logger.info(`Voucher check: fetching vouchers from ${voucherFrom} to ${voucherTo}`, { company: companyName });
    const vouchers = await fetchTallyVouchers(companyName, voucherFrom, voucherTo);
    const byType = {};
    vouchers.forEach((v) => {
      byType[v.voucherType] = (byType[v.voucherType] || 0) + 1;
    });
    const totalAmount = vouchers.reduce((s, v) => s + v.netAmount, 0);
    result.checks.vouchers = {
      status: vouchers.length > 0 ? "ok" : "warn",
      count: vouchers.length,
      byType,
      totalAmount,
      sample: vouchers.slice(0, 5)
    };
  } catch (e) {
    logger.error(`Voucher check failed: ${e.message}`, { company: companyName });
    result.checks.vouchers = {
      status: "warn",
      error: e.message,
      count: 0
    };
    result.errors.push(`Vouchers fetch failed: ${e.message}`);
  }
  const criticalFail = ["ping", "companies", "ledgers"].some(
    (k) => result.checks[k]?.status === "fail"
  );
  const hasWarn = Object.values(result.checks).some((c) => c.status === "warn");
  result.status = criticalFail ? "failed" : hasWarn ? "warning" : "ok";
  result.readyToSync = !criticalFail;
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  result.summary = {
    companies: result.checks.companies?.count || 0,
    // Accounting masters
    groups: result.checks.groups?.count || 0,
    ledgers: result.checks.ledgers?.count || 0,
    voucherTypes: result.checks.voucherTypes?.count || 0,
    costCategories: result.checks.costCategories?.count || 0,
    costCentres: result.checks.costCentres?.count || 0,
    currencies: result.checks.currencies?.count || 0,
    budgets: result.checks.budgets?.count || 0,
    // Inventory masters
    stockGroups: result.checks.stockGroups?.count || 0,
    stockItems: result.checks.stockItems?.count || 0,
    stockCategories: result.checks.stockCategories?.count || 0,
    units: result.checks.units?.count || 0,
    godowns: result.checks.godowns?.count || 0,
    // Transactions
    vouchers: result.checks.vouchers?.count || 0
  };
  logger.info(`Middleware check complete: ${result.status}`, result.summary);
  return result;
}
function generateMonthlyChunks(fromDate, toDate) {
  const chunks = [];
  let current = /* @__PURE__ */ new Date(fromDate + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(toDate + "T00:00:00Z");
  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const chunkEnd = lastDay > end ? end : lastDay;
    const fromStr = current.toISOString().slice(0, 10);
    const toStr = chunkEnd.toISOString().slice(0, 10);
    const id = `${year}-${String(month + 1).padStart(2, "0")}`;
    chunks.push({ id, from: fromStr, to: toStr });
    current = new Date(Date.UTC(year, month + 1, 1));
  }
  return chunks;
}
async function fetchTallyVouchersChunked(companyName, fromDate, toDate, erpnextUrl = "default", onProgress = null) {
  if (!fromDate) {
    throw new Error(
      `fetchTallyVouchersChunked: fromDate is required. Ensure the Tally company has a valid books beginning date.`
    );
  }
  const chunks = generateMonthlyChunks(fromDate, toDate);
  const total = chunks.length;
  logger.info(
    `Voucher chunked fetch: ${total} monthly chunks \u2014 ${fromDate} \u2192 ${toDate}`,
    { company: companyName, erpnextUrl }
  );
  const allVouchers = [];
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (isChunkDone(companyName, erpnextUrl, "vouchers", chunk.id)) {
      logger.info(
        `Voucher chunk ${chunk.id} (${i + 1}/${total}): already done \u2014 skipping`,
        { company: companyName }
      );
      if (onProgress) onProgress(
        chunk.id,
        0,
        total,
        i + 1,
        true
        /* skipped */
      );
      continue;
    }
    logger.info(
      `Voucher chunk ${chunk.id} (${i + 1}/${total}): fetching ${chunk.from} \u2192 ${chunk.to}`,
      { company: companyName }
    );
    try {
      const raw = await fetchTallyVouchersChunk(companyName, chunk.from, chunk.to);
      const unique = raw.filter((v) => {
        if (seen.has(v.guid)) return false;
        seen.add(v.guid);
        return true;
      });
      allVouchers.push(...unique);
      markChunkDone(companyName, erpnextUrl, "vouchers", chunk.id, {
        from: chunk.from,
        to: chunk.to,
        count: unique.length
      });
      logger.info(
        `Voucher chunk ${chunk.id}: ${unique.length} vouchers \u2014 ${i + 1}/${total} done`,
        { company: companyName }
      );
      if (onProgress) onProgress(chunk.id, unique.length, total, i + 1, false);
    } catch (err) {
      logger.error(
        `Voucher chunk ${chunk.id} failed: ${err.message} \u2014 will retry on next run`,
        { company: companyName }
      );
      throw err;
    }
  }
  logger.info(
    `All ${total} voucher chunks complete: ${allVouchers.length} total vouchers`,
    { company: companyName }
  );
  return allVouchers;
}
async function fetchTallyLedgersChunked(companyName, erpnextUrl = "default", batchSize = parseInt(process.env.SYNC_LEDGER_BATCH_SIZE, 10) || 500, onProgress = null) {
  logger.info(
    `Ledger chunked fetch: fetching all ledgers then batching by ${batchSize}`,
    { company: companyName }
  );
  const allLedgers = await fetchTallyLedgers(companyName);
  const total = allLedgers.length;
  const batches = [];
  for (let i = 0; i < total; i += batchSize) {
    batches.push({
      id: `batch-${Math.floor(i / batchSize)}`,
      from: i,
      to: Math.min(i + batchSize, total),
      ledgers: allLedgers.slice(i, i + batchSize)
    });
  }
  logger.info(
    `Ledger chunked fetch: ${total} ledgers \u2192 ${batches.length} batches of ${batchSize}`,
    { company: companyName }
  );
  const pendingBatches = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (isChunkDone(companyName, erpnextUrl, "ledgers", batch.id)) {
      logger.info(
        `Ledger batch ${batch.id} (${i + 1}/${batches.length}): already done \u2014 skipping`,
        { company: companyName }
      );
      if (onProgress) onProgress(batch.id, 0, batches.length, i + 1, true);
      continue;
    }
    pendingBatches.push({ ...batch, index: i });
    if (onProgress) onProgress(batch.id, batch.ledgers.length, batches.length, i + 1, false);
  }
  return { batches: pendingBatches, total, batchCount: batches.length, allLedgers };
}
async function createSalesVoucher() {
  return false;
}
async function createPurchaseVoucher() {
  return false;
}
async function createPaymentVoucher() {
  return false;
}
async function createJournalVoucher() {
  return false;
}
var import_axios, import_xml2js, tallyAxios, _tallyBusy, _tallyQueue;
var init_tallyClient = __esm({
  "tally/tallyClient.js"() {
    import_axios = __toESM(require("axios"), 1);
    import_xml2js = require("xml2js");
    init_config();
    init_logger();
    init_syncChunkState();
    tallyAxios = import_axios.default.create({
      baseURL: config.tally.url,
      headers: {
        "Content-Type": "text/xml",
        "Connection": "close"
      },
      timeout: 6e5
      // 10 min — large voucher sets can take several minutes
    });
    _tallyBusy = false;
    _tallyQueue = [];
  }
});

// server.js
var import_express3 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
init_config();

// routes/index.js
var import_express = require("express");
init_syncChunkState();
init_tallyClient();

// tally/Erpnextclient.js
var import_axios2 = __toESM(require("axios"), 1);
var import_crypto = require("crypto");
init_config();
init_logger();

// tally/accountCustomFields.js
var ACCOUNT_CUSTOM_FIELDS = [
  {
    fieldname: "custom_tally_details",
    label: "Tally Details",
    fieldtype: "Section Break",
    insert_after: "include_in_gross"
  },
  {
    fieldname: "custom_under_group",
    label: "Under Group",
    fieldtype: "Data",
    insert_after: "custom_tally_details"
  },
  {
    fieldname: "custom_alias",
    label: "Alias",
    fieldtype: "Data",
    insert_after: "custom_under_group"
  },
  {
    fieldname: "custom_tally_col_1",
    fieldtype: "Column Break",
    insert_after: "custom_alias"
  },
  {
    fieldname: "custom_ledger_type",
    label: "Ledger Type",
    fieldtype: "Data",
    insert_after: "custom_tally_col_1"
  },
  {
    fieldname: "custom_transaction_type",
    label: "Transaction Type",
    fieldtype: "Data",
    insert_after: "custom_ledger_type"
  },
  {
    fieldname: "custom_tax_section",
    label: "Tax Registration Details",
    fieldtype: "Section Break",
    insert_after: "custom_transaction_type"
  },
  {
    fieldname: "custom_gst_rate",
    label: "GST Rate",
    fieldtype: "Float",
    insert_after: "custom_tax_section"
  },
  {
    fieldname: "custom_hsn_sac",
    label: "HSN SAC",
    fieldtype: "Data",
    insert_after: "custom_gst_rate"
  },
  {
    fieldname: "custom_tax_col_1",
    fieldtype: "Column Break",
    insert_after: "custom_hsn_sac"
  },
  {
    fieldname: "custom_pan_it_no",
    label: "PAN / IT No",
    fieldtype: "Data",
    insert_after: "custom_tax_col_1"
  },
  {
    fieldname: "custom_mailing_section",
    label: "Mailing Details",
    fieldtype: "Section Break",
    insert_after: "custom_pan_it_no"
  },
  {
    fieldname: "custom_mailing_name",
    label: "Mailing Name",
    fieldtype: "Data",
    insert_after: "custom_mailing_section"
  },
  {
    fieldname: "custom_mobile_no",
    label: "Mobile No",
    fieldtype: "Data",
    insert_after: "custom_mailing_name"
  },
  {
    fieldname: "custom_mail_col_1",
    fieldtype: "Column Break",
    insert_after: "custom_mobile_no"
  },
  {
    fieldname: "custom_address",
    label: "Address",
    fieldtype: "Small Text",
    insert_after: "custom_mail_col_1"
  },
  {
    fieldname: "custom_bank_section",
    label: "Banking Details",
    fieldtype: "Section Break",
    insert_after: "custom_address"
  },
  {
    fieldname: "custom_provide_bank_details",
    label: "Provide Bank Details",
    fieldtype: "Check",
    insert_after: "custom_bank_section"
  },
  // ADD THESE AT THE END OF THE ARRAY (before the closing ];)
  {
    fieldname: "custom_opening_balance_section",
    label: "Opening Balance",
    fieldtype: "Section Break",
    insert_after: "custom_provide_bank_details"
  },
  {
    fieldname: "custom_tally_opening_balance",
    label: "Opening Balance",
    fieldtype: "Float",
    // ← change Currency to Float
    insert_after: "custom_opening_balance_section"
  },
  {
    fieldname: "custom_tally_opening_balance_type",
    label: "Dr / Cr",
    fieldtype: "Select",
    options: "Dr\nCr",
    insert_after: "custom_tally_opening_balance"
  },
  {
    fieldname: "custom_ob_col_1",
    fieldtype: "Column Break",
    insert_after: "custom_tally_opening_balance_type"
  },
  {
    fieldname: "custom_tally_closing_balance",
    label: "Closing Balance",
    fieldtype: "Float",
    // ← change Currency to Float
    insert_after: "custom_ob_col_1"
  },
  {
    fieldname: "custom_tally_closing_balance_type",
    label: "Dr / Cr",
    fieldtype: "Select",
    options: "Dr\nCr",
    insert_after: "custom_tally_closing_balance"
  }
];

// tally/Erpnextclient.js
var BATCH_DELAY_MS = 800;
var BATCH_BURST = 5;
var BATCH_BURST_MS = 5e3;
var RETRY_ATTEMPTS = 5;
var RETRY_DELAY_MS = 8e3;
var CONCURRENCY = 2;
var ADDR_CONCURRENCY = 2;
var _throttle = {
  extraDelayMs: 0,
  consecutiveOk: 0,
  consecutive429: 0,
  hit(status) {
    if (status === 429) {
      this.consecutive429++;
      this.consecutiveOk = 0;
      this.extraDelayMs = Math.min(this.extraDelayMs + 2e3, 15e3);
    } else {
      this.consecutive429 = 0;
      this.consecutiveOk++;
      if (this.consecutiveOk >= 5 && this.extraDelayMs > 0) {
        this.extraDelayMs = Math.max(0, this.extraDelayMs - 200);
        this.consecutiveOk = 0;
      }
    }
  },
  delay() {
    return BATCH_DELAY_MS + this.extraDelayMs;
  },
  reset() {
    this.extraDelayMs = 0;
    this.consecutiveOk = 0;
    this.consecutive429 = 0;
  }
};
function createErpClient(creds = {}) {
  const url = creds.url || config.erpnext.url;
  const apiKey = creds.apiKey || config.erpnext.apiKey;
  const apiSecret = creds.apiSecret || config.erpnext.apiSecret;
  if (!url) throw new Error("ERPNEXT_URL not set \u2014 add it in .env or provide credentials in the Sync UI");
  if (!apiKey || !apiSecret) throw new Error("ERPNEXT_API_KEY / ERPNEXT_API_SECRET not set \u2014 add them in .env or provide credentials in the Sync UI");
  return import_axios2.default.create({
    baseURL: url.replace(/\/$/, ""),
    headers: {
      Authorization: "token " + apiKey + ":" + apiSecret,
      "Content-Type": "application/json"
    },
    timeout: 6e4
  });
}
var _customerGroup = null;
var _supplierGroup = null;
var _territory = null;
var _cancel = { requested: false };
function cancelSync() {
  _cancel.requested = true;
}
function resetCancel() {
  _cancel.requested = false;
}
function checkCancelled(label) {
  if (_cancel.requested) {
    throw Object.assign(new Error("Sync cancelled by user"), { _cancelled: true });
  }
}
function looksLikeAsset(name) {
  if (!name) return false;
  const n = name.trim();
  if (/[A-Z0-9]{3,}[\/\-*][A-Z0-9]{2,}/i.test(n)) return true;
  const assetBrands = [
    "daikin",
    "hitachi",
    "lg ",
    "samsung",
    "apple ",
    "dell ",
    "hp ",
    "asus",
    "lenovo",
    "acer",
    "fujitsu",
    "toshiba",
    "logitech",
    "ncomputing",
    "kent",
    "bluestar",
    "mitsubishi",
    "honda",
    "motorola",
    "oneplus",
    "mi led",
    "quanta"
  ];
  const lower = n.toLowerCase();
  if (assetBrands.some((b) => lower.startsWith(b))) return true;
  const assetNouns = [
    "laptop",
    "computer",
    "server",
    "ups",
    "ac ",
    "air conditioner",
    "fridge",
    "refrigerator",
    "refrigirator",
    "television",
    "tv ",
    "microwave",
    "bed ",
    "matress",
    "sofa",
    "locker",
    "hard disk",
    "keyboard",
    "monitor",
    "led monitor",
    "lan switch",
    "motor bike"
  ];
  if (assetNouns.some((a) => lower.startsWith(a) || lower === a)) return true;
  return false;
}
var _knownItemGroups = /* @__PURE__ */ new Set();
var _knownUoMs = /* @__PURE__ */ new Set();
var _knownHsn = /* @__PURE__ */ new Set();
var _accountCache = /* @__PURE__ */ new Map();
var _accountTypeMap = /* @__PURE__ */ new Map();
var _companyAbbrCache = /* @__PURE__ */ new Map();
var _companyNameCache = /* @__PURE__ */ new Map();
var _erpAccountsForRun = /* @__PURE__ */ new Map();
function clearCaches() {
  _knownItemGroups.clear();
  _knownUoMs.clear();
  _knownHsn.clear();
  _accountCache.clear();
  _accountTypeMap.clear();
  _companyAbbrCache.clear();
  _companyNameCache.clear();
  _knownCustomFields.clear();
  _customerGroup = null;
  _supplierGroup = null;
  _erpAccountsForRun.clear();
  _territory = null;
  logger.info("ERPNext client caches cleared for new sync run [erpnextClient v8]");
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var STATE_TERRITORY_MAP = {
  "andhra pradesh": "Andhra Pradesh",
  "arunachal pradesh": "Arunachal Pradesh",
  "assam": "Assam",
  "bihar": "Bihar",
  "chhattisgarh": "Chhattisgarh",
  "goa": "Goa",
  "gujarat": "Gujarat",
  "haryana": "Haryana",
  "himachal pradesh": "Himachal Pradesh",
  "jharkhand": "Jharkhand",
  "karnataka": "Karnataka",
  "kerala": "Kerala",
  "madhya pradesh": "Madhya Pradesh",
  "maharashtra": "Maharashtra",
  "manipur": "Manipur",
  "meghalaya": "Meghalaya",
  "mizoram": "Mizoram",
  "nagaland": "Nagaland",
  "odisha": "Odisha",
  "punjab": "Punjab",
  "rajasthan": "Rajasthan",
  "sikkim": "Sikkim",
  "tamil nadu": "Tamil Nadu",
  "telangana": "Telangana",
  "tripura": "Tripura",
  "uttar pradesh": "Uttar Pradesh",
  "uttarakhand": "Uttarakhand",
  "west bengal": "West Bengal",
  "delhi": "Delhi",
  "jammu and kashmir": "Jammu and Kashmir",
  "ladakh": "Ladakh",
  "chandigarh": "Chandigarh",
  "dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "lakshadweep": "Lakshadweep",
  "puducherry": "Puducherry",
  "andaman and nicobar islands": "Andaman and Nicobar Islands"
};
var _verifiedTerritories = /* @__PURE__ */ new Set(["India"]);
var _invalidTerritories = /* @__PURE__ */ new Set();
async function resolveTerritory(client, state) {
  if (!state || !state.trim()) return _territory || "India";
  const mapped = STATE_TERRITORY_MAP[state.trim().toLowerCase()] || state.trim();
  if (_verifiedTerritories.has(mapped)) return mapped;
  if (_invalidTerritories.has(mapped)) return _territory || "India";
  try {
    await client.get("/api/resource/Territory/" + encodeURIComponent(mapped));
    _verifiedTerritories.add(mapped);
    return mapped;
  } catch (_) {
    _invalidTerritories.add(mapped);
    logger.info(
      `Territory "${mapped}" not found in ERPNext \u2014 using "${_territory || "India"}" as fallback. You can create it in ERPNext under Setup \u2192 Territory if needed.`
    );
    return _territory || "India";
  }
}
async function findPartyAddress(client, partyType, partyName) {
  try {
    const res = await client.get("/api/resource/Dynamic Link", {
      params: {
        filters: JSON.stringify([
          ["link_doctype", "=", partyType],
          ["link_name", "=", partyName],
          ["parenttype", "=", "Address"]
        ]),
        fields: '["parent"]',
        limit: 1
      }
    });
    const p = res?.data?.data?.[0]?.parent;
    if (p) return p;
  } catch (_) {
  }
  try {
    const partyRes = await client.get("/api/resource/" + encodeURIComponent(partyType) + "/" + encodeURIComponent(partyName), {
      params: {
        fields: JSON.stringify(
          partyType === "Customer" ? ["customer_primary_address", "primary_address"] : ["supplier_primary_address", "primary_address"]
        )
      }
    });
    const d = partyRes?.data?.data;
    const addr = d?.customer_primary_address || d?.supplier_primary_address || d?.primary_address;
    if (addr) return addr;
  } catch (_) {
  }
  const candidateNames = [
    partyName + "-Billing",
    partyName,
    partyName + "-1",
    partyName + "-Billing-1"
  ];
  for (const cName of candidateNames) {
    try {
      const checkRes = await client.get("/api/resource/Address/" + encodeURIComponent(cName), {
        params: { fields: '["name"]' }
      });
      if (checkRes?.data?.data?.name) return checkRes.data.data.name;
    } catch (_) {
    }
  }
  try {
    const titleRes = await client.get("/api/resource/Address", {
      params: {
        filters: JSON.stringify([["address_title", "=", partyName]]),
        fields: '["name"]',
        limit: 1
      }
    });
    const addr = titleRes?.data?.data?.[0]?.name;
    if (addr) return addr;
  } catch (_) {
  }
  return null;
}
async function findPartyContact(client, partyType, partyName) {
  try {
    const res = await client.get("/api/resource/Dynamic Link", {
      params: {
        filters: JSON.stringify([
          ["link_doctype", "=", partyType],
          ["link_name", "=", partyName],
          ["parenttype", "=", "Contact"]
        ]),
        fields: '["parent"]',
        limit: 1
      }
    });
    const p = res?.data?.data?.[0]?.parent;
    if (p) return p;
  } catch (_) {
  }
  try {
    const partyRes = await client.get("/api/resource/" + encodeURIComponent(partyType) + "/" + encodeURIComponent(partyName), {
      params: {
        fields: JSON.stringify(
          partyType === "Customer" ? ["customer_primary_contact", "primary_contact"] : ["supplier_primary_contact", "primary_contact"]
        )
      }
    });
    const d = partyRes?.data?.data;
    const cont = d?.customer_primary_contact || d?.supplier_primary_contact || d?.primary_contact;
    if (cont) return cont;
  } catch (_) {
  }
  try {
    const checkRes = await client.get("/api/resource/Contact/" + encodeURIComponent(partyName), {
      params: { fields: '["name"]' }
    });
    if (checkRes?.data?.data?.name) return checkRes.data.data.name;
  } catch (_) {
  }
  return null;
}
async function ensureIndiaAddressTemplate(client) {
  const parts = [];
  parts.push(`{% if address_line1 and address_line1 != address_title %}{{ address_line1 }}<br>{% endif %}`);
  parts.push(`{% if address_line2 %}{{ address_line2 }}<br>{% endif %}`);
  parts.push(`{% if city %}{{ city }}{% endif %}`);
  parts.push(`{% if state %}{% if city %}, {% endif %}{{ state }}{% endif %}`);
  parts.push(`{% if pincode %} - {{ pincode }}{% endif %}`);
  parts.push(`<br>{% if country %}{{ country }}{% endif %}`);
  const template = parts.join("");
  try {
    await client.put("/api/resource/Address Template/India", { template });
    logger.info("[AddressTemplate] Updated India address template to include street address");
  } catch (e) {
    try {
      await client.post("/api/resource/Address Template", {
        doctype: "Address Template",
        country: "India",
        is_default: 1,
        template
      });
      logger.info("[AddressTemplate] Created India address template");
    } catch (e2) {
      logger.warn("[AddressTemplate] Could not update address template: " + (e2?.response?.data?.message || e2.message));
    }
  }
}
async function ensureAddress(client, partyName, partyType, ledger) {
  partyName = ledger.erpName || partyName;
  if (!ledger.address && !ledger.state && !ledger.pincode && !ledger.phone && !ledger.email && !ledger.city) return;
  const INDIAN_STATES = {
    "andhra pradesh": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chhattisgarh": "Chhattisgarh",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal pradesh": "Himachal Pradesh",
    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "madhya pradesh": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil nadu": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar pradesh": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "west bengal": "West Bengal",
    "andaman and nicobar islands": "Andaman and Nicobar Islands",
    "chandigarh": "Chandigarh",
    "dadra and nagar haveli": "Dadra and Nagar Haveli",
    "daman and diu": "Daman and Diu",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "jammu and kashmir": "Jammu and Kashmir",
    "ladakh": "Ladakh",
    "lakshadweep": "Lakshadweep",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry"
  };
  const PINCODE_STATE_PREFIX = {
    "11": "Delhi",
    "12": "Haryana",
    "13": "Haryana",
    "14": "Punjab",
    "15": "Punjab",
    "16": "Punjab",
    "17": "Himachal Pradesh",
    "18": "Jammu and Kashmir",
    "19": "Jammu and Kashmir",
    "20": "Uttar Pradesh",
    "21": "Uttar Pradesh",
    "22": "Uttar Pradesh",
    "23": "Uttar Pradesh",
    "24": "Uttar Pradesh",
    "25": "Uttar Pradesh",
    "26": "Uttar Pradesh",
    "27": "Uttar Pradesh",
    "28": "Uttar Pradesh",
    "30": "Rajasthan",
    "31": "Rajasthan",
    "32": "Rajasthan",
    "33": "Rajasthan",
    "34": "Rajasthan",
    "36": "Gujarat",
    "37": "Gujarat",
    "38": "Gujarat",
    "39": "Gujarat",
    "40": "Maharashtra",
    "41": "Maharashtra",
    "42": "Maharashtra",
    "43": "Maharashtra",
    "44": "Maharashtra",
    "45": "Madhya Pradesh",
    "46": "Madhya Pradesh",
    "47": "Madhya Pradesh",
    "48": "Madhya Pradesh",
    "49": "Chhattisgarh",
    "50": "Telangana",
    "51": "Telangana",
    "52": "Andhra Pradesh",
    "53": "Andhra Pradesh",
    "56": "Karnataka",
    "57": "Karnataka",
    "58": "Karnataka",
    "59": "Karnataka",
    "60": "Tamil Nadu",
    "61": "Tamil Nadu",
    "62": "Tamil Nadu",
    "63": "Tamil Nadu",
    "64": "Tamil Nadu",
    "67": "Kerala",
    "68": "Kerala",
    "69": "Kerala",
    "70": "West Bengal",
    "71": "West Bengal",
    "72": "West Bengal",
    "73": "West Bengal",
    "74": "West Bengal",
    "75": "Odisha",
    "76": "Odisha",
    "77": "Odisha",
    "78": "Assam",
    "79": "Assam",
    "80": "Bihar",
    "81": "Bihar",
    "84": "Bihar",
    "85": "Bihar",
    "82": "Jharkhand",
    "83": "Jharkhand"
  };
  let stateVal = null;
  if (ledger.state && ledger.state.trim()) {
    stateVal = INDIAN_STATES[ledger.state.trim().toLowerCase()] || ledger.state.trim();
  }
  if (!stateVal && ledger.address) {
    const lower = ledger.address.toLowerCase();
    for (const [key, mapped] of Object.entries(INDIAN_STATES)) {
      if (lower.includes(key)) {
        stateVal = mapped;
        break;
      }
    }
  }
  if (!stateVal) {
    const rawPin2 = ledger.pincode ? String(ledger.pincode).trim().replace(/\D/g, "") : "";
    if (/^[1-9]\d{4,5}$/.test(rawPin2)) {
      stateVal = PINCODE_STATE_PREFIX[rawPin2.slice(0, 2)] || null;
      if (stateVal) logger.info("[Address] Derived state from pincode " + rawPin2 + " \u2192 " + stateVal + " for " + partyName);
    }
  }
  if (!stateVal) {
    logger.info("[Address] Skipping " + partyName + " \u2014 no state available (not in Tally, not in address text, no valid pincode)");
    return;
  }
  let cityVal = (ledger.city || "").trim();
  let cityExtractedFromAddress = false;
  if (!cityVal && ledger.address) {
    const parts = ledger.address.split(",").map((p) => p.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (/^\d{6}$/.test(p)) continue;
      if (INDIAN_STATES[p.toLowerCase()]) continue;
      if (p === stateVal) continue;
      cityVal = p;
      cityExtractedFromAddress = true;
      break;
    }
  }
  const rawPin = ledger.pincode ? String(ledger.pincode).trim().replace(/\D/g, "") : "";
  const pincodeVal = /^[1-9]\d{4,5}$/.test(rawPin) ? rawPin : "";
  let addressLine1;
  if (ledger.address && ledger.address.trim()) {
    if (cityExtractedFromAddress) {
      const cleanParts = ledger.address.split(",").map((p) => p.trim()).filter((p) => {
        if (!p) return false;
        if (/^\d{6}$/.test(p)) return false;
        if (p === cityVal) return false;
        if (INDIAN_STATES[p.toLowerCase()]) return false;
        if (p === stateVal) return false;
        return true;
      });
      addressLine1 = cleanParts.length > 0 ? cleanParts.join(", ") : partyName;
    } else {
      addressLine1 = ledger.address.trim();
    }
  } else {
    addressLine1 = partyName;
  }
  const doc = {
    doctype: "Address",
    address_title: partyName,
    address_type: "Billing",
    address_line1: addressLine1,
    address_line2: "",
    // Explicitly clear any existing value
    city: cityVal || stateVal,
    state: stateVal,
    country: ledger.country || "India",
    links: [{ link_doctype: partyType, link_name: partyName }],
    pincode: pincodeVal || "",
    phone: ledger.phone || "",
    email_id: ledger.email || ""
  };
  try {
    let existingName = await findPartyAddress(client, partyType, partyName);
    if (existingName) {
      const updateDoc = Object.assign({}, doc, { name: existingName });
      delete updateDoc.links;
      await client.put(
        "/api/resource/Address/" + encodeURIComponent(existingName),
        updateDoc
      );
      await client.put(
        "/api/resource/" + partyType + "/" + encodeURIComponent(partyName),
        partyType === "Customer" ? { customer_primary_address: existingName, primary_address: existingName } : { supplier_primary_address: existingName, primary_address: existingName }
      ).catch(() => null);
      logger.info("[Address] Updated address for " + partyName + " (" + existingName + ") with: " + JSON.stringify(updateDoc));
    } else {
      let createdName = null;
      try {
        const created = await client.post("/api/resource/Address", doc);
        createdName = created?.data?.data?.name;
      } catch (postErr) {
        const errMsg = String(postErr?.response?.data?.message || postErr?.message || "");
        if (errMsg.includes("already exists") || postErr?.response?.status === 409) {
          existingName = await findPartyAddress(client, partyType, partyName) || partyName + "-Billing";
          const updateDoc = Object.assign({}, doc, { name: existingName });
          delete updateDoc.links;
          await client.put("/api/resource/Address/" + encodeURIComponent(existingName), updateDoc).catch(() => {
          });
          createdName = existingName;
        } else {
          throw postErr;
        }
      }
      if (createdName) {
        await client.put(
          "/api/resource/" + partyType + "/" + encodeURIComponent(partyName),
          partyType === "Customer" ? { customer_primary_address: createdName, primary_address: createdName } : { supplier_primary_address: createdName, primary_address: createdName }
        ).catch(() => null);
        logger.info("[Address] Linked address for " + partyName + " (" + createdName + ")");
      }
    }
  } catch (err) {
    logger.warn("Address sync skipped for " + partyName + ": " + parseErpError(err));
  }
}
async function ensureContact(client, partyName, partyType, ledger) {
  partyName = ledger.erpName || partyName;
  if (!ledger.phone && !ledger.email) return;
  const nameParts = partyName.split(" ");
  const doc = {
    doctype: "Contact",
    first_name: nameParts[0] || partyName,
    last_name: nameParts.slice(1).join(" ") || "",
    links: [{ link_doctype: partyType, link_name: partyName }],
    phone_nos: ledger.phone ? [{ phone: ledger.phone, is_primary_phone: 1 }] : [],
    email_ids: ledger.email ? [{ email_id: ledger.email, is_primary: 1 }] : []
  };
  try {
    let existingName = await findPartyContact(client, partyType, partyName);
    if (existingName) {
      const updateDoc = Object.assign({}, doc, { name: existingName });
      delete updateDoc.links;
      await client.put(
        "/api/resource/Contact/" + encodeURIComponent(existingName),
        updateDoc
      );
      await client.put(
        "/api/resource/" + partyType + "/" + encodeURIComponent(partyName),
        partyType === "Customer" ? { customer_primary_contact: existingName, primary_contact: existingName } : { supplier_primary_contact: existingName, primary_contact: existingName }
      ).catch(() => null);
      logger.info("[Contact] Updated contact for " + partyName + " (" + existingName + ")");
    } else {
      let createdName = null;
      try {
        const created = await client.post("/api/resource/Contact", doc);
        createdName = created?.data?.data?.name;
      } catch (postErr) {
        const errMsg = String(postErr?.response?.data?.message || postErr?.message || "");
        if (errMsg.includes("already exists") || postErr?.response?.status === 409) {
          existingName = await findPartyContact(client, partyType, partyName) || partyName;
          const updateDoc = Object.assign({}, doc, { name: existingName });
          delete updateDoc.links;
          await client.put("/api/resource/Contact/" + encodeURIComponent(existingName), updateDoc).catch(() => {
          });
          createdName = existingName;
        } else {
          throw postErr;
        }
      }
      if (createdName) {
        await client.put(
          "/api/resource/" + partyType + "/" + encodeURIComponent(partyName),
          partyType === "Customer" ? { customer_primary_contact: createdName, primary_contact: createdName } : { supplier_primary_contact: createdName, primary_contact: createdName }
        ).catch(() => null);
        logger.info("[Contact] Linked contact for " + partyName + " (" + createdName + ")");
      }
    }
  } catch (err) {
    logger.warn("Contact sync skipped for " + partyName + ": " + parseErpError(err));
  }
}
async function resolveErpNextCompany(client, tallyName, creds = {}) {
  const overrideName = creds.erpnextCompany && creds.erpnextCompany.trim();
  const nameToUse = overrideName || tallyName;
  if (!nameToUse) return nameToUse;
  if (_companyNameCache.has(nameToUse)) return _companyNameCache.get(nameToUse);
  _companyNameCache.set(nameToUse, nameToUse);
  logger.info('Using ERPNext company: "' + nameToUse + '"' + (overrideName ? " (from Sync UI)" : " (from Tally name)"));
  return nameToUse;
}
async function resolveGroups(client) {
  if (!_customerGroup) {
    try {
      const res = await client.get("/api/resource/Customer Group", {
        params: { fields: '["name"]', filters: JSON.stringify([["Customer Group", "is_group", "=", 0]]), limit: 500 }
      });
      const groups = res.data && res.data.data || [];
      const preferred = groups.find((g) => g.name === "Commercial") || groups.find((g) => g.name === "Individual") || groups[0];
      _customerGroup = preferred ? preferred.name : null;
    } catch (_) {
      _customerGroup = "Commercial";
    }
    logger.info("Using Customer Group: " + _customerGroup);
  }
  if (!_supplierGroup) {
    try {
      const res = await client.get("/api/resource/Supplier Group", {
        params: { fields: '["name"]', filters: JSON.stringify([["Supplier Group", "is_group", "=", 0]]), limit: 500 }
      });
      const groups = res.data && res.data.data || [];
      const preferred = groups.find((g) => g.name === "Services") || groups.find((g) => g.name === "Local") || groups[0];
      _supplierGroup = preferred ? preferred.name : null;
    } catch (_) {
      _supplierGroup = "Services";
    }
    logger.info("Using Supplier Group: " + _supplierGroup);
  }
  if (!_territory) {
    _territory = "India";
    logger.info("Using default Territory: " + _territory);
  }
}
async function ensureItemGroup(client, groupName) {
  if (!groupName || groupName === "All Item Groups" || _knownItemGroups.has(groupName)) return;
  try {
    await client.get("/api/resource/Item Group/" + encodeURIComponent(groupName));
    _knownItemGroups.add(groupName);
    return;
  } catch (_) {
  }
  try {
    await client.post("/api/resource/Item Group", {
      doctype: "Item Group",
      item_group_name: groupName,
      parent_item_group: "All Item Groups",
      is_group: 0
    });
    _knownItemGroups.add(groupName);
    logger.info("Created Item Group: " + groupName);
  } catch (err) {
    _knownItemGroups.add(groupName);
    logger.warn("Item Group create skipped for " + groupName + ": " + parseErpError(err));
  }
}
var UOM_MAP = {
  "nos": "Nos",
  "no": "Nos",
  "num": "Nos",
  "pcs": "Nos",
  "pcs.": "Nos",
  "pc": "Nos",
  "unit": "Unit",
  "units": "Unit",
  "user": "Unit",
  "mth": "Month",
  "month": "Month",
  "months": "Month",
  "yr": "Year",
  "year": "Year",
  "years": "Year",
  "hr": "Hour",
  "hrs": "Hour",
  "hour": "Hour",
  "hours": "Hour",
  "day": "Day",
  "days": "Day",
  "kg": "Kg",
  "kgs": "Kg",
  "gm": "Gram",
  "gram": "Gram",
  "ltr": "Litre",
  "litre": "Litre",
  "liter": "Litre",
  "mtr": "Metre",
  "metre": "Metre",
  "meter": "Metre",
  "not applicable": "Unit"
};
function normaliseUoM(raw) {
  if (!raw) return "Nos";
  const mapped = UOM_MAP[raw.trim().toLowerCase()];
  return mapped || raw.trim();
}
async function ensureUoM(client, uomName) {
  if (!uomName || _knownUoMs.has(uomName)) return;
  try {
    await client.get("/api/resource/UOM/" + encodeURIComponent(uomName));
    _knownUoMs.add(uomName);
    return;
  } catch (_) {
  }
  try {
    await client.post("/api/resource/UOM", { doctype: "UOM", uom_name: uomName, enabled: 1 });
    _knownUoMs.add(uomName);
    logger.info("Created UoM: " + uomName);
  } catch (err) {
    _knownUoMs.add(uomName);
    logger.warn("UoM create skipped for " + uomName + ": " + parseErpError(err));
  }
}
function sanitiseHsn(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits || digits === "00000000" || digits === "000000") return null;
  if (digits.length === 8) return digits;
  if (digits.length === 6) return digits;
  if (digits.length === 4) return digits.padEnd(6, "0");
  if (digits.length === 7) return digits + "0";
  if (digits.length === 5) return digits + "0";
  if (digits.length < 4) return digits.padEnd(6, "0");
  return digits.slice(0, 8);
}
async function ensureHsnCode(client, hsnCode) {
  if (!hsnCode || hsnCode === "null" || _knownHsn.has(hsnCode)) return;
  try {
    await client.get("/api/resource/GST HSN Code/" + encodeURIComponent(hsnCode));
    _knownHsn.add(hsnCode);
    return;
  } catch (_) {
  }
  try {
    await client.post("/api/resource/GST HSN Code", {
      doctype: "GST HSN Code",
      hsn_code: hsnCode,
      description: hsnCode === "99999999" ? "Other Goods / Services (Tally fallback)" : "HSN " + hsnCode + " (from Tally)"
    });
    _knownHsn.add(hsnCode);
  } catch (_) {
    _knownHsn.add(hsnCode);
  }
}
async function getCompanyAbbr(client, companyName) {
  if (_companyAbbrCache.has(companyName)) return _companyAbbrCache.get(companyName);
  try {
    const res = await client.get("/api/resource/Company/" + encodeURIComponent(companyName), {
      params: { fields: '["abbr"]' }
    });
    const abbr = res.data && res.data.data && res.data.data.abbr || companyName.slice(0, 3).toUpperCase();
    _companyAbbrCache.set(companyName, abbr);
    return abbr;
  } catch (e) {
    const errDetail = e.response ? "HTTP " + e.response.status + ": " + JSON.stringify(e.response.data).slice(0, 200) : e.message;
    logger.error('getCompanyAbbr failed for "' + companyName + '": ' + errDetail + " -- falling back to slice");
    const abbr = companyName.slice(0, 3).toUpperCase();
    _companyAbbrCache.set(companyName, abbr);
    return abbr;
  }
}
async function resolveAccount(client, ledgerName, companyAbbr, companyName) {
  if (!ledgerName) return null;
  ledgerName = ledgerName.trim();
  if (!ledgerName) return null;
  const cacheKey = ledgerName + "::" + companyAbbr;
  if (_accountCache.has(cacheKey)) return _accountCache.get(cacheKey);
  if (companyName) {
    try {
      const res = await client.get("/api/resource/Account", {
        params: {
          filters: JSON.stringify([["Account", "account_name", "=", ledgerName], ["Account", "company", "=", companyName]]),
          fields: '["name"]',
          limit: 1
        }
      });
      const found = res.data && res.data.data && res.data.data[0] && res.data.data[0].name;
      if (found) {
        _accountCache.set(cacheKey, found);
        return found;
      }
    } catch (_) {
    }
  }
  try {
    const res = await client.get("/api/resource/Account", {
      params: {
        filters: JSON.stringify([["Account", "account_name", "=", ledgerName]]),
        fields: '["name"]',
        limit: 1
      }
    });
    const found = res.data && res.data.data && res.data.data[0] && res.data.data[0].name;
    if (found) {
      const expectedSuffix = " - " + companyAbbr;
      if (!companyAbbr || found.endsWith(expectedSuffix)) {
        _accountCache.set(cacheKey, found);
        return found;
      }
    }
  } catch (_) {
  }
  const suffixed = ledgerName + " - " + companyAbbr;
  try {
    const res = await client.get("/api/resource/Account/" + encodeURIComponent(suffixed), {
      params: { fields: '["name"]' }
    });
    const found = res.data && res.data.data && res.data.data.name;
    if (found) {
      _accountCache.set(cacheKey, found);
      return found;
    }
  } catch (_) {
  }
  if (companyName) {
    try {
      const lower = ledgerName.toLowerCase();
      let accountType = "";
      let parentAccount = null;
      if (/bank|current a\/c|savings|sweep|kotak|hdfc|sbi|icici|axis|dbs|yes bank|\d{9,}/i.test(lower)) {
        accountType = "Bank";
      } else if (/cash|petty/i.test(lower)) {
        accountType = "Cash";
      } else if (/debtor|receivable/i.test(lower)) {
        accountType = "Receivable";
      } else if (/income|revenue|sales/i.test(lower)) {
        accountType = "Income Account";
      } else if (/expense|purchase|cost/i.test(lower)) {
        accountType = "Expense Account";
      } else if (/creditor|payable|sundry creditor/i.test(lower)) {
        accountType = "Payable";
      }
      const KNOWN_TALLY_GROUPS = [
        "indirect incomes",
        "direct incomes",
        "sales accounts",
        "purchase accounts",
        "indirect expenses",
        "direct expenses",
        "bank accounts",
        "cash-in-hand",
        "sundry debtors",
        "sundry creditors",
        "current assets",
        "current liabilities",
        "fixed assets",
        "capital account",
        "reserves & surplus",
        "loans (liability)",
        "loans & advances (asset)",
        "stock-in-hand",
        "deposits (asset)",
        "duties & taxes",
        "provisions",
        "investments",
        "branch / divisions",
        "suspense a/c",
        "misc. expenses (asset)",
        "primary",
        "retained earnings",
        "secured loans",
        "unsecured loans",
        "bank od a/c",
        "bank occ a/c"
      ];
      if (KNOWN_TALLY_GROUPS.includes(lower)) {
        _accountCache.set(cacheKey, suffixed);
        return suffixed;
      }
      if (/bank|current a\/c|savings|sweep|kotak|hdfc|sbi|icici|axis|dbs|yes bank|\d{9,}/i.test(lower)) {
        accountType = "Bank";
      } else if (/cash|petty/i.test(lower)) {
        accountType = "Cash";
      } else if (/debtor|receivable/i.test(lower)) {
        accountType = "Receivable";
      } else if (/income|revenue|sales/i.test(lower)) {
        accountType = "Income Account";
      } else if (/expense|purchase|cost/i.test(lower)) {
        accountType = "Expense Account";
      }
      const typeFilterMap = {
        "Bank": [["Account", "account_type", "=", "Bank"], ["Account", "is_group", "=", 1], ["Account", "company", "=", companyName]],
        "Cash": [["Account", "account_type", "=", "Cash"], ["Account", "is_group", "=", 1], ["Account", "company", "=", companyName]],
        "Receivable": [["Account", "account_type", "=", "Receivable"], ["Account", "is_group", "=", 1], ["Account", "company", "=", companyName]],
        "Income Account": [["Account", "root_type", "=", "Income"], ["Account", "is_group", "=", 1], ["Account", "company", "=", companyName]],
        "Expense Account": [["Account", "root_type", "=", "Expense"], ["Account", "is_group", "=", 1], ["Account", "company", "=", companyName]],
        "Payable": [["Account", "account_type", "=", "Payable"], ["Account", "is_group", "=", 1], ["Account", "company", "=", companyName]]
      };
      const filterToUse = typeFilterMap[accountType] || typeFilterMap["Payable"];
      try {
        const pgRes = await client.get("/api/resource/Account", {
          params: { filters: JSON.stringify(filterToUse), fields: '["name"]', limit: 1 }
        });
        const pgName = pgRes.data && pgRes.data.data && pgRes.data.data[0] && pgRes.data.data[0].name;
        if (pgName) parentAccount = pgName;
      } catch (_) {
      }
      if (!parentAccount) {
        if (accountType === "Bank") parentAccount = "Bank Accounts - " + companyAbbr;
        else if (accountType === "Cash") parentAccount = "Cash In Hand - " + companyAbbr;
        else if (accountType === "Receivable") parentAccount = "Sundry Debtors - " + companyAbbr;
        else if (accountType === "Income Account") parentAccount = "Direct Income - " + companyAbbr;
        else if (accountType === "Expense Account") parentAccount = "Direct Expenses - " + companyAbbr;
        else parentAccount = "Sundry Creditors - " + companyAbbr;
      }
      const GROUP_ACCOUNT_MAP = {
        "Cash-in-Hand": "Cash In Hand - " + companyAbbr,
        "Indirect Incomes": "Indirect Income - " + companyAbbr,
        "Direct Incomes": "Direct Income - " + companyAbbr,
        "Primary": "Current Assets - " + companyAbbr,
        "Sundry Debtors": "Sundry Debtors - " + companyAbbr,
        "Sundry Creditors": "Source of Funds (Liabilities) - " + companyAbbr,
        "Bank Accounts": "Bank Accounts - " + companyAbbr
      };
      if (GROUP_ACCOUNT_MAP[ledgerName]) {
        const mapped = GROUP_ACCOUNT_MAP[ledgerName];
        if (ERP_ACCOUNT_CACHE.has(
          mapped.toLowerCase()
        )) {
          _accountCache.set(
            cacheKey,
            mapped
          );
          return mapped;
        }
      }
      const GROUP_NAMES = [
        "Cash-in-Hand",
        "Indirect Incomes",
        "Direct Incomes",
        "Primary",
        "Bank Accounts",
        "Current Assets",
        "Current Liabilities",
        "Sundry Debtors",
        "Sundry Creditors",
        "Sales Accounts",
        "Purchase Accounts"
      ];
      const doc = {
        doctype: "Account",
        account_name: ledgerName,
        company: companyName,
        is_group: GROUP_NAMES.includes(ledgerName) ? 1 : 0,
        account_type: GROUP_NAMES.includes(ledgerName) ? "" : accountType,
        parent_account: parentAccount
      };
      await client.post("/api/resource/Account", doc);
      ERP_ACCOUNT_CACHE.add(
        suffixed.toLowerCase()
      );
      logger.info('Auto-created missing account: "' + suffixed + '" (type: ' + accountType + ", parent: " + parentAccount + ")");
      _accountTypeMap.set(suffixed, accountType);
      _accountCache.set(cacheKey, suffixed);
      return suffixed;
    } catch (createErr) {
      logger.warn('Could not auto-create account "' + ledgerName + '": ' + parseErpError(createErr) + " \u2014 vouchers referencing this account will fail");
    }
  }
  _accountCache.set(cacheKey, suffixed);
  return suffixed;
}
async function resolveErpNextCompanyPublic(tallyName, creds = {}) {
  try {
    const client = createErpClient(creds);
    return await resolveErpNextCompany(client, tallyName, creds);
  } catch (_) {
    return null;
  }
}
async function pingErpNext(creds = {}) {
  const start = Date.now();
  try {
    const client = createErpClient(creds);
    const res = await client.get("/api/method/frappe.auth.get_logged_user");
    const headers = res.headers || {};
    const limit = headers["x-ratelimit-limit"];
    const remaining = headers["x-ratelimit-remaining"];
    const used = headers["x-ratelimit-used"];
    if (limit) logger.info("Rate limit status \u2014 Limit: " + limit + ", Used: " + used + ", Remaining: " + remaining);
    return { connected: true, user: res.data && res.data.message, latencyMs: Date.now() - start };
  } catch (err) {
    const status = err.response && err.response.status;
    const headers = err.response && err.response.headers;
    if (status === 429 && headers) {
      logger.warn("PING hit 429 \u2014 RateLimit-Limit: " + headers["x-ratelimit-limit"] + ", Remaining: " + headers["x-ratelimit-remaining"] + ", Reset in: " + headers["retry-after"] + "s");
    }
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err.code === "ECONNREFUSED" ? "ERPNext not reachable at " + (creds.url || config.erpnext.url) + " \u2014 make sure the server is running and the URL is correct." : status === 401 ? "Invalid API Key or API Secret \u2014 please check your credentials in Step 1 and try again." : status === 403 ? "Access denied \u2014 your API key does not have permission to access this ERPNext site." : status === 404 ? "ERPNext URL not found \u2014 check that the URL is correct (e.g. https://yoursite.frappe.cloud)." : err.response && err.response.data && err.response.data.exc || err.message
    };
  }
}
function parseErpError(err) {
  const data = err.response && err.response.data;
  const status = err.response && err.response.status;
  if (status === 401) return "Invalid API Key or API Secret \u2014 please check your credentials in the Sync settings.";
  if (status === 403) return "Access denied \u2014 your API key does not have permission to perform this action in ERPNext.";
  if (!data) return err.message || "HTTP " + status;
  if (data._server_messages) {
    try {
      const msgs = JSON.parse(data._server_messages);
      const first = JSON.parse(msgs[0]);
      return first.message || String(first);
    } catch (_) {
      return String(data._server_messages);
    }
  }
  if (data.exception) return data.exception;
  if (data.exc) {
    const lines = data.exc.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines[lines.length - 1] || data.exc;
  }
  if (data.message) return data.message;
  try {
    return "HTTP " + status + ": " + JSON.stringify(data).slice(0, 300);
  } catch (_) {
    return "HTTP " + status;
  }
}
var ERP_ACCOUNT_CACHE = /* @__PURE__ */ new Set();
async function withRetry(fn, label) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await fn();
      _throttle.hit("ok");
      return result;
    } catch (err) {
      const status = err.response && err.response.status;
      const isTransient = !status || [429, 500, 502, 503, 504].includes(status);
      if (!isTransient) throw err;
      lastErr = err;
      _throttle.hit(status);
      let delay;
      if (status === 429) {
        const base2 = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        delay = Math.min(base2, 3e4) + Math.random() * 1500;
      } else {
        delay = RETRY_DELAY_MS * attempt;
      }
      const errDetail = parseErpError(err);
      logger.warn("[" + label + "] attempt " + attempt + "/" + RETRY_ATTEMPTS + " failed (" + (status || "network") + ") \u2014 " + errDetail + " \u2014 retrying in " + Math.round(delay) + "ms");
      await sleep(delay);
    }
  }
  throw lastErr;
}
function _docHash(doc) {
  const stable = JSON.stringify(doc, Object.keys(doc).sort());
  let h = 5381;
  for (let i = 0; i < stable.length; i++) {
    h = (h << 5) + h ^ stable.charCodeAt(i);
    h >>>= 0;
  }
  return h.toString(16);
}
async function upsert(client, doctype2, filters, doc) {
  const searchKey = Object.keys(filters)[0];
  const searchVal = Object.values(filters)[0];
  let existing = null;
  const tallyGuid = doc?.custom_tally_id || filters?.custom_tally_id;
  if (tallyGuid) {
    try {
      const guidList = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
        params: {
          filters: JSON.stringify([["custom_tally_id", "=", tallyGuid]]),
          limit: 1,
          fields: '["name","docstatus"]'
        }
      });
      existing = guidList.data && guidList.data.data && guidList.data.data[0];
    } catch (_) {
    }
    if (!existing) {
      try {
        const guidList2 = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
          params: {
            filters: JSON.stringify({ custom_tally_id: tallyGuid }),
            limit: 1,
            fields: '["name","docstatus"]'
          }
        });
        existing = guidList2.data && guidList2.data.data && guidList2.data.data[0];
      } catch (_) {
      }
    }
  }
  if (!existing) {
    const isParty = doctype2 === "Customer" || doctype2 === "Supplier";
    if (isParty) {
      try {
        const direct = await client.get("/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(searchVal));
        if (direct.data && direct.data.data) {
          existing = { name: searchVal, docstatus: direct.data.data.docstatus || 0 };
        }
      } catch (e) {
        if (e.response && e.response.status !== 404) throw e;
      }
      if (!existing) {
        try {
          const nameField = doctype2 === "Customer" ? "customer_name" : "supplier_name";
          const list = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
            params: {
              filters: JSON.stringify([[nameField, "=", searchVal]]),
              limit: 1,
              fields: '["name","docstatus"]'
            }
          });
          existing = list.data && list.data.data && list.data.data[0];
        } catch (_) {
        }
      }
      if (!existing && doc.custom_tally_alias) {
        try {
          const aliasList = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
            params: {
              filters: JSON.stringify([["custom_tally_alias", "=", doc.custom_tally_alias]]),
              limit: 1,
              fields: '["name","docstatus"]'
            }
          });
          existing = aliasList.data && aliasList.data.data && aliasList.data.data[0];
        } catch (_) {
        }
      }
    } else {
      try {
        const isLikeField = searchKey === "remarks" || searchKey === "user_remark";
        const operator = isLikeField ? "like" : "=";
        const filterVal = isLikeField ? searchVal.split(" | ")[0] + "%" : searchVal;
        const list = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
          params: {
            filters: JSON.stringify([[searchKey, operator, filterVal]]),
            limit: 1,
            fields: '["name","docstatus"]'
          }
        });
        existing = list.data && list.data.data && list.data.data[0];
      } catch (_) {
      }
    }
  }
  if (existing) {
    const targetName = doc.supplier_name || doc.customer_name || doc.item_code || doc.name;
    if (targetName && existing.name !== targetName && (doctype2 === "Customer" || doctype2 === "Supplier" || doctype2 === "Item")) {
      try {
        await client.post("/api/method/frappe.client.rename_doc", {
          doctype: doctype2,
          old_name: existing.name,
          new_name: targetName,
          merge: false
        });
        logger.info(`[RENAME] ${doctype2} renamed in ERPNext: "${existing.name}" \u2192 "${targetName}"`);
        existing.name = targetName;
      } catch (renameErr) {
        const errStr = String(renameErr?.response?.data?.message || renameErr?.message || "");
        if (errStr.includes("already exists")) {
          try {
            await client.post("/api/method/frappe.client.rename_doc", {
              doctype: doctype2,
              old_name: existing.name,
              new_name: targetName,
              merge: true
            });
            logger.info(`[RENAME-MERGE] Merged ${doctype2} "${existing.name}" into "${targetName}"`);
            existing.name = targetName;
          } catch (_) {
            existing.name = targetName;
          }
        } else {
          logger.warn(`[RENAME] Note: ${doctype2} rename skipped: ` + parseErpError(renameErr));
        }
      }
    }
    if (existing.docstatus === 1) {
      const tallyPatchFields = [
        "custom_tally_sales_ledger",
        "custom_tally_party_balance",
        "custom_tally_sales_ledger_balance",
        "custom_tally_voucher_no",
        "custom_tally_id"
      ];
      const patchValues = {};
      for (const f of tallyPatchFields) {
        if (doc[f] !== void 0 && doc[f] !== null) {
          patchValues[f] = doc[f];
        }
      }
      if (Object.keys(patchValues).length > 0) {
        try {
          await client.post("/api/method/frappe.client.set_value", {
            doctype: doctype2,
            name: existing.name,
            fieldname: patchValues
          });
        } catch (patchErr) {
          for (const [fieldname, value] of Object.entries(patchValues)) {
            try {
              await client.post("/api/method/frappe.client.set_value", {
                doctype: doctype2,
                name: existing.name,
                fieldname,
                value
              });
            } catch (singleErr) {
              logger.warn("[set_value] Could not patch " + fieldname + " on " + existing.name + ": " + (singleErr?.response?.data?.message || singleErr?.message || singleErr));
            }
          }
        }
      }
      return { action: "updated", name: existing.name };
    }
    if (doctype2 === "Journal Entry") {
      const newHash = _docHash(doc);
      try {
        const remarkRes = await client.get(
          "/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(existing.name),
          { params: { fields: '["user_remark"]' } }
        );
        const existingRemark = remarkRes?.data?.data?.user_remark || "";
        const hashSuffix = " |h:" + newHash;
        if (existingRemark.includes(hashSuffix)) {
          return { action: "skipped", name: existing.name };
        }
        doc = Object.assign({}, doc, { user_remark: (doc.user_remark || "") + hashSuffix });
      } catch (_) {
      }
    }
    await client.put(
      "/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(existing.name),
      Object.assign({}, doc, { doctype: doctype2, name: existing.name })
    );
    logger.info(`[UPSERT] ${doctype2} updated: ${existing.name} (Tally GUID: ${tallyGuid || "N/A"})`);
    return { action: "updated", name: existing.name };
  }
  if (doctype2 === "Journal Entry" && doc.user_remark !== void 0) {
    const newHash = _docHash(doc);
    doc = Object.assign({}, doc, { user_remark: (doc.user_remark || "") + " |h:" + newHash });
  }
  try {
    const res = await client.post("/api/resource/" + encodeURIComponent(doctype2), Object.assign({}, doc, { doctype: doctype2 }));
    const createdName = res.data && res.data.data && res.data.data.name;
    logger.info(`[UPSERT] ${doctype2} created: ${createdName} (Tally GUID: ${tallyGuid || "N/A"})`);
    return { action: "created", name: createdName };
  } catch (postErr) {
    const errMsg = String(postErr?.response?.data?.message || postErr?.message || "");
    const isDup = postErr?.response?.data?.exc_type === "DuplicateEntryError" || errMsg.includes("already exists") || postErr?.response?.status === 409;
    if (isDup) {
      const docName = doc.name || doc.customer_name || doc.supplier_name || doc.item_code || searchVal;
      logger.info(`[UPSERT] ${doctype2} "${docName}" already exists upon POST, updating via PUT instead`);
      await client.put(
        "/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(docName),
        Object.assign({}, doc, { doctype: doctype2, name: docName })
      );
      return { action: "updated", name: docName };
    }
    throw postErr;
  }
}
async function batchSync(client, doctype2, items, mapper, progressCb, postUpsertHook = null) {
  let created = 0, updated = 0, failed = 0, skipped = 0;
  const errors = [];
  const failedItems = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    checkCancelled(doctype2);
    const chunk = items.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(async (item) => {
        const { filters, doc } = await mapper(item);
        return withRetry(() => upsert(client, doctype2, filters, doc), doctype2 + ":" + item.name);
      })
    );
    for (let j = 0; j < results.length; j++) {
      const item = chunk[j];
      const r = results[j];
      if (r.status === "fulfilled") {
        if (r.value.action === "created") created++;
        else if (r.value.action === "skipped") skipped++;
        else updated++;
        if (postUpsertHook && r.value.name && r.value.action !== "skipped") {
          try {
            await postUpsertHook(r.value.name);
          } catch (hookErr) {
            failed++;
            if (r.value.action === "created") created--;
            else updated--;
            errors.push({ item: item.name || i + j, error: "Submit failed: " + (hookErr.message || "Unknown error") });
          }
        }
        if (r.value.name) item.erpName = r.value.name;
      } else {
        const err = r.reason;
        const status = err.response && err.response.status;
        const isDuplicate = err.response?.data?.exc_type === "DuplicateEntryError";
        const isPermFail = isDuplicate || status && status >= 400 && status < 500 && status !== 429;
        if (isPermFail) {
          failed++;
          const msg = isDuplicate ? "Duplicate: " + item.name : parseErpError(err);
          errors.push({ item: item.name || i + j, error: msg });
          if (errors.length <= 5) logger.warn("ERPNext sync error [" + doctype2 + "]: " + msg);
        } else {
          failedItems.push(item);
        }
      }
    }
    if (progressCb) progressCb(Math.min(i + CONCURRENCY, items.length), items.length);
    await sleep(_throttle.delay());
    const processed = i + CONCURRENCY;
    if (processed % (BATCH_BURST * CONCURRENCY) < CONCURRENCY) {
      const burstPause = BATCH_BURST_MS + _throttle.extraDelayMs;
      logger.info("[" + doctype2 + "] " + Math.min(processed, items.length) + "/" + items.length + " synced - pausing " + burstPause + "ms" + (_throttle.extraDelayMs > 0 ? " (throttled +" + _throttle.extraDelayMs + "ms)" : ""));
      await sleep(burstPause);
    }
  }
  if (failedItems.length > 0) {
    logger.info("[" + doctype2 + "] Final pass: retrying " + failedItems.length + " transient failures (serial, 2s gap)");
    _throttle.reset();
    await sleep(5e3);
    for (const item of failedItems) {
      const { filters, doc } = await mapper(item);
      try {
        const result = await withRetry(() => upsert(client, doctype2, filters, doc), doctype2 + ":" + item.name + " [final]");
        if (result.action === "created") created++;
        else if (result.action === "skipped") skipped++;
        else updated++;
        if (postUpsertHook && result.name && result.action !== "skipped") {
          try {
            await postUpsertHook(result.name);
          } catch (hookErr) {
            failed++;
            if (result.action === "created") created--;
            else updated--;
            errors.push({ item: item.name || "retry", error: "Submit failed: " + (hookErr.message || "Unknown error") });
          }
        }
      } catch (err) {
        failed++;
        const isDuplicate = err.response?.data?.exc_type === "DuplicateEntryError";
        const msg = isDuplicate ? "Duplicate: " + item.name : parseErpError(err);
        errors.push({ item: item.name, error: msg });
        logger.warn("ERPNext sync error [" + doctype2 + "] (final pass): " + msg);
      }
      await sleep(2e3);
    }
  }
  return { created, updated, skipped, failed, errors: errors.slice(0, 20) };
}
var _knownCustomFields = /* @__PURE__ */ new Set();
async function ensureCustomFieldOnDoctype(client, dt, fieldname, label, fieldtype = "Data") {
  const cacheKey = dt + "::" + fieldname;
  if (_knownCustomFields.has(cacheKey)) return;
  try {
    const existing = await client.get("/api/resource/Custom Field", {
      params: {
        filters: JSON.stringify([["Custom Field", "dt", "=", dt], ["Custom Field", "fieldname", "=", fieldname]]),
        fields: '["name"]',
        limit: 1
      }
    });
    if ((existing?.data?.data || []).length > 0) {
      _knownCustomFields.add(cacheKey);
      return;
    }
    await client.post("/api/resource/Custom Field", {
      doctype: "Custom Field",
      dt,
      fieldname,
      label,
      fieldtype,
      read_only: 1
    });
    _knownCustomFields.add(cacheKey);
    logger.human ? logger.human.headsUp(`A new field "${label}" was found in Tally and has been created in ERPNext under ${doctype}.`) : logger.info(`Auto-created custom field: ${dt}.${fieldname}`);
  } catch (_) {
    _knownCustomFields.add(cacheKey);
  }
}
async function ensureAccountFields(client) {
  for (const field of ACCOUNT_CUSTOM_FIELDS) {
    try {
      const existing = await client.get(
        "/api/resource/Custom Field",
        {
          params: {
            filters: JSON.stringify([
              ["dt", "=", "Account"],
              ["fieldname", "=", field.fieldname]
            ]),
            limit_page_length: 1
          }
        }
      );
      if (existing.data.data.length) {
        continue;
      }
      await client.post(
        "/api/resource/Custom Field",
        {
          dt: "Account",
          fieldname: field.fieldname,
          label: field.label,
          fieldtype: field.fieldtype,
          insert_after: field.insert_after || "",
          hidden: 0,
          read_only: 0
        }
      );
      console.log("Created:", field.fieldname);
    } catch (e) {
      console.log(
        "Field Error:",
        field.fieldname,
        e?.response?.data || e.message
      );
    }
  }
}
async function syncLedgersToErpNext(ledgers, creds = {}) {
  const client = createErpClient(creds);
  await ensureAccountFields(
    client
  );
  await ensureTallyCustomFields(
    client
  );
  await ensureIndiaAddressTemplate(client);
  logger.info(
    "Syncing " + ledgers.length + " ledgers to ERPNext"
  );
  await resolveGroups(client);
  const DEBTOR_KEYS = ["sundry debtor", "debtor", "receivable", "accounts receivable"];
  const CREDITOR_KEYS = ["sundry creditor", "creditor", "payable", "accounts payable"];
  const SKIP_KEYS = [
    // Balance sheet — asset
    "cash-in-hand",
    "cash in hand",
    "bank account",
    "bank od",
    "bank accounts",
    "fixed assets",
    "investments",
    "deposits (asset)",
    "loans & advances (asset)",
    "current assets",
    "stock-in-hand",
    "misc. expenses (asset)",
    // Balance sheet — liability / equity
    "capital account",
    "reserves",
    "retained",
    "profit & loss",
    "profit and loss",
    "loans (liability)",
    "bank od & od accounts",
    "current liabilities",
    "provisions",
    "suspense",
    "primary",
    "branch / divisions",
    "share application",
    "share capital",
    "unsecured loans",
    "secured loans",
    "duties & taxes",
    "duties and taxes",
    // Tax-specific sub-groups
    "gst",
    "input gst",
    "output gst",
    "igst",
    "cgst",
    "sgst",
    "tds",
    "tcs",
    "income tax",
    "tax",
    // P&L
    "indirect income",
    "direct income",
    "indirect expenses",
    "direct expenses",
    "purchase accounts",
    "sales account",
    "sales accounts",
    "manufacturing expenses",
    "depreciation",
    "deferred",
    // Fixed-asset sub-groups (physical items — definitely not parties)
    "air conditioner",
    "laptop",
    "computer",
    "mobile phone",
    "mobile phones",
    "furniture",
    "machinery",
    "motor",
    "vehicle",
    "water ro",
    "fridge",
    "television",
    "refrigirator",
    "server",
    "ups",
    "motoar bike",
    // Additional asset groups seen in data
    "microwave",
    "refrigerator",
    "washing machine",
    "printer"
  ];
  const isDebtor = (l) => DEBTOR_KEYS.some((k) => (l.parentGroup || "").toLowerCase().includes(k));
  const isCreditor = (l) => CREDITOR_KEYS.some((k) => (l.parentGroup || "").toLowerCase().includes(k));
  const isSkip = (l) => SKIP_KEYS.some((k) => (l.parentGroup || "").toLowerCase().includes(k));
  const isUnknownGroup = (l) => !isDebtor(l) && !isCreditor(l) && !isSkip(l) && !looksLikeAsset(l.name);
  const customers = ledgers.filter((l) => isDebtor(l) && !isSkip(l));
  const suppliers = ledgers.filter((l) => isCreditor(l) && !isSkip(l));
  const TRULY_SKIP_KEYS = [
    "primary",
    "profit & loss",
    "profit and loss"
  ];
  const isTrulySkip = (l) => {
    const pg = (l.parentGroup || "").toLowerCase();
    const name = (l.name || "").toLowerCase();
    return TRULY_SKIP_KEYS.some((k) => pg.includes(k) || name.includes(k));
  };
  const accounts = ledgers.filter((l) => {
    if (isDebtor(l)) return false;
    if (isCreditor(l)) return false;
    if (isTrulySkip(l)) return false;
    if (looksLikeAsset(l.name)) return false;
    return true;
  });
  const companyName = await resolveErpNextCompany(
    client,
    creds.companyName || "Default Company",
    creds
  );
  const skipped = ledgers.filter((l) => isSkip(l) || looksLikeAsset(l.name)).length;
  logger.info("Ledger breakdown - customers: " + customers.length + ", suppliers: " + suppliers.length + ", skipped (GL-only groups): " + skipped);
  const customerMapper = async (l) => {
    l.name = (l.name || "").trim();
    const hasGstin = !!(l.gstin && l.gstin.trim().length > 5);
    const isBusiness = hasGstin || DEBTOR_KEYS.some((k) => (l.parentGroup || "").toLowerCase().includes(k));
    const doc = {
      customer_name: l.name,
      customer_type: isBusiness ? "Company" : "Individual",
      custom_tally_gst_registration_type: l.registrationType || "",
      custom_tally_place_of_supply: l.placeOfSupply || l.state || "",
      custom_tally_is_transporter: l.isTransporter || "Undefined",
      custom_tally_transporter_id: l.transporterId || "Undefined",
      custom_tally_bank_transaction_type: l.bankTransactionType || "Undefined",
      custom_tally_upi_id: l.upiId || "Undefined",
      custom_tally_popup_bank_account_no: l.popupBankAccountNo || "Undefined",
      custom_tally_popup_ifsc_code: l.popupIfscCode || "Undefined",
      custom_tally_popup_bank_name: l.popupBankName || "Undefined",
      customer_group: _customerGroup,
      territory: await resolveTerritory(client, l.state),
      default_currency: "INR",
      custom_tally_id: l.guid || l.masterID || "",
      // FIX: Tally GUID
      custom_tally_group: l.parentGroup || "",
      custom_tally_under_group: l.parentGroup || "",
      // FIX: Tally parent group
      custom_source: "Tally"
      // FIX: sync origin marker
    };
    doc.custom_tally_gstin = (l.gstin || "").trim();
    doc.custom_tally_pan = (l.pan || "").trim().toUpperCase();
    doc.email_id = (l.email || "").trim();
    doc.mobile_no = (l.phone || "").trim();
    doc.custom_tally_bank_account_no = (l.bankAccount || "").trim();
    doc.custom_tally_bank_account_no = (l.bankAccount || "").trim();
    doc.custom_tally_ifsc_code = (l.ifsc || "").trim();
    doc.custom_tally_swift_code = (l.swiftCode || "").trim();
    doc.custom_tally_bank_name = (l.bankName || "").trim();
    doc.custom_tally_ac_holder_name = (l.holderName || "").trim();
    doc.custom_tally_bank_branch = (l.bankBranch || "").trim();
    doc.custom_tally_bsr_code = (l.bsrCode || "").trim();
    doc.custom_tally_alias = (l.alias || "").trim();
    doc.custom_tally_msme_type = (l.msmeType || "").trim();
    doc.custom_tally_udyam_no = (l.udyamNo || "").trim();
    doc.custom_tally_msme_activity = (l.msmeActivity || "").trim();
    doc.custom_tally_credit_limit = l.creditLimit || "";
    doc.custom_tally_credit_days = l.creditDays || "";
    doc.custom_tally_credit_check = l.isCreditCheck || "";
    doc.custom_tally_override_credit_limit = l.isOverrideCreditLimit || "";
    if (l.isTdsDeductable !== void 0)
      doc.custom_tally_is_tds_deductable = l.isTdsDeductable ? "Yes" : "No";
    if (l.isTcsApplicable !== void 0)
      doc.custom_tally_is_tcs_applicable = l.isTcsApplicable ? "Yes" : "No";
    const safeOB = (v) => {
      const n = Number(v);
      return isFinite(n) && !isNaN(n) ? n : null;
    };
    const obVal = safeOB(l.openingBalance);
    if (obVal !== null && obVal !== 0) {
      doc.custom_tally_opening_balance = Math.min(Math.abs(obVal), 999999999);
      doc.custom_tally_opening_balance_type = obVal < 0 ? "Dr" : "Cr";
    }
    const cbVal = safeOB(l.closingBalance);
    if (cbVal !== null && cbVal !== 0) {
      doc.custom_tally_closing_balance = Math.min(Math.abs(cbVal), 999999999);
      doc.custom_tally_closing_balance_type = cbVal < 0 ? "Dr" : "Cr";
    }
    if (l.customFields) {
      for (const [key, value] of Object.entries(l.customFields)) {
        const erpField = "custom_tally_" + key.toLowerCase().replace(/[^a-z0-9]/g, "_");
        doc[erpField] = String(value).slice(0, 255);
      }
    }
    return { filters: { customer_name: l.name }, doc, _ledger: l };
  };
  const supplierMapper = (l) => {
    l.name = (l.name || "").trim();
    const hasGstin = !!(l.gstin && l.gstin.trim().length > 5);
    const doc = {
      supplier_name: l.name,
      supplier_type: hasGstin ? "Company" : "Individual",
      custom_tally_gst_registration_type: l.registrationType || "",
      custom_tally_place_of_supply: l.placeOfSupply || l.state || "",
      custom_tally_is_transporter: l.isTransporter || "Undefined",
      custom_tally_transporter_id: l.transporterId || "Undefined",
      ...l.bankTransactionType && {
        custom_tally_bank_transaction_type: l.bankTransactionType
      },
      ...l.upiId && {
        custom_tally_upi_id: l.upiId
      },
      ...l.popupBankAccountNo && {
        custom_tally_popup_bank_account_no: l.popupBankAccountNo
      },
      ...l.popupIfscCode && {
        custom_tally_popup_ifsc_code: l.popupIfscCode
      },
      ...l.popupBankName && {
        custom_tally_popup_bank_name: l.popupBankName
      },
      /////////////
      supplier_group: _supplierGroup,
      country: "India",
      default_currency: "INR",
      custom_tally_id: l.guid || l.masterID || "",
      // FIX: Tally GUID
      custom_tally_group: l.parentGroup || "",
      custom_tally_under_group: l.parentGroup || "",
      // FIX: Tally parent group
      custom_source: "Tally"
      // FIX: sync origin marker
    };
    doc.custom_tally_gstin = (l.gstin || "").trim();
    doc.custom_tally_pan = (l.pan || "").trim().toUpperCase();
    doc.email_id = (l.email || "").trim();
    doc.mobile_no = (l.phone || "").trim();
    if (l.msmeType)
      doc.custom_tally_msme_type = l.msmeType;
    if (l.udyamNo)
      doc.custom_tally_udyam_no = l.udyamNo;
    if (l.msmeActivity)
      doc.custom_tally_msme_activity = l.msmeActivity;
    doc.custom_tally_bank_account_no = (l.bankAccount || "").trim();
    doc.custom_tally_ifsc_code = (l.ifsc || "").trim();
    doc.custom_tally_swift_code = (l.swiftCode || "").trim();
    doc.custom_tally_bank_name = (l.bankName || "").trim();
    doc.custom_tally_ac_holder_name = (l.holderName || "").trim();
    doc.custom_tally_bank_branch = (l.bankBranch || "").trim();
    doc.custom_tally_bsr_code = (l.bsrCode || "").trim();
    doc.custom_tally_alias = (l.alias || "").trim();
    doc.custom_tally_credit_limit = l.creditLimit !== void 0 ? l.creditLimit : "";
    doc.custom_tally_credit_days = l.creditDays !== void 0 && l.creditDays !== null ? String(l.creditDays) : "";
    doc.custom_tally_credit_check = l.isCreditCheck !== void 0 ? l.isCreditCheck ? "Yes" : "No" : "";
    doc.custom_tally_override_credit_limit = l.isOverrideCreditLimit !== void 0 ? l.isOverrideCreditLimit ? "Yes" : "No" : "";
    if (l.isTdsDeductable !== void 0)
      doc.custom_tally_is_tds_deductable = l.isTdsDeductable ? "Yes" : "No";
    if (l.isTcsApplicable !== void 0)
      doc.custom_tally_is_tcs_applicable = l.isTcsApplicable ? "Yes" : "No";
    const safeOB = (v) => {
      const n = Number(v);
      return isFinite(n) && !isNaN(n) ? n : null;
    };
    const obVal = safeOB(l.openingBalance);
    if (obVal !== null && obVal !== 0) {
      doc.custom_tally_opening_balance = Math.min(Math.abs(obVal), 999999999);
      doc.custom_tally_opening_balance_type = obVal < 0 ? "Dr" : "Cr";
    }
    const cbVal = safeOB(l.closingBalance);
    if (cbVal !== null && cbVal !== 0) {
      doc.custom_tally_closing_balance = Math.min(Math.abs(cbVal), 999999999);
      doc.custom_tally_closing_balance_type = cbVal < 0 ? "Dr" : "Cr";
    }
    if (l.customFields) {
      for (const [key, value] of Object.entries(l.customFields)) {
        const erpField = "custom_tally_" + key.toLowerCase().replace(/[^a-z0-9]/g, "_");
        doc[erpField] = String(value).slice(0, 255);
      }
    }
    return { filters: { supplier_name: l.name }, doc, _ledger: l };
  };
  const accountMapper = async (l) => {
    l.name = (l.name || "").trim();
    const companyName2 = await resolveErpNextCompany(
      client,
      creds.companyName || "Default Company",
      creds
    );
    const companyAbbr = await getCompanyAbbr(client, companyName2);
    const group = (l.parentGroup || "").toLowerCase();
    let rootType = "Asset";
    let reportType = "Balance Sheet";
    if (group.includes("income") || group.includes("sales")) {
      rootType = "Income";
      reportType = "Profit and Loss";
    } else if (group.includes("expense") || group.includes("purchase")) {
      rootType = "Expense";
      reportType = "Profit and Loss";
    } else if (group.includes("liability") || group.includes("capital") || group.includes("loan") || group.includes("creditor") || group.includes("payable")) {
      rootType = "Liability";
      reportType = "Balance Sheet";
    } else {
      rootType = "Asset";
      reportType = "Balance Sheet";
    }
    let accountType = "";
    if (group.includes("bank")) {
      accountType = "Bank";
    } else if (group.includes("cash")) {
      accountType = "Cash";
    } else if (group.includes("debtor") || group.includes("receivable")) {
      accountType = "Receivable";
    } else if (group.includes("creditor") || group.includes("payable")) {
      accountType = "Payable";
    }
    const TALLY_PARENT_NAME_MAP = {
      "indirect incomes": "Indirect Income",
      "direct incomes": "Direct Income",
      "indirect income": "Indirect Income",
      "sales accounts": "Sales Accounts",
      "purchase accounts": "Purchase Accounts",
      "cash-in-hand": "Cash In Hand",
      "bank accounts": "Bank Accounts",
      "sundry debtors": "Sundry Debtors",
      "sundry creditors": "Sundry Creditors",
      "capital account": "Capital Account",
      "current assets": "Current Assets",
      "current liabilities": "Current Liabilities"
    };
    const parentGroupKey = (l.parentGroup || "").trim().toLowerCase();
    const mappedParentName = TALLY_PARENT_NAME_MAP[parentGroupKey] || l.parentGroup;
    let parentAccount = await resolveAccount(
      client,
      mappedParentName,
      companyAbbr,
      companyName2
    );
    if (!parentAccount) {
      parentAccount = rootType === "Income" ? "Direct Income - " + companyAbbr : rootType === "Expense" ? "Direct Expenses - " + companyAbbr : rootType === "Liability" ? "Current Liabilities - " + companyAbbr : "Current Assets - " + companyAbbr;
    }
    const doc = {
      account_name: l.name,
      company: companyName2,
      parent_account: parentAccount,
      root_type: rootType,
      report_type: reportType,
      account_type: accountType,
      is_group: 0,
      custom_tally_under_group: l.parentGroup || "",
      custom_tally_alias: l.alias || "",
      custom_tally_id: l.guid || l.masterID || "",
      custom_source: "Tally"
    };
    if (l.gstin) doc.custom_tally_gstin = l.gstin;
    if (l.pan) doc.custom_tally_pan = l.pan;
    if (l.address) doc.custom_tally_address = l.address;
    if (l.phone) doc.custom_tally_mobile = l.phone;
    if (l.country) doc.custom_tally_country = l.country;
    if (l.state) doc.custom_tally_state = l.state;
    if (l.pincode) doc.custom_tally_pincode = l.pincode;
    if (l.hsnCode) doc.custom_tally_hsn_code = l.hsnCode;
    if (l.gstRate) doc.custom_tally_gst_rate = l.gstRate;
    if (l.taxability) doc.custom_tally_taxability = l.taxability;
    if (l.typeOfSupply) doc.custom_tally_type_of_supply = l.typeOfSupply;
    const safeOB = (v) => {
      const n = Number(v);
      return isFinite(n) && !isNaN(n) ? n : null;
    };
    const obVal = safeOB(l.openingBalance);
    if (obVal !== null && obVal !== 0) {
      doc.custom_tally_opening_balance = Math.min(Math.abs(obVal), 999999999);
      doc.custom_tally_opening_balance_type = obVal < 0 ? "Dr" : "Cr";
    }
    const cbVal = safeOB(l.closingBalance);
    if (cbVal !== null && cbVal !== 0) {
      doc.custom_tally_closing_balance = Math.min(Math.abs(cbVal), 999999999);
      doc.custom_tally_closing_balance_type = cbVal < 0 ? "Dr" : "Cr";
    }
    return {
      filters: {
        account_name: l.name,
        company: companyName2
      },
      doc,
      _ledger: l
    };
  };
  const allCustomKeys = /* @__PURE__ */ new Set();
  for (const l of [...customers, ...suppliers]) {
    if (l.customFields) Object.keys(l.customFields).forEach((k) => allCustomKeys.add(k));
  }
  for (const key of allCustomKeys) {
    const fieldname = "custom_tally_" + key.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const label = "Tally " + key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " ");
    await ensureCustomFieldOnDoctype(client, "Customer", fieldname, label);
    await ensureCustomFieldOnDoctype(client, "Supplier", fieldname, label);
    await sleep(200);
  }
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_gstin",
    "Tally GSTIN"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_pan",
    "Tally PAN"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_address",
    "Tally Address"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_mobile",
    "Tally Mobile"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_country",
    "Tally Country"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_state",
    "Tally State"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_pincode",
    "Tally Pincode"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_hsn_code",
    "Tally HSN Code"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_gst_rate",
    "Tally GST Rate"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_taxability",
    "Tally Taxability"
  );
  await ensureCustomFieldOnDoctype(
    client,
    "Account",
    "custom_tally_type_of_supply",
    "Tally Type Of Supply"
  );
  const FORCE_RECHECK_FIELDS = [
    "custom_tally_credit_limit",
    "custom_tally_credit_days",
    "custom_tally_credit_check",
    "custom_tally_override_credit_limit",
    "custom_tally_gst_section",
    "custom_tally_credit_section",
    "custom_tally_statutory_section",
    "custom_tally_bank_section",
    "custom_tally_msme_section",
    "custom_tally_is_tds_deductable",
    "custom_tally_is_tcs_applicable",
    "custom_tally_gstin",
    "custom_tally_pan",
    "custom_tally_msme_type",
    "custom_tally_udyam_no",
    "custom_tally_msme_activity",
    "custom_tally_alias",
    "custom_tally_under_group",
    "custom_tally_address",
    "custom_tally_mobile",
    "custom_tally_country",
    "custom_tally_pincode",
    "custom_tally_hsn_code",
    "custom_tally_gst_rate",
    "custom_tally_taxability",
    "custom_tally_type_of_supply",
    "custom_tally_bank_transaction_type",
    "custom_tally_upi_id",
    "custom_tally_popup_bank_account_no",
    "custom_tally_popup_ifsc_code",
    "custom_tally_popup_bank_name",
    // ADD THESE AT THE END (before the closing ];):
    "custom_tally_opening_balance",
    "custom_tally_opening_balance_type",
    "custom_tally_closing_balance",
    "custom_tally_closing_balance_type",
    "custom_opening_balance_section"
  ];
  for (const doctype2 of ["Customer", "Supplier", "Account"]) {
    for (const fieldname of FORCE_RECHECK_FIELDS) {
      _knownCustomFields.delete(doctype2 + "::" + fieldname);
    }
  }
  const BANK_CUSTOM_FIELDS = [
    // ===============================
    // BASIC DETAILS
    // ===============================
    {
      fieldname: "custom_tally_alias",
      label: "Tally Alias",
      fieldtype: "Data",
      insert_after: "customer_type"
    },
    {
      fieldname: "custom_tally_under_group",
      label: "Tally Under Group",
      fieldtype: "Data",
      insert_after: "custom_tally_alias"
    },
    // ===============================
    // GST REGISTRATION DETAILS
    // ===============================
    {
      fieldname: "custom_tally_gst_section",
      label: "GST Registration Details",
      fieldtype: "Section Break",
      insert_after: "territory"
    },
    {
      fieldname: "custom_tally_gst_registration_type",
      label: "Tally GST Registration Type",
      fieldtype: "Data",
      insert_after: "custom_tally_gst_section"
    },
    {
      fieldname: "custom_tally_place_of_supply",
      label: "Tally Place Of Supply",
      fieldtype: "Data",
      insert_after: "custom_tally_gst_registration_type"
    },
    {
      fieldname: "custom_tally_gst_state",
      label: "Tally GST State",
      fieldtype: "Data",
      insert_after: "custom_tally_place_of_supply"
    },
    {
      fieldname: "custom_tally_is_transporter",
      label: "Tally Is Transporter",
      fieldtype: "Data",
      insert_after: "custom_tally_gst_state"
    },
    {
      fieldname: "custom_tally_transporter_id",
      label: "Tally Transporter ID",
      fieldtype: "Data",
      insert_after: "custom_tally_is_transporter"
    },
    {
      fieldname: "custom_tally_pan",
      label: "Tally PAN",
      fieldtype: "Data",
      insert_after: "custom_tally_transporter_id"
    },
    {
      fieldname: "custom_tally_gstin",
      label: "Tally GSTIN",
      fieldtype: "Data",
      insert_after: "custom_tally_pan"
    },
    // ===============================
    // CREDIT DETAILS
    // ===============================
    {
      fieldname: "custom_tally_credit_section",
      label: "Tally Credit Details",
      fieldtype: "Section Break",
      insert_after: "custom_tally_gstin"
    },
    {
      fieldname: "custom_tally_credit_limit",
      label: "Tally Credit Limit",
      fieldtype: "Currency",
      insert_after: "custom_tally_credit_section"
    },
    {
      fieldname: "custom_tally_credit_days",
      label: "Tally Credit Days",
      fieldtype: "Int",
      insert_after: "custom_tally_credit_limit"
    },
    {
      fieldname: "custom_tally_credit_check",
      label: "Tally Credit Check",
      fieldtype: "Data",
      insert_after: "custom_tally_credit_days"
    },
    {
      fieldname: "custom_tally_override_credit_limit",
      label: "Tally Override Credit Limit",
      fieldtype: "Data",
      insert_after: "custom_tally_credit_check"
    },
    // ===============================
    // STATUTORY DETAILS
    // ===============================
    {
      fieldname: "custom_tally_statutory_section",
      label: "Tally Statutory Details",
      fieldtype: "Section Break",
      insert_after: "custom_tally_override_credit_limit"
    },
    {
      fieldname: "custom_tally_is_tds_deductable",
      label: "Tally Is TDS Deductable",
      fieldtype: "Data",
      insert_after: "custom_tally_statutory_section"
    },
    {
      fieldname: "custom_tally_is_tcs_applicable",
      label: "Tally Is TCS Applicable",
      fieldtype: "Data",
      insert_after: "custom_tally_is_tds_deductable"
    },
    // ===============================
    // BANK DETAILS
    // ===============================
    {
      fieldname: "custom_tally_bank_section",
      label: "Tally Bank Details",
      fieldtype: "Section Break",
      insert_after: "custom_tally_is_tcs_applicable"
    },
    {
      fieldname: "custom_tally_bank_transaction_type",
      label: "Tally Bank Transaction Type",
      fieldtype: "Data",
      insert_after: "custom_tally_bank_section"
    },
    {
      fieldname: "custom_tally_upi_id",
      label: "Tally UPI ID",
      fieldtype: "Data",
      insert_after: "custom_tally_bank_transaction_type"
    },
    {
      fieldname: "custom_tally_popup_bank_account_no",
      label: "Tally Popup Bank Account No",
      fieldtype: "Data",
      insert_after: "custom_tally_upi_id"
    },
    {
      fieldname: "custom_tally_popup_ifsc_code",
      label: "Tally Popup IFSC Code",
      fieldtype: "Data",
      insert_after: "custom_tally_popup_bank_account_no"
    },
    {
      fieldname: "custom_tally_popup_bank_name",
      label: "Tally Popup Bank Name",
      fieldtype: "Data",
      insert_after: "custom_tally_popup_ifsc_code"
    },
    // ===============================
    // MSME DETAILS
    // ===============================
    {
      fieldname: "custom_tally_msme_section",
      label: "Tally MSME Details",
      fieldtype: "Section Break",
      insert_after: "custom_tally_popup_bank_name"
    },
    {
      fieldname: "custom_tally_msme_type",
      label: "Tally MSME Type",
      fieldtype: "Data",
      insert_after: "custom_tally_msme_section"
    },
    {
      fieldname: "custom_tally_udyam_no",
      label: "Tally UDYAM Registration No",
      fieldtype: "Data",
      insert_after: "custom_tally_msme_type"
    },
    {
      fieldname: "custom_tally_msme_activity",
      label: "Tally MSME Activity Type",
      fieldtype: "Data",
      insert_after: "custom_tally_udyam_no"
    },
    {
      fieldname: "custom_opening_balance_section",
      label: "Opening Balance",
      fieldtype: "Section Break",
      insert_after: "custom_tally_msme_activity"
      // ← correct — comes after MSME section
    },
    // ADD AT END OF BANK_CUSTOM_FIELDS array:
    {
      fieldname: "custom_tally_opening_balance",
      label: "Opening Balance",
      fieldtype: "Float",
      // ← change Currency to Float
      insert_after: "custom_opening_balance_section"
    },
    {
      fieldname: "custom_tally_opening_balance_type",
      label: "Opening Balance Dr/Cr",
      fieldtype: "Data",
      insert_after: "custom_tally_opening_balance"
    },
    // ADD THIS before custom_tally_closing_balance:
    {
      fieldname: "custom_ob_col_1",
      fieldtype: "Column Break",
      insert_after: "custom_tally_opening_balance_type"
    },
    {
      fieldname: "custom_tally_closing_balance",
      label: "Closing Balance",
      fieldtype: "Float",
      // ← change Currency to Float
      insert_after: "custom_ob_col_1"
    },
    {
      fieldname: "custom_tally_closing_balance_type",
      label: "Closing Balance Dr/Cr",
      fieldtype: "Data",
      insert_after: "custom_tally_closing_balance"
    }
    // ← ADD
  ];
  for (const {
    fieldname,
    label,
    fieldtype,
    in_list_view,
    insert_after
  } of BANK_CUSTOM_FIELDS) {
    for (const doctype2 of ["Customer", "Supplier"]) {
      const ck = doctype2 + "::" + fieldname;
      if (!_knownCustomFields.has(ck)) {
        try {
          const ex = await client.get("/api/resource/Custom Field", {
            params: { filters: JSON.stringify([["Custom Field", "dt", "=", doctype2], ["Custom Field", "fieldname", "=", fieldname]]), fields: '["name","in_list_view"]', limit: 1 }
          });
          const rows = ex?.data?.data || [];
          const actualInsertAfter = doctype2 === "Customer" ? insert_after : insert_after === "customer_type" ? "supplier_type" : insert_after === "territory" ? "supplier_group" : insert_after;
          if (rows.length > 0) {
            await client.put(
              "/api/resource/Custom Field/" + encodeURIComponent(rows[0].name),
              {
                label,
                fieldtype: fieldtype || "Data",
                in_list_view: in_list_view || 0,
                insert_after: actualInsertAfter || (doctype2 === "Customer" ? "territory" : "supplier_group")
              }
            ).catch(() => {
            });
          } else {
            await client.post("/api/resource/Custom Field", {
              doctype: "Custom Field",
              dt: doctype2,
              fieldname,
              label,
              fieldtype: fieldtype || "Data",
              in_list_view: in_list_view || 0,
              insert_after: actualInsertAfter || (doctype2 === "Customer" ? "territory" : "supplier_group")
            });
          }
          _knownCustomFields.add(ck);
        } catch (e) {
          logger.error(
            "[CUSTOM FIELD ERROR] " + doctype2 + "." + fieldname + " => " + parseErpError(e)
          );
          _knownCustomFields.add(ck);
        }
        await sleep(150);
      }
    }
  }
  const customerResults = await batchSync(client, "Customer", customers, customerMapper);
  const supplierResults = await batchSync(client, "Supplier", suppliers, supplierMapper);
  const accountResults = await batchSync(
    client,
    "Account",
    accounts,
    accountMapper
  );
  logger.info(
    "Accounts synced: " + (accountResults.created + accountResults.updated)
  );
  const failedPartyNames = /* @__PURE__ */ new Set([
    ...customerResults.errors.map((e) => String(e.item || "")),
    ...supplierResults.errors.map((e) => String(e.item || ""))
  ]);
  const partiesWithAddr = [
    ...customers.map((l) => ({ l, type: "Customer" })),
    ...suppliers.map((l) => ({ l, type: "Supplier" }))
  ].filter(
    ({ l }) => !failedPartyNames.has(l.name)
    // only skip parties that failed to create
  );
  if (partiesWithAddr.length > 0) {
    logger.info("Syncing addresses/contacts for " + partiesWithAddr.length + " parties from Tally");
    for (let i = 0; i < partiesWithAddr.length; i += ADDR_CONCURRENCY) {
      const slice = partiesWithAddr.slice(i, i + ADDR_CONCURRENCY);
      await Promise.allSettled(slice.map(async ({ l, type }) => {
        await ensureAddress(client, l.name, type, l);
        await ensureContact(client, l.name, type, l);
      }));
      await sleep(500);
    }
    logger.info("Address/contact sync done");
  }
  logger.success(
    "Ledger sync done - customers: +" + customerResults.created + " created, ~" + customerResults.updated + " updated, x" + customerResults.failed + " failed | suppliers: +" + supplierResults.created + " created, ~" + supplierResults.updated + " updated, x" + supplierResults.failed + " failed"
  );
  const finalResult = {
    customers: customerResults,
    suppliers: supplierResults,
    accounts: accountResults,
    skipped
  };
  globalThis._lastLedgerSyncResult = finalResult;
  return finalResult;
}
async function ensureHsnNotMandatory(client) {
  try {
    const psName = "Item-gst_hsn_code-reqd";
    try {
      await client.put("/api/resource/Property Setter/" + encodeURIComponent(psName), { value: "0" });
      logger.info("HSN/SAC field set as non-mandatory via Property Setter (PUT)");
    } catch (_) {
      try {
        await client.post("/api/resource/Property Setter", {
          doctype: "Property Setter",
          doctype_or_field: "DocField",
          doc_type: "Item",
          field_name: "gst_hsn_code",
          property: "reqd",
          property_type: "Check",
          value: "0"
        });
        logger.info("HSN/SAC field set as non-mandatory via Property Setter (POST)");
      } catch (_2) {
      }
    }
    try {
      const cfRes = await client.get("/api/resource/Custom Field", {
        params: {
          filters: JSON.stringify([["Custom Field", "dt", "=", "Item"], ["Custom Field", "fieldname", "=", "gst_hsn_code"]]),
          fields: '["name","reqd"]',
          limit: 5
        }
      });
      const cfs = cfRes.data && cfRes.data.data || [];
      for (const cf of cfs) {
        if (cf.reqd) {
          await client.put("/api/resource/Custom Field/" + encodeURIComponent(cf.name), { reqd: 0 });
          logger.info("HSN/SAC Custom Field set as non-mandatory: " + cf.name);
        }
      }
    } catch (_) {
    }
  } catch (e) {
    logger.warn("Could not patch gst_hsn_code mandatory flag: " + (e?.message || e));
  }
}
async function ensureTallyCustomFields(client) {
  const fieldsToCreate = [
    {
      dt: "Item",
      fieldname: "custom_tally_id",
      label: "Tally GUID",
      fieldtype: "Data",
      insert_after: "item_code",
      in_list_view: 0,
      in_standard_filter: 1,
      read_only: 1
    },
    {
      dt: "Customer",
      fieldname: "custom_tally_id",
      label: "Tally GUID",
      fieldtype: "Data",
      insert_after: "customer_name",
      in_list_view: 0,
      in_standard_filter: 1,
      read_only: 1
    },
    {
      dt: "Supplier",
      fieldname: "custom_tally_id",
      label: "Tally GUID",
      fieldtype: "Data",
      insert_after: "supplier_name",
      in_list_view: 0,
      in_standard_filter: 1,
      read_only: 1
    },
    {
      dt: "Sales Invoice",
      fieldname: "custom_tally_voucher_no",
      label: "Tally Voucher No",
      fieldtype: "Data",
      insert_after: "po_no",
      in_list_view: 1,
      // show in the Sales Invoice list — this is the key flag
      in_standard_filter: 1,
      // also filterable
      read_only: 1,
      allow_on_submit: 1
      // allow set_value on submitted docs
    },
    {
      // FIX: Add Tally Vch No column to Payment Entry list so users can cross-reference
      // Tally voucher numbers directly from the ERPNext Payments list view.
      dt: "Payment Entry",
      fieldname: "custom_tally_voucher_no",
      label: "Tally Vch No",
      fieldtype: "Data",
      insert_after: "reference_no",
      in_list_view: 1,
      // visible in the Payment Entry list
      in_standard_filter: 1,
      // filterable by Tally voucher number
      read_only: 1,
      allow_on_submit: 1
    },
    // ── NEW: Tally Sales Ledger name (e.g. "Sales", "Sales - Retail") ──────────
    // Tally shows "Sales ledger: Sales" at the top of every sales voucher.
    // This field maps that ledger name into ERPNext so no data is lost.
    // in_list_view: 1 so it appears as a column in the Sales Invoice list view.
    {
      dt: "Sales Invoice",
      fieldname: "custom_tally_sales_ledger",
      label: "Tally Sales Ledger",
      fieldtype: "Data",
      insert_after: "custom_tally_voucher_no",
      in_list_view: 1,
      in_standard_filter: 1,
      read_only: 1,
      allow_on_submit: 1
    },
    // ── NEW: Party (Customer) current balance from Tally at time of sync ───────
    // Tally shows "Current balance: 25,68,68,636.00 Dr" next to the party name.
    // Stored as a plain string to preserve Tally's Dr/Cr suffix.
    {
      dt: "Sales Invoice",
      fieldname: "custom_tally_party_balance",
      label: "Tally Party Balance",
      fieldtype: "Data",
      insert_after: "custom_tally_sales_ledger",
      in_list_view: 0,
      in_standard_filter: 0,
      read_only: 1,
      allow_on_submit: 1
    },
    // ── NEW: Sales Ledger current balance from Tally at time of sync ──────────
    // Tally shows "Current balance: 5,59,40,29,876.00 Cr" next to the sales ledger.
    // Stored as a plain string to preserve Tally's Dr/Cr suffix.
    {
      dt: "Sales Invoice",
      fieldname: "custom_tally_sales_ledger_balance",
      label: "Tally Sales Ledger Balance",
      fieldtype: "Data",
      insert_after: "custom_tally_party_balance",
      in_list_view: 0,
      in_standard_filter: 0,
      read_only: 1,
      allow_on_submit: 1
    }
  ];
  for (const f of fieldsToCreate) {
    try {
      const existing = await client.get("/api/resource/Custom Field", {
        params: {
          filters: JSON.stringify([["Custom Field", "dt", "=", f.dt], ["Custom Field", "fieldname", "=", f.fieldname]]),
          fields: '["name","in_list_view","in_standard_filter","allow_on_submit"]',
          limit: 1
        }
      });
      const existingField = (existing?.data?.data || [])[0];
      if (existingField) {
        const needsUpdate = (existingField.in_list_view || 0) !== (f.in_list_view || 0) || (existingField.in_standard_filter || 0) !== (f.in_standard_filter || 0) || (existingField.allow_on_submit || 0) !== (f.allow_on_submit || 0);
        if (needsUpdate) {
          await client.put("/api/resource/Custom Field/" + encodeURIComponent(existingField.name), {
            in_list_view: f.in_list_view,
            in_standard_filter: f.in_standard_filter,
            allow_on_submit: f.allow_on_submit || 0
          });
          logger.info("Updated custom field flags: " + f.dt + "." + f.fieldname);
        }
        continue;
      }
      await client.post("/api/resource/Custom Field", {
        doctype: "Custom Field",
        dt: f.dt,
        fieldname: f.fieldname,
        label: f.label,
        fieldtype: f.fieldtype,
        insert_after: f.insert_after,
        in_list_view: f.in_list_view,
        in_standard_filter: f.in_standard_filter,
        read_only: f.read_only,
        allow_on_submit: f.allow_on_submit || 0
      });
      logger.info("Created custom field: " + f.dt + "." + f.fieldname);
    } catch (e) {
      logger.warn("Could not create custom field " + f.fieldname + ": " + (e?.message || e));
    }
  }
}
async function syncStockToErpNext(stockItems, creds = {}) {
  const client = createErpClient(creds);
  logger.info("Syncing " + stockItems.length + " stock items to ERPNext");
  await ensureHsnNotMandatory(client);
  const uniqueGroups = Array.from(new Set(stockItems.map((i) => i.group).filter(Boolean).filter((g) => g !== "All Item Groups" && g.toLowerCase() !== "primary")));
  const uniqueUoMs = Array.from(new Set(stockItems.map((i) => normaliseUoM(i.baseUnit)).filter(Boolean)));
  const uniqueHsns = Array.from(new Set(stockItems.map((i) => sanitiseHsn(i.hsnCode)).filter((h) => h && h !== "null")));
  const HSN_FALLBACK_STOCK = "999999";
  const uniqueHsnsWithFallback = Array.from(/* @__PURE__ */ new Set([HSN_FALLBACK_STOCK, ...uniqueHsns]));
  logger.info("Pre-creating " + uniqueGroups.length + " Item Groups, " + uniqueUoMs.length + " UoMs, " + uniqueHsnsWithFallback.length + " HSN codes (incl. fallback)");
  for (const g of uniqueGroups) {
    await ensureItemGroup(client, g);
    await sleep(100);
  }
  for (const u of uniqueUoMs) {
    await ensureUoM(client, u);
    await sleep(100);
  }
  for (const h of uniqueHsnsWithFallback) {
    await ensureHsnCode(client, h);
    await sleep(100);
  }
  await ensureCustomFieldOnDoctype(client, "Item", "custom_tally_id", "Tally GUID");
  const allStockCustomKeys = /* @__PURE__ */ new Set();
  for (const item of stockItems) {
    if (item.customFields) Object.keys(item.customFields).forEach((k) => allStockCustomKeys.add(k));
  }
  for (const key of allStockCustomKeys) {
    const fieldname = "custom_tally_" + key.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const label = "Tally " + key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " ");
    await ensureCustomFieldOnDoctype(client, "Item", fieldname, label);
    await sleep(200);
  }
  const results = await batchSync(client, "Item", stockItems, (item) => {
    const uom = normaliseUoM(item.baseUnit);
    const rawGroup = (item.group || "").replace(/[\u0004\u2297\u2666\u25c6*]/g, "").trim();
    const itemGroup = rawGroup && rawGroup.toLowerCase() !== "primary" ? rawGroup : "All Item Groups";
    const HSN_FALLBACK = "999999";
    const hsnCode = sanitiseHsn(item.hsnCode) || HSN_FALLBACK;
    const cleanStr = (s) => (s || "").replace(/[\u0004\u2297\u2666\u25c6*]/g, "").trim();
    const typeOfSupply = cleanStr(item.gstTypeOfSupply).toLowerCase();
    const gstApplicable = cleanStr(item.gstApplicable).toLowerCase();
    const taxability = cleanStr(item.taxability).toLowerCase();
    const isService = typeOfSupply.includes("service");
    let gstItemType = null;
    if (typeOfSupply.includes("capital")) gstItemType = "Capital Goods";
    else if (typeOfSupply.includes("service")) gstItemType = "Services";
    else if (typeOfSupply.includes("good")) gstItemType = "Goods";
    const isNilExempt = gstApplicable.includes("not applicable") || gstApplicable.includes("exempt") || taxability.includes("nil") || taxability.includes("exempt");
    const isNonGst = taxability.includes("non") || gstApplicable.includes("non");
    const itemCode = item.name.slice(0, 140);
    const doc = {
      doctype: "Item",
      item_name: item.name,
      item_code: itemCode,
      custom_tally_id: item.guid || item.name,
      item_group: itemGroup,
      stock_uom: uom,
      is_stock_item: isService ? 0 : 1,
      is_sales_item: 1,
      is_purchase_item: 1,
      description: item.name
    };
    doc.gst_hsn_code = hsnCode;
    if (gstItemType) doc.gst_item_type = gstItemType;
    if (isNilExempt) doc.is_nil_exempt = 1;
    if (isNonGst) doc.is_non_gst = 1;
    if (item.openingQty > 0) {
      doc.opening_stock = item.openingQty;
      if (item.openingValue > 0) {
        doc.valuation_rate = parseFloat((item.openingValue / item.openingQty).toFixed(4));
      }
    }
    if (item.closingQty > 0 && item.closingValue > 0) {
      doc.standard_rate = parseFloat((item.closingValue / item.closingQty).toFixed(4));
    }
    if (item.customFields) {
      for (const [key, value] of Object.entries(item.customFields)) {
        const erpField = "custom_tally_" + key.toLowerCase().replace(/[^a-z0-9]/g, "_");
        doc[erpField] = String(value).slice(0, 255);
      }
    }
    return { filters: { custom_tally_id: doc.custom_tally_id, item_code: doc.item_code }, doc };
  });
  logger.success("Stock sync done - created: " + results.created + ", updated: " + results.updated + ", failed: " + results.failed);
  return results;
}
var _knownTaxTemplates = /* @__PURE__ */ new Set();
var GST_SLABS = [0, 5, 12, 18, 28];
async function resolveGstAccount(client, taxType, companyAbbr, companyName) {
  try {
    const res = await client.get("/api/resource/Account", {
      params: {
        filters: JSON.stringify([
          ["Account", "account_name", "like", "%" + taxType + "%"],
          ["Account", "company", "=", companyName]
        ]),
        fields: '["name"]',
        limit: 1
      }
    });
    const found = res.data?.data?.[0]?.name;
    if (found) return found;
  } catch (_) {
  }
  return null;
}
async function ensureGstTaxTemplate(client, rate, companyName, companyAbbr) {
  const templateName = "GST " + rate + "% - " + companyAbbr;
  if (_knownTaxTemplates.has(templateName)) return templateName;
  try {
    await client.get("/api/resource/Item Tax Template/" + encodeURIComponent(templateName));
    _knownTaxTemplates.add(templateName);
    return templateName;
  } catch (_) {
  }
  const half = rate / 2;
  const igstAcct = await resolveGstAccount(client, "IGST", companyAbbr, companyName);
  const cgstAcct = await resolveGstAccount(client, "CGST", companyAbbr, companyName);
  const sgstAcct = await resolveGstAccount(client, "SGST", companyAbbr, companyName);
  const taxes = [];
  if (igstAcct) taxes.push({ tax_type: igstAcct, tax_rate: rate });
  if (cgstAcct) taxes.push({ tax_type: cgstAcct, tax_rate: half });
  if (sgstAcct) taxes.push({ tax_type: sgstAcct, tax_rate: half });
  if (taxes.length === 0) {
    logger.warn('GST Tax Template "' + templateName + '" skipped \u2014 no GST accounts found for ' + companyName);
    _knownTaxTemplates.add(templateName);
    return null;
  }
  try {
    await client.post("/api/resource/Item Tax Template", {
      doctype: "Item Tax Template",
      title: templateName,
      company: companyName,
      taxes
    });
    _knownTaxTemplates.add(templateName);
    logger.info("Created Item Tax Template: " + templateName);
  } catch (err) {
    const msg = parseErpError(err);
    if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
      _knownTaxTemplates.add(templateName);
      return templateName;
    }
    logger.warn('Could not create Item Tax Template "' + templateName + '": ' + msg);
    _knownTaxTemplates.add(templateName);
    return null;
  }
  return templateName;
}
async function syncTaxesToErpNext(stockItems, companyName, creds = {}) {
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  const companyAbbr = await getCompanyAbbr(client, companyName);
  logger.info("Syncing GST tax templates for " + companyName + " (abbr: " + companyAbbr + ")");
  const tallyRates = [...new Set(stockItems.map((i) => i.gstRate).filter((r) => r !== null && r !== void 0 && !isNaN(r)))];
  const allRates = [.../* @__PURE__ */ new Set([...GST_SLABS, ...tallyRates])].sort((a, b) => a - b);
  logger.info("Creating GST Tax Templates for rates: " + allRates.join("%, ") + "%");
  const templateByRate = /* @__PURE__ */ new Map();
  for (const rate of allRates) {
    const tname = await ensureGstTaxTemplate(client, rate, companyName, companyAbbr);
    if (tname) templateByRate.set(rate, tname);
    await sleep(400);
  }
  const uniqueHsns = [...new Set(stockItems.map((i) => sanitiseHsn(i.hsnCode)).filter(Boolean))];
  logger.info("Ensuring " + uniqueHsns.length + " HSN/SAC codes in ERPNext");
  for (const hsn of uniqueHsns) {
    await ensureHsnCode(client, hsn);
    await sleep(150);
  }
  const itemsToUpdate = stockItems.filter(
    (i) => i.gstRate !== null && i.gstRate !== void 0 && templateByRate.has(i.gstRate) || sanitiseHsn(i.hsnCode)
  );
  logger.info("Linking tax templates to " + itemsToUpdate.length + " items");
  let linked = 0, failed = 0;
  for (const item of itemsToUpdate) {
    const itemCode = (item.name || "").slice(0, 140);
    if (!itemCode) continue;
    const patch = {};
    const hsnCode = sanitiseHsn(item.hsnCode);
    if (hsnCode) patch.gst_hsn_code = hsnCode;
    const template = item.gstRate !== null && item.gstRate !== void 0 ? templateByRate.get(item.gstRate) : null;
    if (template) patch.taxes = [{ item_tax_template: template }];
    if (Object.keys(patch).length === 0) continue;
    try {
      await client.put(
        "/api/resource/Item/" + encodeURIComponent(itemCode),
        Object.assign({}, patch, { doctype: "Item", name: itemCode })
      );
      linked++;
    } catch (err) {
      failed++;
      if (failed <= 5) logger.warn('Tax link failed for "' + itemCode + '": ' + parseErpError(err));
    }
    await sleep(300);
  }
  logger.success("Tax sync done \u2014 templates created: " + templateByRate.size + ", items linked: " + linked + ", failed: " + failed);
  return { templatesCreated: templateByRate.size, linked, failed };
}
function tallyVoucherTypeToErpNext(tallyType) {
  const t = (tallyType || "").toLowerCase().trim();
  if (t === "payment") return "Bank Entry";
  if (t === "receipt") return "Bank Entry";
  if (t === "contra") return "Contra Entry";
  if (t === "debit note") return "Debit Note";
  if (t === "credit note") return "Credit Note";
  if (t === "journal") return "Journal Entry";
  return "Journal Entry";
}
function buildVoucherTypeResolver(voucherTypes = []) {
  const map = /* @__PURE__ */ new Map();
  const _warned = /* @__PURE__ */ new Set();
  for (const vt of voucherTypes) {
    if (vt.name) {
      const base2 = (vt.baseType || vt.parent || vt.name).trim();
      map.set(vt.name.trim().toLowerCase(), base2);
    }
  }
  logger.info(
    "Voucher type resolver built \u2014 " + map.size + " types: " + [...map.entries()].map(([k, v]) => k + "\u2192" + v).join(", ")
  );
  return function resolveBaseType(name) {
    if (!name) return "";
    const base2 = map.get(name.trim().toLowerCase());
    if (!base2 && !_warned.has(name)) {
      _warned.add(name);
      logger.warn(
        "Unresolved voucher type '" + name + "' \u2014 syncing as Journal Entry. Check BASEVOUCHERTYPE in Tally for this voucher type."
      );
    }
    return base2 || name;
  };
}
async function resolveAccountWithType(client, ledgerName, companyAbbr, companyName) {
  const name = await resolveAccount(client, ledgerName, companyAbbr, companyName);
  if (!_accountTypeMap.has(name)) {
    try {
      const res = await client.get("/api/resource/Account/" + encodeURIComponent(name), {
        params: { fields: '["account_type","root_type"]' }
      });
      const data = res.data && res.data.data;
      let t = data && data.account_type || "";
      const rootType = data && data.root_type || "";
      if (t === "Payable" || t === "Receivable") {
        const accountNameLower = (name.split(" - ")[0] || "").trim().toLowerCase();
        let isRealParty = false;
        try {
          if (t === "Payable") {
            const sr = await client.get("/api/resource/Supplier", {
              params: {
                filters: JSON.stringify([["Supplier", "supplier_name", "=", name.split(" - ")[0].trim()]]),
                fields: '["name"]',
                limit: 1
              }
            });
            isRealParty = (sr?.data?.data || []).length > 0;
          } else {
            const cr = await client.get("/api/resource/Customer", {
              params: {
                filters: JSON.stringify([["Customer", "customer_name", "=", name.split(" - ")[0].trim()]]),
                fields: '["name"]',
                limit: 1
              }
            });
            isRealParty = (cr?.data?.data || []).length > 0;
          }
        } catch (_) {
        }
        if (!isRealParty) {
          logger.info(
            "[resolveAccountWithType] Overriding mistyped account_type '" + t + "' \u2192 '' for " + name + " (no matching Customer/Supplier found)"
          );
          try {
            await client.put("/api/resource/Account/" + encodeURIComponent(name), {
              account_type: ""
            });
          } catch (_) {
          }
          t = "";
        }
      }
      _accountTypeMap.set(name, t);
    } catch (_) {
      _accountTypeMap.set(name, "");
    }
  }
  return { name, accountType: _accountTypeMap.get(name) || "" };
}
async function syncVouchersToErpNext(vouchers, companyName, creds = {}, voucherTypeResolver = null) {
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  logger.info("Syncing " + vouchers.length + " vouchers to ERPNext");
  const companyAbbr = companyName ? await getCompanyAbbr(client, companyName) : "T";
  logger.info("Resolving accounts with company abbreviation: " + companyAbbr);
  await ensureTallyCustomFields(client);
  const resolveBase = voucherTypeResolver || ((name) => name);
  const PAYMENT_VCH_TYPES = /* @__PURE__ */ new Set(["Payment", "Receipt"]);
  const JE_VCH_TYPES = /* @__PURE__ */ new Set(["Journal", "Contra", "Debit Note", "Credit Note"]);
  const SKIP_VCH_TYPES = /* @__PURE__ */ new Set(["Stock Journal", "Opening Balance", "Delivery Note", "Purchase Order", "Sales Order"]);
  const paymentVouchers = vouchers.filter((v) => PAYMENT_VCH_TYPES.has(resolveBase(v.voucherType)));
  let journalVouchers = vouchers.filter((v) => JE_VCH_TYPES.has(resolveBase(v.voucherType)));
  const salesVouchers = vouchers.filter((v) => {
    const base2 = resolveBase(v.voucherType || "")?.trim()?.toLowerCase();
    return base2 === "sales" || base2 === "credit note" || (v.voucherType || "").toLowerCase().includes("sales invoice");
  });
  const skippedTypes = vouchers.filter((v) => SKIP_VCH_TYPES.has(resolveBase(v.voucherType)));
  const unmatched = vouchers.length - paymentVouchers.length - journalVouchers.length - salesVouchers.length - skippedTypes.length;
  if (skippedTypes.length > 0) logger.info("Skipping " + skippedTypes.length + " vouchers with non-syncable types (Stock Journal, Opening Balance, etc.)");
  if (unmatched > 0) {
    logger.warn("WARNING: " + unmatched + " vouchers have unresolved types \u2014 they will be synced as Journal Entries. Check buildVoucherTypeResolver.");
    const unmatchedTypeNames = [...new Set(
      vouchers.filter((v) => {
        const base2 = (resolveBase(v.voucherType || "") || "").trim();
        const baseLower = base2.toLowerCase();
        return !PAYMENT_VCH_TYPES.has(base2) && !JE_VCH_TYPES.has(base2) && !SKIP_VCH_TYPES.has(base2) && baseLower !== "sales" && baseLower !== "purchase" && baseLower !== "credit note" && baseLower !== "debit note" && !baseLower.includes("sales invoice") && !baseLower.includes("purchase invoice");
      }).map((v) => '"' + (v.voucherType || "") + '" \u2192 "' + resolveBase(v.voucherType || "") + '"')
    )];
    logger.warn("Unresolved voucher type names: " + unmatchedTypeNames.join(", "));
  }
  logger.info("Voucher split \u2014 Payment Entry: " + paymentVouchers.length + ", Journal Entry: " + journalVouchers.length + ", Sales: " + salesVouchers.length + ", Skipped: " + skippedTypes.length);
  const peResults = { created: 0, updated: 0, failed: 0 };
  if (paymentVouchers.length > 0) {
    logger.info("Syncing " + paymentVouchers.length + " Payment/Receipt vouchers to Payment Entry");
    for (const v of paymentVouchers) {
      if (!v.entries || v.entries.length === 0) {
        v._skip = true;
        continue;
      }
      const resolved = [];
      for (const e of v.entries) {
        const { name: acct, accountType } = await resolveAccountWithType(client, e.ledger, companyAbbr, companyName);
        resolved.push({ ...e, erpAccount: acct, accountType });
      }
      v.resolvedAccounts = resolved;
    }
    const _peParties = { Customer: /* @__PURE__ */ new Set(), Supplier: /* @__PURE__ */ new Set() };
    for (const v of paymentVouchers) {
      const rows = v.resolvedAccounts || [];
      for (const row of rows) {
        if (row.accountType === "Receivable" && row.ledger) {
          _peParties.Customer.add(row.ledger.trim());
        } else if (row.accountType === "Payable" && row.ledger) {
          _peParties.Supplier.add(row.ledger.trim());
        } else if (!row.accountType && row.ledger) {
          if (v.voucherType === "Receipt" && !row.isDebit) {
            _peParties.Customer.add(row.ledger.trim());
          } else if (v.voucherType === "Payment" && row.isDebit) {
            _peParties.Supplier.add(row.ledger.trim());
          }
        }
      }
    }
    const bankCashNames = new Set(
      paymentVouchers.flatMap((v) => v.resolvedAccounts || []).filter((r) => r.accountType === "Bank" || r.accountType === "Cash").map((r) => (r.ledger || "").trim().toLowerCase())
    );
    for (const n of [..._peParties.Customer]) if (bankCashNames.has(n.toLowerCase())) _peParties.Customer.delete(n);
    for (const n of [..._peParties.Supplier]) if (bankCashNames.has(n.toLowerCase())) _peParties.Supplier.delete(n);
    logger.info("[PE pre-sync] Ensuring parties \u2014 Customers: " + _peParties.Customer.size + ", Suppliers: " + _peParties.Supplier.size);
    for (const name of _peParties.Customer) {
      try {
        await client.get("/api/resource/Customer/" + encodeURIComponent(name));
      } catch (_) {
        try {
          await client.get("/api/resource/Supplier/" + encodeURIComponent(name));
          logger.info("[PE pre-sync] Skipping Customer create for " + name + " \u2014 already a Supplier");
          continue;
        } catch (_2) {
        }
        try {
          const acctRes = await client.get("/api/resource/Account", { params: { filters: JSON.stringify([["Account", "account_name", "=", name]]), fields: '["name","root_type"]', limit: 1 } });
          if (acctRes?.data?.data?.[0]) {
            logger.info("[PE pre-sync] Skipping Customer create for " + name + " \u2014 exists as GL Account");
            continue;
          }
        } catch (_3) {
        }
        try {
          await client.post("/api/resource/Customer", { doctype: "Customer", customer_name: name, customer_type: "Individual", customer_group: _customerGroup || "Commercial", territory: "India" });
          logger.info("[PE pre-sync] Auto-created Customer: " + name);
        } catch (e) {
          logger.warn('[PE pre-sync] Could not create Customer "' + name + '": ' + parseErpError(e));
        }
        await sleep(300);
      }
    }
    for (const name of _peParties.Supplier) {
      try {
        await client.get("/api/resource/Supplier/" + encodeURIComponent(name));
      } catch (_) {
        try {
          await client.get("/api/resource/Customer/" + encodeURIComponent(name));
          logger.info("[PE pre-sync] Skipping Supplier create for " + name + " \u2014 already a Customer");
          continue;
        } catch (_2) {
        }
        try {
          const acctRes = await client.get("/api/resource/Account", { params: { filters: JSON.stringify([["Account", "account_name", "=", name]]), fields: '["name","root_type"]', limit: 1 } });
          if (acctRes?.data?.data?.[0]) {
            logger.info("[PE pre-sync] Skipping Supplier create for " + name + " \u2014 exists as GL Account");
            continue;
          }
        } catch (_3) {
        }
        try {
          await client.post("/api/resource/Supplier", { doctype: "Supplier", supplier_name: name, supplier_type: "Individual", supplier_group: _supplierGroup || "Services" });
          logger.info("[PE pre-sync] Auto-created Supplier: " + name);
        } catch (e) {
          logger.warn('[PE pre-sync] Could not create Supplier "' + name + '": ' + parseErpError(e));
        }
        await sleep(300);
      }
    }
    const _verifiedPeCustomers = /* @__PURE__ */ new Set();
    const _verifiedPeSuppliers = /* @__PURE__ */ new Set();
    try {
      let pg = 0;
      while (true) {
        const cr = await client.get("/api/resource/Customer", {
          params: { fields: '["customer_name"]', limit: 500, limit_start: pg * 500 }
        });
        const rows = cr?.data?.data || [];
        rows.forEach((c) => _verifiedPeCustomers.add((c.customer_name || "").trim().toLowerCase()));
        if (rows.length < 500) break;
        pg++;
      }
    } catch (_) {
    }
    try {
      let pg = 0;
      while (true) {
        const sr = await client.get("/api/resource/Supplier", {
          params: { fields: '["supplier_name"]', limit: 500, limit_start: pg * 500 }
        });
        const rows = sr?.data?.data || [];
        rows.forEach((s) => _verifiedPeSuppliers.add((s.supplier_name || "").trim().toLowerCase()));
        if (rows.length < 500) break;
        pg++;
      }
    } catch (_) {
    }
    try {
      const glRes = await client.get("/api/resource/Account", {
        params: {
          filters: JSON.stringify([
            ["Account", "company", "=", companyName],
            ["Account", "is_group", "=", 0],
            ["Account", "account_type", "in", ["Bank", "Cash", "Income Account", "Expense Account"]]
          ]),
          fields: '["account_name"]',
          limit: 500
        }
      });
      const glNames = (glRes?.data?.data || []).map(
        (a) => (a.account_name || "").trim().toLowerCase()
      );
      for (const n of glNames) {
        if (_verifiedPeCustomers.has(n)) {
          _verifiedPeCustomers.delete(n);
          logger.info("[PE] Removed '" + n + "' from verified customers \u2014 it is a GL Account");
        }
        if (_verifiedPeSuppliers.has(n)) {
          _verifiedPeSuppliers.delete(n);
          logger.info("[PE] Removed '" + n + "' from verified suppliers \u2014 it is a GL Account");
        }
      }
    } catch (_) {
    }
    logger.info("[PE] Verified parties \u2014 Customers: " + _verifiedPeCustomers.size + ", Suppliers: " + _verifiedPeSuppliers.size);
    let _defaultBankAcct = null;
    let _defaultBankType = "Bank";
    try {
      const bankRes = await client.get("/api/resource/Account", {
        params: {
          filters: JSON.stringify([
            ["Account", "account_type", "in", ["Bank", "Cash"]],
            ["Account", "company", "=", companyName],
            ["Account", "is_group", "=", 0]
          ]),
          fields: '["name","account_type"]',
          limit: 1,
          order_by: "account_type asc"
          // Bank before Cash
        }
      });
      const found = bankRes?.data?.data?.[0];
      if (found) {
        _defaultBankAcct = found.name;
        _defaultBankType = found.account_type || "Bank";
        logger.info("[PE] Default bank/cash account: " + _defaultBankAcct + " (" + _defaultBankType + ")");
      }
    } catch (_) {
    }
    if (!_defaultBankAcct) {
      _defaultBankAcct = "Cash - " + companyAbbr;
      _defaultBankType = "Cash";
      logger.warn("[PE] Could not resolve default bank account \u2014 using fallback: " + _defaultBankAcct);
    }
    const peMapper = (v) => {
      const rows = v.resolvedAccounts || [];
      let partyRow = rows.find((r) => r.accountType === "Receivable" || r.accountType === "Payable");
      let bankRow = rows.find((r) => r.accountType === "Bank" || r.accountType === "Cash");
      if (!partyRow && rows.length >= 2) {
        const isReceipt2 = v.voucherType === "Receipt";
        const nonBankRows = rows.filter(
          (r) => r.accountType !== "Bank" && r.accountType !== "Cash" && r.accountType !== "Income Account" && r.accountType !== "Expense Account"
        );
        const candidateRows = nonBankRows.length > 0 ? nonBankRows : rows;
        partyRow = isReceipt2 ? candidateRows.find((r) => !r.isDebit) : candidateRows.find((r) => r.isDebit);
        if (partyRow) {
          if (partyRow.accountType === "Bank" || partyRow.accountType === "Cash" || partyRow.accountType === "Income Account" || partyRow.accountType === "Expense Account") {
            partyRow = null;
          } else {
            partyRow = { ...partyRow, accountType: isReceipt2 ? "Receivable" : "Payable" };
            logger.info("[PE] Inferred party row for voucher " + (v.voucherNumber || v.guid) + " from voucherType (" + v.voucherType + ")");
          }
        }
      }
      if (!partyRow) {
        const rowSummary = rows.map(
          (r) => (r.ledger || "?") + "[" + (r.accountType || "no-type") + "," + (r.isDebit ? "Dr" : "Cr") + "]"
        ).join(" | ");
        logger.warn(
          "Payment voucher " + (v.voucherNumber || v.guid) + " (" + v.voucherType + ") falling back to Journal Entry \u2014 no party row detected. Rows: " + rowSummary
        );
        return null;
      }
      const GL_ACCOUNT_TYPES = ["Income Account", "Expense Account", "Bank", "Cash"];
      if (GL_ACCOUNT_TYPES.includes(partyRow.accountType)) {
        logger.warn(
          "Payment voucher " + (v.voucherNumber || v.guid) + " falling back to Journal Entry \u2014 party account '" + partyRow.ledger + "' is type '" + partyRow.accountType + "', not a Customer/Supplier."
        );
        return null;
      }
      const _partyLedgerKey = (partyRow.ledger || "").trim().toLowerCase();
      const _isVerifiedCustomer = _verifiedPeCustomers.has(_partyLedgerKey);
      const _isVerifiedSupplier = _verifiedPeSuppliers.has(_partyLedgerKey);
      if (!_isVerifiedCustomer && !_isVerifiedSupplier) {
        logger.warn(
          "Payment voucher " + (v.voucherNumber || v.guid) + " falling back to Journal Entry \u2014 '" + partyRow.ledger + "' is not a registered Customer or Supplier (Capital/GL account)."
        );
        return null;
      }
      if (!bankRow) {
        bankRow = rows.find((r) => r !== partyRow);
      }
      const isReceipt = v.voucherType === "Receipt";
      const partyType = partyRow.accountType === "Receivable" ? "Customer" : "Supplier";
      const paymentType = isReceipt ? "Receive" : "Pay";
      const amount = Math.abs(partyRow.amount) || v.netAmount || 0;
      const remarkKey = "Tally:" + v.voucherType + ":" + (v.voucherNumber || v.guid);
      const bankAcct = bankRow ? bankRow.erpAccount : _defaultBankAcct;
      const bankAcctType = bankRow ? bankRow.accountType === "Cash" ? "Cash" : "Bank" : _defaultBankType;
      const partyAcct = partyRow.erpAccount;
      const partyAcctType = partyRow.accountType === "Receivable" ? "Receivable" : "Payable";
      const paidFromAcct = isReceipt ? bankAcct : partyAcct;
      const paidFromAcctType = isReceipt ? bankAcctType : partyAcctType;
      const paidToAcct = isReceipt ? partyAcct : bankAcct;
      const paidToAcctType = isReceipt ? partyAcctType : bankAcctType;
      if (!bankAcct || bankAcct === companyName) {
        logger.warn(
          "Payment voucher " + (v.voucherNumber || v.guid) + " falling back to Journal Entry \u2014 could not resolve a valid bank/cash account."
        );
        return null;
      }
      return {
        filters: {
          custom_tally_voucher_no: String(v.voucherNumber || v.guid).trim()
        },
        doc: {
          doctype: "Payment Entry",
          payment_type: paymentType,
          posting_date: v.voucherDate,
          company: companyName,
          party_type: partyType,
          party: (partyRow.ledger || "").trim(),
          paid_from: paidFromAcct,
          paid_from_account_type: paidFromAcctType,
          // required by ERPNext validation
          paid_to: paidToAcct,
          paid_to_account_type: paidToAcctType,
          // required by ERPNext validation
          paid_amount: amount,
          received_amount: amount,
          source_exchange_rate: 1,
          target_exchange_rate: 1,
          reference_no: v.voucherNumber || v.guid,
          reference_date: v.voucherDate,
          remarks: remarkKey,
          custom_tally_id: v.guid || v.voucherNumber,
          // FIX: Store Tally voucher number in the new custom field so it appears
          // as a dedicated "Tally Vch No" column in the ERPNext Payment Entry list view.
          custom_tally_voucher_no: v.voucherNumber || v.guid
        }
      };
    };
    const validPE = [];
    const fallbackJE = [];
    for (const v of paymentVouchers) {
      if (v._skip || !v.resolvedAccounts) {
        peResults.failed++;
        continue;
      }
      const mapped = peMapper(v);
      if (mapped === null) fallbackJE.push(v);
      else validPE.push({ v, mapped });
    }
    for (const { v, mapped } of validPE) {
      try {
        const result = await upsert(client, "Payment Entry", mapped.filters, mapped.doc);
        if (result.action === "created") peResults.created++;
        else peResults.updated++;
      } catch (e) {
        peResults.failed++;
        logger.warn("Payment Entry failed for " + (v.voucherNumber || v.guid) + ": " + parseErpError(e));
      }
      await sleep(300);
    }
    if (fallbackJE.length > 0) {
      logger.info(fallbackJE.length + " payment vouchers without party rows falling back to Journal Entry");
      journalVouchers = [...journalVouchers, ...fallbackJE];
    }
    logger.info("Payment Entry sync done \u2014 created: " + peResults.created + ", updated: " + peResults.updated + ", failed: " + peResults.failed);
  }
  for (const v of journalVouchers) {
    if (v.entries && v.entries.length > 0) {
      const resolved = [];
      for (const e of v.entries) {
        const { name: acct, accountType } = await resolveAccountWithType(client, e.ledger, companyAbbr, companyName);
        const row = {
          account: acct,
          debit_in_account_currency: e.isDebit ? Math.abs(e.amount) : 0,
          credit_in_account_currency: e.isDebit ? 0 : Math.abs(e.amount)
        };
        if (accountType === "Receivable") {
          row.party_type = "Customer";
          row.party = e.ledger.trim();
          row.is_advance = "No";
        } else if (accountType === "Payable") {
          row.party_type = "Supplier";
          row.party = e.ledger.trim();
          row.is_advance = "No";
        }
        resolved.push(row);
      }
      v.resolvedAccounts = resolved;
    } else if (v.partyName) {
      const { name: acct, accountType } = await resolveAccountWithType(client, v.partyName, companyAbbr, companyName);
      const row1 = { account: acct, debit_in_account_currency: v.netAmount || 0, credit_in_account_currency: 0 };
      const row2 = { account: acct, debit_in_account_currency: 0, credit_in_account_currency: v.netAmount || 0 };
      if (accountType === "Receivable") {
        row1.party_type = row2.party_type = "Customer";
        row1.party = row2.party = v.partyName.trim();
        row1.is_advance = row2.is_advance = "No";
      } else if (accountType === "Payable") {
        row1.party_type = row2.party_type = "Supplier";
        row1.party = row2.party = v.partyName.trim();
        row1.is_advance = row2.is_advance = "No";
      }
      v.resolvedAccounts = [row1, row2];
    } else {
      v._skip = true;
      logger.warn("Voucher " + v.voucherNumber + " has no entries \u2014 skipping");
    }
  }
  const syncable = journalVouchers.filter((v) => !v._skip);
  logger.info("Syncing " + syncable.length + "/" + journalVouchers.length + " vouchers");
  const MAX_AMOUNT = 999999999;
  function safeAmount(n) {
    const v = Number(n);
    if (!isFinite(v) || isNaN(v)) return 0;
    return Math.min(Math.max(v, 0), MAX_AMOUNT);
  }
  const sanitized = [];
  for (const v of syncable) {
    if (!v.resolvedAccounts) continue;
    const cleanRows = v.resolvedAccounts.map((a) => {
      const row = Object.assign({}, a, {
        account: (a.account || "").trim(),
        debit_in_account_currency: safeAmount(a.debit_in_account_currency),
        credit_in_account_currency: safeAmount(a.credit_in_account_currency)
      });
      if (row.party) row.party = row.party.trim();
      return row;
    }).filter((a) => a.debit_in_account_currency > 0 || a.credit_in_account_currency > 0);
    if (cleanRows.length === 0) {
      logger.warn("Voucher " + (v.voucherNumber || v.guid) + " skipped \u2014 all rows have zero/invalid amounts after sanitization");
      continue;
    }
    const hasOverflow = cleanRows.some(
      (a) => a.debit_in_account_currency > MAX_AMOUNT || a.credit_in_account_currency > MAX_AMOUNT
    );
    if (hasOverflow) {
      logger.warn("Voucher " + (v.voucherNumber || v.guid) + " skipped \u2014 contains out-of-range amount (>" + MAX_AMOUNT + ")");
      continue;
    }
    v.resolvedAccounts = cleanRows;
    sanitized.push(v);
  }
  const skippedAmounts = syncable.length - sanitized.length;
  if (skippedAmounts > 0) logger.warn(skippedAmounts + " voucher(s) skipped due to invalid/overflow amounts");
  const _partiesNeeded = { Customer: /* @__PURE__ */ new Set(), Supplier: /* @__PURE__ */ new Set() };
  for (const v of sanitized) {
    for (const row of v.resolvedAccounts || []) {
      if (row.party_type === "Customer" && row.party) _partiesNeeded.Customer.add(row.party);
      if (row.party_type === "Supplier" && row.party) _partiesNeeded.Supplier.add(row.party);
    }
  }
  logger.info(
    "[JE pre-sync] Ensuring parties exist \u2014 Customers: " + _partiesNeeded.Customer.size + ", Suppliers: " + _partiesNeeded.Supplier.size
  );
  for (const name of _partiesNeeded.Customer) {
    try {
      await client.get("/api/resource/Customer/" + encodeURIComponent(name));
    } catch (_) {
      try {
        await client.get("/api/resource/Supplier/" + encodeURIComponent(name));
        logger.info("[JE pre-sync] Skipping Customer create for " + name + " \u2014 already a Supplier");
        continue;
      } catch (_2) {
      }
      try {
        const acctRes = await client.get("/api/resource/Account", { params: { filters: JSON.stringify([["Account", "account_name", "=", name]]), fields: '["name","root_type"]', limit: 1 } });
        if (acctRes?.data?.data?.[0]) {
          logger.info("[JE pre-sync] Skipping Customer create for " + name + " \u2014 exists as GL Account");
          continue;
        }
      } catch (_3) {
      }
      try {
        await client.post("/api/resource/Customer", {
          doctype: "Customer",
          customer_name: name,
          customer_type: "Individual",
          customer_group: _customerGroup || "Commercial",
          territory: "India"
        });
        logger.info("[JE pre-sync] Auto-created Customer: " + name);
      } catch (e) {
        logger.warn('[JE pre-sync] Could not auto-create Customer "' + name + '": ' + parseErpError(e));
      }
      await sleep(300);
    }
  }
  for (const name of _partiesNeeded.Supplier) {
    try {
      await client.get("/api/resource/Supplier/" + encodeURIComponent(name));
    } catch (_) {
      try {
        await client.get("/api/resource/Customer/" + encodeURIComponent(name));
        logger.info("[JE pre-sync] Skipping Supplier create for " + name + " \u2014 already a Customer");
        continue;
      } catch (_2) {
      }
      try {
        const acctRes = await client.get("/api/resource/Account", { params: { filters: JSON.stringify([["Account", "account_name", "=", name]]), fields: '["name","root_type"]', limit: 1 } });
        if (acctRes?.data?.data?.[0]) {
          logger.info("[JE pre-sync] Skipping Supplier create for " + name + " \u2014 exists as GL Account");
          continue;
        }
      } catch (_3) {
      }
      try {
        await client.post("/api/resource/Supplier", {
          doctype: "Supplier",
          supplier_name: name,
          supplier_type: "Individual",
          supplier_group: _supplierGroup || "Services"
        });
        logger.info("[JE pre-sync] Auto-created Supplier: " + name);
      } catch (e) {
        logger.warn('[JE pre-sync] Could not auto-create Supplier "' + name + '": ' + parseErpError(e));
      }
      await sleep(300);
    }
  }
  const jeResults = await batchSync(client, "Journal Entry", sanitized, (v) => {
    const idKey = ("Tally:" + (v.voucherNumber || v.guid)).slice(0, 140);
    const remarkKey = "Tally:" + (v.voucherNumber || v.guid);
    return {
      // FIX: Use user_remark as the upsert filter key — it is the full reliable key.
      // cheque_no was used before but silent truncation caused false "not found" collisions.
      filters: { user_remark: remarkKey },
      doc: {
        doctype: "Journal Entry",
        title: (v.voucherType + " - " + (v.voucherNumber || v.guid)).slice(0, 140),
        voucher_type: tallyVoucherTypeToErpNext(v.voucherType),
        posting_date: v.voucherDate,
        company: companyName,
        cheque_no: idKey,
        cheque_date: v.voucherDate,
        user_remark: remarkKey,
        accounts: v.resolvedAccounts
      }
    };
  });
  logger.success(
    "Voucher sync done \u2014 Payment Entry: +" + peResults.created + "/~" + peResults.updated + "/=" + (peResults.skipped || 0) + "/x" + peResults.failed + " | Journal Entry: +" + jeResults.created + "/~" + jeResults.updated + "/=" + (jeResults.skipped || 0) + "/x" + jeResults.failed
  );
  {
    const fyRangesSeen = /* @__PURE__ */ new Set();
    for (const v of [...paymentVouchers, ...journalVouchers]) {
      if (!v.voucherDate) continue;
      const d = new Date(v.voucherDate);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const fyStart = month >= 4 ? year : year - 1;
      const fyKey = fyStart + "-" + (fyStart + 1);
      if (!fyRangesSeen.has(fyKey)) {
        fyRangesSeen.add(fyKey);
        await autoCreateFiscalYear(client, v.voucherDate, companyName);
      }
    }
  }
  const peSubmitted = { submitted: 0, failed: 0 };
  if (paymentVouchers.length > 0) {
    logger.info("Submitting Payment Entries...");
    for (const v of paymentVouchers) {
      if (v._skip || !v.resolvedAccounts) continue;
      const remarkKey = "Tally:" + (v.voucherNumber || v.guid);
      try {
        const list = await client.get("/api/resource/Payment Entry", {
          params: { filters: JSON.stringify([["Payment Entry", "remarks", "like", remarkKey + "%"]]), fields: '["name","docstatus"]', limit: 1 }
        });
        const stub = list?.data?.data?.[0];
        if (!stub || stub.docstatus === 1) continue;
        const fullRes = await client.get("/api/resource/Payment Entry/" + encodeURIComponent(stub.name));
        const fullDoc = fullRes?.data?.data;
        if (!fullDoc) continue;
        await client.post("/api/method/frappe.client.submit", { doc: fullDoc });
        peSubmitted.submitted++;
      } catch (e) {
        peSubmitted.failed++;
        logger.warn("Payment Entry submit failed for " + (v.voucherNumber || v.guid) + ": " + parseErpError(e));
      }
      await sleep(200);
    }
    logger.info("Submit Payment Entry: " + peSubmitted.submitted + " submitted, " + peSubmitted.failed + " failed");
  }
  const jeSubmitted = { submitted: 0, failed: 0 };
  if (journalVouchers.length > 0) {
    logger.info("Submitting Journal Entries...");
    for (const v of journalVouchers) {
      const remarkKey = "Tally:" + (v.voucherNumber || v.guid);
      try {
        const list = await client.get("/api/resource/Journal Entry", {
          params: { filters: JSON.stringify([["Journal Entry", "user_remark", "like", remarkKey + "%"]]), fields: '["name","docstatus"]', limit: 1 }
        });
        const stub = list?.data?.data?.[0];
        if (!stub || stub.docstatus === 1) continue;
        const fullRes = await client.get("/api/resource/Journal Entry/" + encodeURIComponent(stub.name));
        const fullDoc = fullRes?.data?.data;
        if (!fullDoc) continue;
        await client.post("/api/method/frappe.client.submit", { doc: fullDoc });
        jeSubmitted.submitted++;
      } catch (e) {
        jeSubmitted.failed++;
        logger.warn("Journal Entry submit failed for " + (v.voucherNumber || v.guid) + ": " + parseErpError(e));
      }
      await sleep(200);
    }
    logger.info("Submit Journal Entry: " + jeSubmitted.submitted + " submitted, " + jeSubmitted.failed + " failed");
  }
  peResults.failed += peSubmitted.failed;
  jeResults.failed += jeSubmitted.failed;
  return { paymentEntries: peResults, journalEntries: jeResults, salesInvoices: { created: 0, updated: 0, failed: salesVouchers.length } };
}
var TALLY_GROUP_TYPE_MAP = {
  "current assets": "Asset",
  "fixed assets": "Asset",
  "investments": "Asset",
  "loans & advances (asset)": "Asset",
  "misc. expenses (asset)": "Asset",
  "bank accounts": "Asset",
  "cash-in-hand": "Asset",
  "deposits (asset)": "Asset",
  "stock-in-hand": "Asset",
  "current liabilities": "Liability",
  "loans (liability)": "Liability",
  "capital account": "Equity",
  "reserves & surplus": "Equity",
  "bank od & od accounts": "Liability",
  "sales accounts": "Income",
  "indirect income": "Income",
  "direct incomes": "Income",
  "purchase accounts": "Expense",
  "indirect expenses": "Expense",
  "direct expenses": "Expense",
  "manufacturing expenses": "Expense",
  "sundry debtors": "Asset",
  "sundry creditors": "Liability",
  "duties & taxes": "Liability",
  "provisions": "Liability"
};
function tallyGroupToAccountType(groupName, parentName) {
  const lower = (groupName || "").toLowerCase();
  const parentLower = (parentName || "").toLowerCase();
  for (const [key, type] of Object.entries(TALLY_GROUP_TYPE_MAP)) {
    if (lower.includes(key) || parentLower.includes(key)) return type;
  }
  return "";
}
async function ensureTallyRootAccount(client, companyName, companyAbbr) {
  const rootName = `Tally Primary - ${companyAbbr}`;
  try {
    const existing = await client.get(
      "/api/resource/Account/" + encodeURIComponent(rootName)
    );
    if (existing?.data?.data) {
      return rootName;
    }
  } catch (_) {
  }
  try {
    const liabilityRoot = await client.get(
      "/api/resource/Account",
      {
        params: {
          filters: JSON.stringify([
            ["Account", "company", "=", companyName],
            ["Account", "root_type", "=", "Asset"],
            ["Account", "is_group", "=", 1]
          ]),
          fields: '["name"]',
          limit: 1
        }
      }
    );
    const parentRoot = liabilityRoot?.data?.data?.[0]?.name;
    await client.post(
      "/api/resource/Account",
      {
        doctype: "Account",
        account_name: "Tally Primary",
        company: companyName,
        parent_account: parentRoot,
        is_group: 1,
        root_type: "Asset"
      }
    );
    logger.info(
      `[TALLY ROOT] Created ${rootName}`
    );
    return rootName;
  } catch (e) {
    logger.error(
      `[TALLY ROOT ERROR] ${e.message}`
    );
    return null;
  }
}
async function syncChartOfAccountsToErpNext(groups, companyName, creds = {}) {
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  logger.info("Syncing " + groups.length + " account groups to ERPNext for " + companyName);
  const companyAbbr = await getCompanyAbbr(client, companyName);
  const tallyRoot = await ensureTallyRootAccount(
    client,
    companyName,
    companyAbbr
  );
  let erpAccounts = [];
  try {
    let page = 0;
    while (true) {
      const res = await client.get("/api/resource/Account", {
        params: {
          filters: JSON.stringify([["Account", "company", "=", companyName]]),
          fields: '["name","account_name","root_type","is_group","parent_account"]',
          limit: 500,
          limit_start: page * 500
        }
      });
      const rows = res.data && res.data.data || [];
      erpAccounts = erpAccounts.concat(rows);
      if (rows.length < 500) break;
      page++;
    }
    logger.info("COA: fetched " + erpAccounts.length + " existing ERPNext accounts for " + companyName);
    _erpAccountsForRun.set(companyName, erpAccounts);
  } catch (e) {
    logger.warn("COA: could not pre-fetch ERPNext accounts \u2014 " + e.message);
  }
  const erpByName = /* @__PURE__ */ new Map();
  for (const a of erpAccounts) {
    if (a.account_name) erpByName.set(a.account_name.trim().toLowerCase(), a);
    if (a.name) erpByName.set(a.name.trim().toLowerCase(), a);
  }
  function findRootGroupByType(rootType) {
    const candidates = erpAccounts.filter((a) => a.is_group && a.root_type === rootType);
    if (!candidates.length) return null;
    const trueRoot = candidates.find((a) => !a.parent_account);
    if (trueRoot) return trueRoot.name;
    return candidates.sort((a, b) => a.name.length - b.name.length)[0].name;
  }
  const assetRoot = findRootGroupByType("Asset");
  const liabilityRoot = findRootGroupByType("Liability");
  const incomeRoot = findRootGroupByType("Income");
  const expenseRoot = findRootGroupByType("Expense");
  const equityRoot = findRootGroupByType("Equity") || liabilityRoot;
  logger.info("COA root accounts \u2014 Asset: " + assetRoot + ", Liability: " + liabilityRoot + ", Equity(fallback): " + equityRoot + ", Income: " + incomeRoot + ", Expense: " + expenseRoot);
  const TALLY_ROOT_TYPE = {
    // Asset
    "current assets": "Asset",
    "fixed assets": "Asset",
    "investments": "Asset",
    "loans & advances (asset)": "Asset",
    "misc. expenses (asset)": "Asset",
    "misc. expenses (asset)": "Asset",
    "bank accounts": "Asset",
    "cash-in-hand": "Asset",
    "deposits (asset)": "Asset",
    "stock-in-hand": "Asset",
    "sundry debtors": "Asset",
    "branch / divisions": "Asset",
    // Liability
    "current liabilities": "Liability",
    "loans (liability)": "Liability",
    "bank od & od accounts": "Liability",
    "bank od a/c": "Liability",
    "provisions": "Liability",
    "duties & taxes": "Liability",
    "sundry creditors": "Liability",
    "suspense a/c": "Liability",
    "suspense": "Liability",
    // Equity (maps to liabilityRoot on ERPNext India)
    "capital account": "Equity",
    "reserves & surplus": "Equity",
    // Income
    "sales accounts": "Income",
    "indirect income": "Income",
    "indirect incomes": "Income",
    "direct incomes": "Income",
    "direct income": "Income",
    // Expense
    "purchase accounts": "Expense",
    "indirect expenses": "Expense",
    "direct expenses": "Expense",
    "manufacturing expenses": "Expense"
  };
  function resolveRootType(nameLower) {
    if (TALLY_ROOT_TYPE[nameLower]) return TALLY_ROOT_TYPE[nameLower];
    for (const [key, type] of Object.entries(TALLY_ROOT_TYPE)) {
      if (nameLower.includes(key) || key.includes(nameLower)) return type;
    }
    return null;
  }
  function resolveParentAccount(group) {
    const rawParent = (group.parent || "").trim();
    const isPrimary = !rawParent || rawParent.toLowerCase() === "primary";
    const nameLower = (group.name || "").trim().toLowerCase();
    if (!isPrimary) {
      const withSuffix = (rawParent + " - " + companyAbbr).toLowerCase();
      const plain = rawParent.toLowerCase();
      if (erpByName.has(withSuffix)) return erpByName.get(withSuffix).name;
      if (erpByName.has(plain)) return erpByName.get(plain).name;
      return rawParent + " - " + companyAbbr;
    }
    const ROOT_BY_TYPE = {
      Asset: assetRoot,
      Liability: liabilityRoot,
      Equity: equityRoot,
      Income: incomeRoot,
      Expense: expenseRoot
    };
    const rootType = resolveRootType(nameLower);
    if (!rootType || !ROOT_BY_TYPE[rootType]) {
      const n = nameLower;
      if (n.includes("income") || n.includes("sales") || n.includes("revenue") || n.includes("receipt") || n.includes("trading")) {
        return incomeRoot;
      }
      if (n.includes("expense") || n.includes("cost") || n.includes("purchase") || n.includes("salary") || n.includes("wage") || n.includes("depreciation") || n.includes("loss")) {
        return expenseRoot;
      }
      if (n.includes("loan") || n.includes("liability") || n.includes("payable") || n.includes("creditor") || n.includes("capital") || n.includes("reserve") || n.includes("fund") || n.includes("deposit") && n.includes("liab")) {
        return liabilityRoot;
      }
      if (n.includes("asset") || n.includes("receivable") || n.includes("debtor") || n.includes("stock") || n.includes("cash") || n.includes("bank") || n.includes("investment") || n.includes("deposit")) {
        return assetRoot;
      }
      logger.warn(
        'COA: could not determine root type for "' + group.name + '" \u2014 defaulting to Asset root. Check if this group is correctly placed.'
      );
      return assetRoot;
    }
    const normalise = (s) => (s || "").toLowerCase().replace(/s\b/g, "").replace(/[&()\-\/\.]/g, " ").replace(/\s+/g, " ").trim();
    const tallyNorm = normalise(nameLower);
    const candidatesUnderRoot = erpAccounts.filter(
      (a) => a.is_group && a.root_type === rootType
    );
    for (const candidate of candidatesUnderRoot) {
      const erpNorm = normalise(candidate.account_name || "");
      if (erpNorm === tallyNorm) {
        logger.info(
          'COA name match: "' + group.name + '" = "' + candidate.name + '"'
        );
        erpByName.set(
          (group.name + " - " + companyAbbr).toLowerCase(),
          {
            name: candidate.name,
            account_name: candidate.account_name,
            is_group: candidate.is_group,
            parent_account: candidate.parent_account
          }
        );
        return candidate.parent_account || ROOT_BY_TYPE[rootType];
      }
    }
    return ROOT_BY_TYPE[rootType];
  }
  const TALLY_TO_ERP_NAME_MAP = {
    "Cash-in-Hand": "Cash In Hand",
    "Direct Incomes": "Direct Income",
    "Indirect Incomes": "Indirect Income",
    "Income (Direct)": "Direct Income",
    "Income (Indirect)": "Indirect Income",
    "Expenses (Direct)": "Direct Expenses",
    "Expenses (Indirect)": "Indirect Expenses",
    "Loans & Advances (Asset)": "Loans and Advances (Assets)",
    "Misc. Expenses (ASSET)": "Misc. Expenses (Asset)",
    "Bank OD A/c": "Bank OD",
    "Reserves & Surplus": "Reserves and Surplus",
    "Duties & Taxes": "Duties and Taxes",
    "Stock-in-Hand": "Stock In Hand"
  };
  const sorted = groups.slice().sort((a, b) => {
    const cleanP = (s) => {
      if (!s) return "";
      let o = "";
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c <= 31 || c === 127) continue;
        o += s[i];
      }
      return o.trim().toLowerCase();
    };
    const isPrimaryA = !a.parent || cleanP(a.parent) === "primary";
    const isPrimaryB = !b.parent || cleanP(b.parent) === "primary";
    if (isPrimaryA && !isPrimaryB) return -1;
    if (!isPrimaryA && isPrimaryB) return 1;
    return (a.parent || "").localeCompare(b.parent || "");
  });
  let created = 0, updated = 0, failed = 0;
  const errors = [];
  let skipped = 0;
  for (const group of sorted) {
    try {
      const rawParent = (group.parent || "").replace(/[\x00-\x1F\x7F\u200B\uFEFF]/g, "").trim();
      const isRootGroup = !rawParent || rawParent.toLowerCase() === "primary";
      const parentAccount = resolveParentAccount(group);
      const accountType = tallyGroupToAccountType(group.name, group.parent);
      const doc = {
        account_name: group.name,
        company: companyName,
        is_group: 1
      };
      if (parentAccount) doc.parent_account = parentAccount;
      const existingKey = (group.name + " - " + companyAbbr).toLowerCase();
      const existingPlain = group.name.toLowerCase();
      let existingName = null;
      try {
        const existingCheck = await client.get(
          "/api/resource/Account/" + encodeURIComponent(group.name + " - " + companyAbbr),
          { params: { fields: '["name","parent_account","is_group"]' } }
        );
        const existingData = existingCheck?.data?.data;
        if (existingData) {
          logger.info("Account exists in ERPNext \u2192 skip: " + group.name);
          skipped++;
          erpByName.set(
            (group.name + " - " + companyAbbr).toLowerCase(),
            {
              name: group.name + " - " + companyAbbr,
              account_name: group.name,
              is_group: existingData.is_group,
              parent_account: existingData.parent_account
              // use ACTUAL parent from ERPNext
            }
          );
          await sleep(BATCH_DELAY_MS);
          continue;
        }
      } catch (_) {
      }
      if (erpByName.has(existingKey)) existingName = erpByName.get(existingKey).name;
      else if (erpByName.has(existingPlain)) existingName = erpByName.get(existingPlain).name;
      else {
        try {
          const list = await client.get("/api/resource/Account", {
            params: {
              filters: JSON.stringify([
                ["Account", "account_name", "=", group.name],
                ["Account", "company", "=", companyName]
              ]),
              fields: '["name"]',
              limit: 1
            }
          });
          existingName = list.data && list.data.data && list.data.data[0] && list.data.data[0].name;
        } catch (_) {
        }
      }
      if (existingName) {
        if (isRootGroup) {
          erpByName.set(existingName.toLowerCase(), { name: existingName, account_name: group.name, is_group: 1 });
          skipped++;
          await sleep(BATCH_DELAY_MS);
          continue;
        }
        const putDoc = { account_name: doc.account_name, company: doc.company, is_group: doc.is_group };
        await client.put("/api/resource/Account/" + encodeURIComponent(existingName), putDoc);
        updated++;
        logger.info("COA updated: " + existingName);
      } else if (isRootGroup) {
        try {
          await client.post("/api/resource/Account", Object.assign({}, doc, { doctype: "Account" }));
          created++;
          const newName = group.name + " - " + companyAbbr;
          erpByName.set(newName.toLowerCase(), { name: newName, account_name: group.name, is_group: 1 });
          logger.info("COA created: " + newName + (parentAccount ? " (parent: " + parentAccount + ")" : ""));
        } catch (postErr) {
          skipped++;
          logger.info("COA root group skipped (already managed by ERPNext COA): " + group.name);
        }
        await sleep(BATCH_DELAY_MS);
        continue;
      } else {
        await client.post("/api/resource/Account", Object.assign({}, doc, { doctype: "Account" }));
        created++;
        const newName = group.name + " - " + companyAbbr;
        erpByName.set(newName.toLowerCase(), { name: newName, account_name: group.name, is_group: 1 });
        logger.info("COA created: " + newName + (parentAccount ? " (parent: " + parentAccount + ")" : ""));
      }
      await sleep(BATCH_DELAY_MS);
    } catch (err) {
      failed++;
      const msg = parseErpError(err);
      if (errors.length < 20) errors.push({ group: group.name, error: msg });
      logger.warn("COA sync error [" + group.name + "]: " + msg);
    }
  }
  logger.success("Chart of Accounts sync done - created: " + created + ", updated: " + updated + ", skipped: " + skipped + ", failed: " + failed);
  return { created, updated, failed, errors };
}
async function resolveRootWarehouse(client, companyName, companyAbbr) {
  try {
    const res = await client.get("/api/resource/Warehouse", {
      params: {
        filters: JSON.stringify([["Warehouse", "company", "=", companyName], ["Warehouse", "is_group", "=", 1], ["Warehouse", "parent_warehouse", "=", ""]]),
        fields: '["name"]',
        limit: 1
      }
    });
    const name = res.data && res.data.data && res.data.data[0] && res.data.data[0].name;
    if (name) {
      logger.info("Root warehouse resolved: " + name);
      return name;
    }
  } catch (e) {
    logger.warn("Could not resolve root warehouse: " + e.message);
  }
  return "All Warehouses - " + companyAbbr;
}
async function syncGodownsToErpNext(godowns, companyName, creds = {}) {
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  const companyAbbr = await getCompanyAbbr(client, companyName);
  logger.info("Syncing " + godowns.length + " godowns to ERPNext for " + companyName + " (abbr: " + companyAbbr + ")");
  const rootWarehouse = await resolveRootWarehouse(client, companyName, companyAbbr);
  const results = await batchSync(client, "Warehouse", godowns, (g) => {
    const rawParent = Array.from(g.parent || "").filter((ch) => ch.charCodeAt(0) > 32 && ch.charCodeAt(0) !== 160 && ch.charCodeAt(0) !== 8203).join("").toLowerCase();
    const parentWarehouse = rawParent && rawParent !== "primary" ? (g.parent || "").trim() + " - " + companyAbbr : rootWarehouse;
    const doc = {
      warehouse_name: g.name,
      company: companyName,
      is_group: 0,
      parent_warehouse: parentWarehouse
    };
    if (g.address) {
      doc.address_line_1 = g.address.slice(0, 140);
    }
    return { filters: { name: g.name + " - " + companyAbbr }, doc };
  });
  logger.success("Godown sync done - created: " + results.created + ", updated: " + results.updated + ", failed: " + results.failed);
  return results;
}
async function syncOpeningBalancesToErpNext(ledgers, companyName, creds = {}) {
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  logger.info("Syncing opening balances for " + ledgers.length + " ledgers in " + companyName);
  try {
    let page = 0;
    const PAGE = 100;
    let totalDeleted = 0;
    while (true) {
      const res = await client.get("/api/resource/Journal Entry", {
        params: {
          filters: JSON.stringify([
            ["Journal Entry", "company", "=", companyName],
            ["Journal Entry", "user_remark", "like", "Tally Opening Balance%"]
          ]),
          fields: '["name","docstatus","title"]',
          limit: PAGE,
          limit_start: page * PAGE
        }
      });
      const rows = res.data && res.data.data || [];
      if (rows.length === 0) break;
      for (const row of rows) {
        const isOldFormat = row.title && (row.title.includes("Tally OB - Debtors") || row.title.includes("Tally OB - Creditors") || row.title.includes("Tally OB - GL"));
        const isCancelled = row.docstatus === 2;
        if (isCancelled || isOldFormat) {
          try {
            if (row.docstatus === 1) {
              const cRes = await client.get("/api/resource/Journal Entry/" + encodeURIComponent(row.name));
              const cDoc = cRes?.data?.data;
              if (cDoc) await client.post("/api/method/frappe.client.cancel", { doc: cDoc });
            }
            await client.delete("/api/resource/Journal Entry/" + encodeURIComponent(row.name));
            totalDeleted++;
          } catch (_) {
          }
        }
      }
      if (rows.length < PAGE) break;
      page++;
    }
    if (totalDeleted > 0) logger.info("[OB] Cleaned up " + totalDeleted + " cancelled/old-format OB Journal Entries");
  } catch (_) {
  }
  const companyAbbr = await getCompanyAbbr(client, companyName);
  const withBalance = ledgers.filter((l) => l.openingBalance && Math.abs(l.openingBalance) > 0);
  if (withBalance.length === 0) {
    logger.info("No ledgers with non-zero opening balances found");
    return { created: 0, updated: 0, failed: 0, skipped: ledgers.length };
  }
  logger.info("Found " + withBalance.length + " ledgers with opening balances: " + withBalance.map((l) => l.name + "=" + l.openingBalance).join(", "));
  let erpAccounts = [];
  if (_erpAccountsForRun.has(companyName)) {
    erpAccounts = _erpAccountsForRun.get(companyName);
    logger.info("Fetched " + erpAccounts.length + " accounts from ERPNext for " + companyName + " (reused COA cache)");
  } else {
    try {
      let pg = 0;
      while (true) {
        const res = await client.get("/api/resource/Account", {
          params: {
            filters: JSON.stringify([["Account", "company", "=", companyName]]),
            fields: '["name","account_name","account_type","is_group","root_type","parent_account"]',
            limit: 500,
            limit_start: pg * 500
          }
        });
        const rows = res.data && res.data.data || [];
        erpAccounts = erpAccounts.concat(rows);
        if (rows.length < 500) break;
        pg++;
      }
    } catch (e) {
      logger.error("Could not fetch ERPNext accounts: " + e.message);
    }
    logger.info("Fetched " + erpAccounts.length + " accounts from ERPNext for " + companyName);
    _erpAccountsForRun.set(companyName, erpAccounts);
  }
  const leafAccounts = erpAccounts.filter((a) => !a.is_group);
  const groupAccounts = erpAccounts.filter((a) => a.is_group);
  const byAccountName = /* @__PURE__ */ new Map();
  const byFullName = /* @__PURE__ */ new Map();
  const byGroupName = /* @__PURE__ */ new Map();
  for (const a of leafAccounts) {
    if (a.account_name) byAccountName.set(a.account_name.trim().toLowerCase(), a);
    if (a.name) byFullName.set(a.name.trim().toLowerCase(), a);
  }
  for (const a of groupAccounts) {
    if (a.account_name) byGroupName.set(a.account_name.trim().toLowerCase(), a);
    if (a.name) byGroupName.set(a.name.trim().toLowerCase(), a);
  }
  function findErpAccount(ledgerName) {
    const key = ledgerName.trim().toLowerCase();
    if (byAccountName.has(key)) return byAccountName.get(key);
    if (byFullName.has(key)) return byFullName.get(key);
    for (const [fk, fa] of byFullName) {
      if (fk.startsWith(key + " - ")) return fa;
    }
    return null;
  }
  function findControlAccount(type) {
    const PREFER_KEYWORDS = type === "Receivable" ? ["debtor", "receivable", "accounts receivable"] : ["creditor", "payable", "accounts payable"];
    const candidates = leafAccounts.filter((a) => a.account_type === type);
    const preferred = candidates.find(
      (a) => PREFER_KEYWORDS.some((k) => (a.name || "").toLowerCase().includes(k))
    );
    if (preferred) return preferred;
    const nonParty = candidates.find((a) => {
      const lower = (a.account_name || a.name || "").toLowerCase();
      return !_existingCustomers.has(lower) && !_existingSuppliers.has(lower);
    });
    return nonParty || candidates[0] || null;
  }
  const _existingCustomers = /* @__PURE__ */ new Set();
  const _existingSuppliers = /* @__PURE__ */ new Set();
  try {
    let pg = 0;
    while (true) {
      const r = await client.get("/api/resource/Customer", { params: { fields: '["customer_name"]', limit: 500, limit_start: pg * 500 } });
      const rows = r.data && r.data.data || [];
      rows.forEach((c) => _existingCustomers.add((c.customer_name || "").trim().toLowerCase()));
      if (rows.length < 500) break;
      pg++;
    }
  } catch (_) {
  }
  try {
    let pg = 0;
    while (true) {
      const r = await client.get("/api/resource/Supplier", { params: { fields: '["supplier_name"]', limit: 500, limit_start: pg * 500 } });
      const rows = r.data && r.data.data || [];
      rows.forEach((s) => _existingSuppliers.add((s.supplier_name || "").trim().toLowerCase()));
      if (rows.length < 500) break;
      pg++;
    }
  } catch (_) {
  }
  logger.info("[OB] Known customers: " + _existingCustomers.size + ", suppliers: " + _existingSuppliers.size);
  const receivableAcct = findControlAccount("Receivable");
  const payableAcct = findControlAccount("Payable");
  for (const a of leafAccounts) {
    const lowerName = (a.account_name || "").trim().toLowerCase();
    const isPartyTyped = a.account_type === "Receivable" || a.account_type === "Payable";
    const isPartyAcct = _existingCustomers.has(lowerName) || _existingSuppliers.has(lowerName);
    const isRealCtrl = a.account_type === "Receivable" && a === receivableAcct || a.account_type === "Payable" && a === payableAcct;
    if (isPartyTyped && isPartyAcct && !isRealCtrl) {
      try {
        await client.put("/api/resource/Account/" + encodeURIComponent(a.name), { account_type: "" });
        logger.info("[OB] Fixed mistyped account_type on party account: " + a.name + " (" + a.account_type + " \u2192 blank)");
      } catch (_) {
      }
    }
  }
  logger.info("Control accounts - Receivable: " + (receivableAcct ? receivableAcct.name : "NOT FOUND") + ", Payable: " + (payableAcct ? payableAcct.name : "NOT FOUND"));
  const allJERows = [];
  let skippedCount = 0;
  for (const l of withBalance) {
    l.name = (l.name || "").trim();
    const bal = l.openingBalance || 0;
    const debitAmt = bal < 0 ? Math.abs(bal) : 0;
    const creditAmt = bal > 0 ? Math.abs(bal) : 0;
    const pg = (l.parentGroup || "").toLowerCase();
    const pgIsCustomer = ["sundry debtor", "debtor", "receivable", "accounts receivable"].some((k) => pg.includes(k));
    const pgIsSupplier = ["sundry creditor", "creditor", "payable", "accounts payable"].some((k) => pg.includes(k));
    const erpIsCustomer = _existingCustomers.has(l.name.toLowerCase());
    const erpIsSupplier = _existingSuppliers.has(l.name.toLowerCase());
    const isCustomer = pgIsCustomer || erpIsCustomer;
    const isSupplier = !isCustomer && (pgIsSupplier || erpIsSupplier);
    if (isCustomer || isSupplier) {
      let controlAcct = isCustomer ? receivableAcct : payableAcct;
      if (!controlAcct) {
        const ctrlType = isCustomer ? "Receivable" : "Payable";
        const ctrlName = isCustomer ? "Sundry Debtors" : "Sundry Creditors";
        const ctrlFull = ctrlName + " - " + companyAbbr;
        const ctrlRootType = isCustomer ? "Asset" : "Liability";
        let ctrlParent = null;
        try {
          const pgRes = await client.get("/api/resource/Account", {
            params: {
              filters: JSON.stringify([
                ["Account", "root_type", "=", ctrlRootType],
                ["Account", "is_group", "=", 1],
                ["Account", "company", "=", companyName]
              ]),
              fields: '["name"]',
              limit: 1
            }
          });
          ctrlParent = pgRes?.data?.data?.[0]?.name || null;
        } catch (_) {
        }
        if (!ctrlParent) ctrlParent = (isCustomer ? "Current Assets" : "Current Liabilities") + " - " + companyAbbr;
        try {
          await client.post("/api/resource/Account", {
            doctype: "Account",
            account_name: ctrlName,
            company: companyName,
            is_group: 0,
            account_type: ctrlType,
            root_type: ctrlRootType,
            parent_account: ctrlParent,
            custom_tally_under_group: l.parentGroup || ""
          });
          logger.info("[OB] Auto-created missing control account: " + ctrlFull + " (type: " + ctrlType + ")");
          const newCtrlObj = { name: ctrlFull, account_name: ctrlName, is_group: 0, account_type: ctrlType };
          if (isCustomer) {
            if (!receivableAcct) Object.assign(receivableAcct || {}, newCtrlObj);
            controlAcct = newCtrlObj;
          } else {
            controlAcct = newCtrlObj;
          }
        } catch (ctrlErr) {
          const msg = parseErpError(ctrlErr);
          if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
            controlAcct = { name: ctrlFull, account_name: ctrlName };
            logger.info("[OB] Control account already exists: " + ctrlFull);
          } else {
            logger.warn("  " + l.name + " skipped \u2014 no " + ctrlType + " control account and could not create: " + msg);
            skippedCount++;
            continue;
          }
        }
      }
      const partySet = isCustomer ? _existingCustomers : _existingSuppliers;
      if (partySet.size > 0 && !partySet.has(l.name.toLowerCase())) {
        try {
          if (isCustomer) {
            await client.post("/api/resource/Customer", {
              doctype: "Customer",
              customer_name: l.name,
              customer_type: "Company",
              customer_group: _customerGroup || "Commercial",
              territory: _territory || "India"
            });
          } else {
            await client.post("/api/resource/Supplier", {
              doctype: "Supplier",
              supplier_name: l.name,
              supplier_type: "Company",
              supplier_group: _supplierGroup || "Services"
            });
          }
          partySet.add(l.name.toLowerCase());
          logger.info("  [OB] Auto-created " + (isCustomer ? "Customer" : "Supplier") + " for OB: " + l.name);
        } catch (partyErr) {
          const pmsg = parseErpError(partyErr);
          if (pmsg.toLowerCase().includes("duplicate") || pmsg.toLowerCase().includes("already")) {
            partySet.add(l.name.toLowerCase());
            logger.info("  [OB] Party already exists: " + l.name);
          } else {
            logger.warn("  " + l.name + " skipped \u2014 could not auto-create " + (isCustomer ? "Customer" : "Supplier") + ": " + pmsg);
            skippedCount++;
            continue;
          }
        }
      }
      allJERows.push({
        account: controlAcct.name,
        party_type: isCustomer ? "Customer" : "Supplier",
        party: l.name,
        debit_in_account_currency: debitAmt,
        credit_in_account_currency: creditAmt,
        is_advance: "No",
        user_remark: l.name + " opening balance"
      });
      logger.info("  " + l.name + " \u2192 " + (isCustomer ? "Customer" : "Supplier") + ": " + (debitAmt > 0 ? debitAmt + " Dr" : creditAmt + " Cr"));
    } else {
      let acct = findErpAccount(l.name);
      if (!acct) {
        const rootType = ["bank account", "cash-in-hand", "deposit", "loan", "asset", "stock", "debtor", "receivable"].some((k) => pg.includes(k)) ? "Asset" : ["capital", "reserve", "loan (liability)", "unsecured", "secured"].some((k) => pg.includes(k)) ? "Equity" : ["income", "sales", "revenue"].some((k) => pg.includes(k)) ? "Income" : ["expense", "purchase", "indirect", "direct expense"].some((k) => pg.includes(k)) ? "Expense" : "Liability";
        const parentGroupName = l.parentGroup || "";
        let parentAccount = null;
        if (parentGroupName) {
          const parentKey = parentGroupName.trim().toLowerCase();
          const withAbbr = parentKey + " - " + companyAbbr.toLowerCase();
          if (byGroupName.has(withAbbr)) parentAccount = byGroupName.get(withAbbr).name;
          else if (byGroupName.has(parentKey)) parentAccount = byGroupName.get(parentKey).name;
          else {
            for (const [gk, ga] of byGroupName) {
              if (gk.startsWith(parentKey)) {
                parentAccount = ga.name;
                break;
              }
            }
          }
        }
        if (!parentAccount) {
          const fallback = groupAccounts.find((a) => a.root_type === rootType && a.parent_account);
          if (fallback) parentAccount = fallback.name;
        }
        if (!parentAccount) {
          const rootAcct = groupAccounts.find((a) => a.root_type === rootType);
          if (rootAcct) parentAccount = rootAcct.name;
        }
        try {
          await client.post("/api/resource/Account", {
            doctype: "Account",
            account_name: l.name,
            company: companyName,
            is_group: 0,
            root_type: rootType,
            parent_account: parentAccount
          });
          const newName = l.name + " - " + companyAbbr;
          const newAcctObj = { name: newName, account_name: l.name, is_group: 0, root_type: rootType, account_type: "" };
          byAccountName.set(l.name.toLowerCase(), newAcctObj);
          byFullName.set(newName.toLowerCase(), newAcctObj);
          acct = newAcctObj;
          logger.info("  [OB] Auto-created missing account: " + newName + " (rootType: " + rootType + ")");
        } catch (createErr) {
          const msg = parseErpError(createErr);
          if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
            acct = findErpAccount(l.name);
            if (!acct) {
              const fallbackName = l.name + " - " + companyAbbr;
              acct = { name: fallbackName, account_name: l.name };
            }
            logger.info("  [OB] Account already exists: " + l.name);
          } else {
            logger.warn("  " + l.name + " skipped \u2014 could not auto-create account: " + msg);
            skippedCount++;
            continue;
          }
        }
      }
      allJERows.push({
        account: acct.name,
        debit_in_account_currency: debitAmt,
        credit_in_account_currency: creditAmt,
        is_advance: "No",
        user_remark: l.name + " opening balance"
      });
      logger.info("  " + l.name + " \u2192 GL '" + acct.name + "': " + (debitAmt > 0 ? debitAmt + " Dr" : creditAmt + " Cr"));
    }
  }
  if (allJERows.length === 0) {
    logger.warn("[OB] No rows resolved \u2014 all " + skippedCount + " ledgers skipped");
    return { created: 0, updated: 0, failed: skippedCount };
  }
  const totalDr = allJERows.reduce((s, r) => s + r.debit_in_account_currency, 0);
  const totalCr = allJERows.reduce((s, r) => s + r.credit_in_account_currency, 0);
  const diff = Math.round((totalDr - totalCr) * 100) / 100;
  if (Math.abs(diff) > 0.01) {
    try {
      const tmpRes = await client.get("/api/resource/Account", {
        params: {
          filters: JSON.stringify([["Account", "account_name", "=", "Temporary Opening"], ["Account", "company", "=", companyName]]),
          fields: '["name"]',
          limit: 1
        }
      });
      const tmpAcct = tmpRes.data?.data?.[0]?.name;
      if (tmpAcct) {
        allJERows.push({
          account: tmpAcct,
          debit_in_account_currency: diff < 0 ? Math.abs(diff) : 0,
          credit_in_account_currency: diff > 0 ? diff : 0,
          is_advance: "No",
          user_remark: "Balancing entry"
        });
        logger.info("[OB] Balancing row added: " + Math.abs(diff) + (diff > 0 ? " Cr" : " Dr") + " via Temporary Opening");
      } else {
        logger.warn("[OB] JE unbalanced by " + Math.abs(diff) + " \u2014 Temporary Opening account not found");
      }
    } catch (_) {
    }
  }
  const jeTitle = "Tally OB - " + companyName;
  const jeRemark = "Tally Opening Balance [" + companyName + "]";
  const fpContent = allJERows.map((r) => (r.party || r.account) + ":" + r.debit_in_account_currency + ":" + r.credit_in_account_currency).sort().join("|") + "|receivable:" + (receivableAcct ? receivableAcct.name : "") + "|payable:" + (payableAcct ? payableAcct.name : "");
  const newFp = (0, import_crypto.createHash)("md5").update(fpContent).digest("hex").slice(0, 8);
  let existingJE = null;
  try {
    const res = await client.get("/api/resource/Journal Entry", {
      params: {
        filters: JSON.stringify([
          ["Journal Entry", "title", "=", jeTitle],
          ["Journal Entry", "voucher_type", "=", "Opening Entry"],
          ["Journal Entry", "company", "=", companyName]
        ]),
        fields: '["name","docstatus","user_remark"]',
        limit: 1
      }
    });
    existingJE = res.data?.data?.[0] || null;
  } catch (_) {
  }
  if (existingJE) {
    const storedFp = ((existingJE.user_remark || "").match(/\|fp:([^\s]+)/) || [])[1] || "";
    if (storedFp === newFp && existingJE.docstatus === 1) {
      logger.info("[OB] Opening balance JE unchanged and submitted \u2014 skipping: " + existingJE.name);
      return { created: 0, updated: 0, failed: 0, skipped: withBalance.length };
    }
    if (storedFp === newFp && existingJE.docstatus === 0) {
      logger.info("[OB] Retrying submit on existing draft JE: " + existingJE.name);
      try {
        const retryRes = await client.get("/api/resource/Journal Entry/" + encodeURIComponent(existingJE.name));
        const retryDoc = retryRes?.data?.data;
        if (!retryDoc) throw new Error("Could not fetch full JE doc for retry submit: " + existingJE.name);
        await client.post("/api/method/frappe.client.submit", { doc: retryDoc });
        logger.success("[OB] Opening Entry JE submitted (retry): " + existingJE.name);
        return { created: 1, updated: 0, failed: 0 };
      } catch (submitErr) {
        logger.error("[OB] Draft submit retry failed: " + existingJE.name + " \u2014 " + parseErpError(submitErr));
        logger.error("[OB] Go to ERPNext \u2192 Journal Entry \u2192 " + existingJE.name + " to review and submit manually");
        return { created: 1, updated: 0, failed: 0 };
      }
    }
    try {
      if (existingJE.docstatus === 1) {
        const cancelRes = await client.get("/api/resource/Journal Entry/" + encodeURIComponent(existingJE.name));
        const cancelDoc = cancelRes?.data?.data;
        if (cancelDoc) await client.post("/api/method/frappe.client.cancel", { doc: cancelDoc });
      }
      await client.delete("/api/resource/Journal Entry/" + encodeURIComponent(existingJE.name));
      logger.info("[OB] Opening balances changed \u2014 replacing JE: " + existingJE.name);
    } catch (_) {
    }
  }
  let jeName = null;
  try {
    const res = await client.post("/api/resource/Journal Entry", {
      doctype: "Journal Entry",
      voucher_type: "Opening Entry",
      title: jeTitle,
      company: companyName,
      posting_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      user_remark: jeRemark + " |fp:" + newFp,
      accounts: allJERows,
      docstatus: 0
      // Draft first
    });
    jeName = res.data?.data?.name;
    logger.info("[OB] Draft Opening Entry JE created: " + jeName + " (" + allJERows.length + " rows, " + skippedCount + " skipped)");
  } catch (err) {
    logger.error("[OB] Failed to create Opening Entry JE (draft): " + parseErpError(err));
    return { created: 0, updated: 0, failed: 1 };
  }
  if (jeName) {
    try {
      await client.put("/api/resource/Journal Entry/" + encodeURIComponent(jeName), { title: jeTitle });
    } catch (_) {
    }
  }
  if (jeName) {
    try {
      const fullRes = await client.get("/api/resource/Journal Entry/" + encodeURIComponent(jeName));
      const fullDoc = fullRes?.data?.data;
      if (!fullDoc) throw new Error("Could not fetch full JE doc for submit: " + jeName);
      await client.post("/api/method/frappe.client.submit", { doc: fullDoc });
      logger.success("[OB] Opening Entry JE submitted: " + jeName + " (" + allJERows.length + " rows from " + withBalance.length + " ledgers, " + skippedCount + " skipped)");
      return { created: 1, updated: 0, failed: skippedCount };
    } catch (submitErr) {
      const errMsg = parseErpError(submitErr);
      logger.error("[OB] Opening Entry JE saved as Draft (submit failed): " + jeName + " \u2014 " + errMsg);
      logger.error("[OB] Go to ERPNext \u2192 Journal Entry \u2192 " + jeName + " to review and submit manually");
      return { created: 1, updated: 0, failed: 0 };
    }
  }
  return { created: 0, updated: 0, failed: 1 };
}
async function resolveRootCostCentre(client, companyName, companyAbbr) {
  try {
    const res = await client.get("/api/resource/Cost Center", {
      params: {
        filters: JSON.stringify([["Cost Center", "company", "=", companyName], ["Cost Center", "is_group", "=", 1], ["Cost Center", "parent_cost_center", "=", ""]]),
        fields: '["name"]',
        limit: 1
      }
    });
    const name = res.data && res.data.data && res.data.data[0] && res.data.data[0].name;
    if (name) {
      logger.info("Root cost centre resolved: " + name);
      return name;
    }
  } catch (e) {
    logger.warn("Could not resolve root cost centre: " + e.message);
  }
  return "Main - " + companyAbbr;
}
async function syncCostCentresToErpNext(costCentres, companyName, creds = {}) {
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  const companyAbbr = await getCompanyAbbr(client, companyName);
  logger.info("Syncing " + costCentres.length + " cost centres to ERPNext for " + companyName + " (abbr: " + companyAbbr + ")");
  const rootCostCentre = await resolveRootCostCentre(client, companyName, companyAbbr);
  const _existingCostCenters = /* @__PURE__ */ new Set();
  try {
    let pg = 0;
    while (true) {
      const res = await client.get("/api/resource/Cost Center", {
        params: {
          fields: '["name","cost_center_name"]',
          limit: 500,
          limit_start: pg * 500,
          filters: JSON.stringify([["Cost Center", "company", "=", companyName]])
        }
      });
      const rows = res.data && res.data.data || [];
      rows.forEach((r) => {
        if (r.name) _existingCostCenters.add(r.name.trim().toLowerCase());
        if (r.cost_center_name) _existingCostCenters.add(r.cost_center_name.trim().toLowerCase());
      });
      if (rows.length < 500) break;
      pg++;
    }
    logger.info("Cost Centre sync: fetched " + _existingCostCenters.size + " existing cost centers");
  } catch (e) {
    logger.warn("Cost Centre sync: could not pre-fetch existing cost centers \u2014 " + e.message);
  }
  const sorted = costCentres.slice().sort((a, b) => {
    const aIsRoot = !a.parent || a.parent.trim().toLowerCase() === "primary";
    const bIsRoot = !b.parent || b.parent.trim().toLowerCase() === "primary";
    if (aIsRoot && !bIsRoot) return -1;
    if (!aIsRoot && bIsRoot) return 1;
    return (a.parent || "").localeCompare(b.parent || "");
  });
  const _groupFixedCostCentres = /* @__PURE__ */ new Set();
  async function ensureCostCentreIsGroup(parentName) {
    if (!parentName || _groupFixedCostCentres.has(parentName)) return;
    _groupFixedCostCentres.add(parentName);
    try {
      const chkRes = await client.get("/api/resource/Cost Center/" + encodeURIComponent(parentName), {
        params: { fields: '["name","is_group"]' }
      });
      const isGroup = chkRes?.data?.data?.is_group;
      if (isGroup === 0 || isGroup === false) {
        await client.put("/api/resource/Cost Center/" + encodeURIComponent(parentName), { is_group: 1 });
        logger.info("[CC] Auto-converted to group node: " + parentName);
      }
    } catch (_) {
    }
  }
  const parentNames = /* @__PURE__ */ new Set();
  for (const cc of sorted) {
    if (cc.parent && cc.parent.trim().toLowerCase() !== "primary") {
      const withSuffix = cc.parent.trim() + " - " + companyAbbr;
      parentNames.add(withSuffix);
    }
  }
  for (const parentName of parentNames) {
    await ensureCostCentreIsGroup(parentName);
  }
  const results = await batchSync(client, "Cost Center", sorted, (cc) => {
    const doc = {
      cost_center_name: cc.name,
      company: companyName,
      is_group: 0
    };
    if (cc.parent && cc.parent.trim().toLowerCase() !== "primary") {
      const withSuffix = (cc.parent.trim() + " - " + companyAbbr).toLowerCase();
      const plain = cc.parent.trim().toLowerCase();
      if (_existingCostCenters.has(withSuffix)) {
        doc.parent_cost_center = cc.parent.trim() + " - " + companyAbbr;
      } else if (_existingCostCenters.has(plain)) {
        doc.parent_cost_center = cc.parent.trim();
      } else {
        doc.parent_cost_center = cc.parent.trim() + " - " + companyAbbr;
      }
    } else {
      doc.parent_cost_center = rootCostCentre;
    }
    _existingCostCenters.add((cc.name + " - " + companyAbbr).toLowerCase());
    return { filters: { cost_center_name: cc.name }, doc };
  });
  logger.success("Cost centres sync done - created: " + results.created + ", updated: " + results.updated + ", failed: " + results.failed);
  return results;
}
async function autoCreateFiscalYear(client, dateStr, companyName) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  const fyName = fyStart + "-" + fyEnd;
  const startDate = fyStart + "-04-01";
  const endDate = fyEnd + "-03-31";
  try {
    const fyRes = await client.get("/api/resource/Fiscal Year/" + encodeURIComponent(fyName));
    const fyDoc = fyRes && fyRes.data && fyRes.data.data || {};
    const companies = fyDoc.companies || [];
    if (!companies.some((c) => c.company === companyName)) {
      companies.push({ company: companyName });
      await client.put("/api/resource/Fiscal Year/" + encodeURIComponent(fyName), { companies });
      logger.info("[FY] Linked " + companyName + " to existing Fiscal Year: " + fyName);
    }
    return true;
  } catch (_) {
  }
  try {
    await client.post("/api/resource/Fiscal Year", {
      doctype: "Fiscal Year",
      year: fyName,
      year_start_date: startDate,
      year_end_date: endDate,
      companies: [{ company: companyName }]
    });
    logger.info("[FY] Auto-created Fiscal Year: " + fyName + " (" + startDate + " to " + endDate + ") for " + companyName);
    return true;
  } catch (err) {
    const msg = parseErpError(err);
    if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
      logger.info("[FY] Fiscal Year already exists: " + fyName);
      return true;
    }
    logger.warn("[FY] Could not auto-create Fiscal Year " + fyName + ": " + msg);
    return false;
  }
}
async function syncInvoicesToErpNext(vouchers, companyName, creds = {}, voucherTypeResolver = null) {
  const client = createErpClient(creds);
  const tallyCompanyName = creds && creds._tallyCompanyName || companyName.trim();
  companyName = await resolveErpNextCompany(client, companyName, creds);
  const companyAbbr = await getCompanyAbbr(client, companyName);
  logger.info("Syncing invoices to ERPNext for " + companyName + " (abbr: " + companyAbbr + ") | Tally company: " + tallyCompanyName);
  await ensureHsnNotMandatory(client);
  await ensureTallyCustomFields(client);
  await resolveGroups(client);
  for (const doctype2 of ["Customer", "Supplier"]) {
    try {
      const res = await client.get("/api/resource/Custom Field", {
        params: {
          filters: JSON.stringify([
            ["Custom Field", "dt", "=", doctype2],
            ["Custom Field", "fieldname", "=", "custom_tally_is_transporter"]
          ]),
          fields: '["name","fieldtype"]',
          limit: 1
        }
      });
      const row = (res?.data?.data || [])[0];
      if (row && row.fieldtype !== "Data") {
        await client.put("/api/resource/Custom Field/" + encodeURIComponent(row.name), {
          fieldtype: "Data"
        });
        logger.info("[Fix] Patched custom_tally_is_transporter to Data on " + doctype2);
      }
    } catch (e) {
      logger.warn("[Fix] Could not patch custom_tally_is_transporter on " + doctype2 + ": " + e.message);
    }
    await sleep(300);
  }
  const resolveBase = voucherTypeResolver || ((name) => name);
  const salesVouchers = vouchers.filter((v) => {
    const base2 = resolveBase(v.voucherType);
    return base2 === "Sales" || base2 === "Credit Note" || (v.voucherType || "").toLowerCase().includes("sales invoice");
  });
  const purchaseVouchers = vouchers.filter((v) => {
    const base2 = resolveBase(v.voucherType || "")?.trim()?.toLowerCase();
    return base2 === "purchase" || base2 === "debit note" || (v.voucherType || "").toLowerCase().includes("purchase invoice");
  });
  logger.info("Invoice breakdown - sales: " + salesVouchers.length + ", purchase: " + purchaseVouchers.length);
  async function ensureLeafAccount(ledgerName, rootType, parentGroupHint) {
    const resolved = await resolveAccount(client, ledgerName, companyAbbr, companyName);
    if (resolved) {
      try {
        const chk = await client.get("/api/resource/Account/" + encodeURIComponent(resolved), {
          params: { fields: '["is_group","account_type"]' }
        });
        const acctData = chk && chk.data && chk.data.data;
        if (acctData && !acctData.is_group) {
          const badTypes = ["Payable", "Receivable"];
          const expectedType = rootType === "Income" ? "Income Account" : "Expense Account";
          if (acctData.account_type && badTypes.includes(acctData.account_type)) {
            try {
              await client.put("/api/resource/Account/" + encodeURIComponent(resolved), {
                account_type: expectedType,
                root_type: rootType
              });
              logger.info("[Invoice] Fixed account_type on " + resolved + ": " + acctData.account_type + " \u2192 " + expectedType);
            } catch (_) {
            }
          }
          logger.info("[Invoice] income/expense account resolved: " + ledgerName + " \u2192 " + resolved);
          return resolved;
        }
        logger.info("[Invoice] " + resolved + ' is a GROUP \u2014 will auto-create leaf "' + ledgerName + " - " + companyAbbr + '" under it');
      } catch (_) {
      }
    }
    const suffixedName = ledgerName + " - " + companyAbbr;
    let parentAccount = resolved || null;
    if (!parentAccount && parentGroupHint) {
      try {
        const hintRes = await client.get("/api/resource/Account", {
          params: {
            filters: JSON.stringify([
              ["Account", "account_name", "like", "%" + parentGroupHint + "%"],
              ["Account", "company", "=", companyName],
              ["Account", "is_group", "=", 1]
            ]),
            fields: '["name"]',
            limit: 1
          }
        });
        const found = hintRes && hintRes.data && hintRes.data.data && hintRes.data.data[0] && hintRes.data.data[0].name;
        if (found) parentAccount = found;
      } catch (_) {
      }
    }
    if (!parentAccount) {
      try {
        const rtRes = await client.get("/api/resource/Account", {
          params: {
            filters: JSON.stringify([
              ["Account", "root_type", "=", rootType],
              ["Account", "company", "=", companyName],
              ["Account", "is_group", "=", 1]
            ]),
            fields: '["name"]',
            limit: 1
          }
        });
        const found = rtRes && rtRes.data && rtRes.data.data && rtRes.data.data[0] && rtRes.data.data[0].name;
        if (found) parentAccount = found;
      } catch (_) {
      }
    }
    const accountType = rootType === "Income" ? "Income Account" : "Expense Account";
    try {
      await client.post("/api/resource/Account", {
        doctype: "Account",
        account_name: ledgerName,
        company: companyName,
        is_group: 0,
        account_type: accountType,
        root_type: rootType,
        parent_account: parentAccount
      });
      logger.info('[Invoice] Auto-created leaf account: "' + suffixedName + '" under ' + parentAccount);
      _accountCache.set(ledgerName + "::" + companyAbbr, suffixedName);
    } catch (err) {
      const msg = parseErpError(err);
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
        logger.info("[Invoice] Leaf account already exists: " + suffixedName);
      } else {
        logger.warn('[Invoice] Could not auto-create leaf account "' + suffixedName + '": ' + msg);
      }
    }
    return suffixedName;
  }
  const incomeAccount = await ensureLeafAccount("Sales", "Income", "Sales Accounts") || "Sales - " + companyAbbr;
  const expenseAccount = await ensureLeafAccount("Purchase", "Expense", "Purchase Accounts") || "Purchase - " + companyAbbr;
  logger.info("[Invoice] Global income account: " + incomeAccount + ", expense account: " + expenseAccount);
  const salesMapper = async (v) => {
    const resolvedIncomeAccount = v._resolvedSalesAccount || incomeAccount;
    const tallyCC = v.salesCostCentre || v.firstCostCentre || null;
    const costCenterERP = tallyCC ? tallyCC + " - " + companyAbbr : null;
    const inventoryRows = (v.inventoryItems || []).map((i) => {
      const qty = i.qty || 1;
      const amount = i.amount || 0;
      const rate = i.rate || amount / qty || 0;
      const row = {
        item_code: i.itemName,
        item_name: i.itemName,
        qty,
        rate: Math.abs(rate),
        amount: Math.abs(amount) || Math.abs(rate * qty),
        income_account: resolvedIncomeAccount
        // Tally sales ledger → ERPNext income account
      };
      if (i.godownName) row.warehouse = i.godownName + " - " + companyAbbr;
      if (i.batchName && i.batchName.trim().toLowerCase() !== "primary batch")
        row.batch_no = i.batchName;
      if (costCenterERP) row.cost_center = costCenterERP;
      return row;
    });
    const partyName = (v.partyName || "").trim().toLowerCase();
    const salesLedgerKey = (v.salesLedgerName || "").trim().toLowerCase();
    const ledgerRows = (v.entries || []).filter((e) => {
      const key = (e.ledger || "").trim().toLowerCase();
      return key && key !== partyName && key !== salesLedgerKey && Math.abs(e.amount || 0) > 1e-3;
    }).map((e) => {
      const ledgerAccount = v._resolvedLedgerEntryAccounts && v._resolvedLedgerEntryAccounts[e.ledger] || e.ledger + " - " + companyAbbr;
      const amt = Math.abs(e.amount || 0);
      const row = {
        item_code: e.ledger,
        // use ledger name as item_code (auto-created in pre-sync)
        item_name: e.ledger,
        qty: 1,
        rate: amt,
        amount: amt,
        income_account: ledgerAccount
      };
      if (costCenterERP) row.cost_center = costCenterERP;
      return row;
    });
    const items = inventoryRows.length > 0 || ledgerRows.length > 0 ? [...inventoryRows, ...ledgerRows] : [{
      item_code: "Sales Item",
      item_name: "Sales Item",
      qty: 1,
      rate: v.netAmount || 0,
      income_account: resolvedIncomeAccount,
      ...costCenterERP ? { cost_center: costCenterERP } : {}
    }];
    const vSalesNum = v.voucherNumber || v.voucherDate + "-" + (v.voucherType || "Sales") + "-" + (v.guid || "").slice(-6);
    const salesRemarks = "Tally Voucher No: " + vSalesNum + (v.narration ? " | " + v.narration : "");
    if (!v.voucherDate) {
      logger.warn("Sales voucher missing voucherDate \u2014 check Tally DATE field", { voucher: vSalesNum, guid: v.guid });
    }
    const effectiveSalesDate = v.voucherDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let debitToAccount = "Debtors - " + companyAbbr;
    try {
      const recRes = await client.get("/api/resource/Account", {
        params: {
          filters: JSON.stringify([
            ["Account", "account_type", "=", "Receivable"],
            ["Account", "company", "=", companyName],
            ["Account", "is_group", "=", 0]
          ]),
          fields: '["name"]',
          limit: 1
        }
      });
      const recAcct = recRes?.data?.data?.[0]?.name;
      if (recAcct) debitToAccount = recAcct;
    } catch (_) {
    }
    return {
      // Use `remarks` (real DB column, unique per voucher) as the idempotency key.
      filters: { remarks: salesRemarks },
      doc: {
        title: "Tally:" + vSalesNum,
        customer: v.partyName || "Walk-in Customer",
        posting_date: effectiveSalesDate,
        // Tally voucher date (not today)
        due_date: v.dueDate || effectiveSalesDate,
        // Tally bill due date, else voucher date
        set_posting_time: 1,
        // preserve Tally date, not today
        company: companyName,
        // ── Receivable account (debit_to) ───────────────────────────────────────
        // This is the "Current balance" / party account Tally shows at the top of
        // the voucher screen (e.g. "ABCDTraders - Debtors"). ERPNext calls it debit_to.
        debit_to: debitToAccount,
        // ── Tally voucher number storage ────────────────────────────────────────
        // po_no   = "Customer's PO No." — always visible in Sales Invoice list view.
        //           We store the Tally number here so it appears in the ID/No. column.
        // custom_tally_voucher_no = our own custom field (created by ensureTallyCustomFields).
        //           Provides a searchable, non-overwritable copy of the Tally number.
        po_no: v.referenceNo || vSalesNum,
        // supplier ref / Tally bill ref
        custom_tally_voucher_no: vSalesNum,
        custom_tally_id: v.guid || vSalesNum,
        // ── Tally Sales Ledger + Balance fields ─────────────────────────────────
        // These three fields mirror what Tally shows at the top of the Sales voucher:
        //   "Sales ledger : Sales"              → custom_tally_sales_ledger
        //   "Current balance : 25,68,68,636 Dr" → custom_tally_party_balance
        //   "Current balance : 5,59,40,29,876 Cr" → custom_tally_sales_ledger_balance
        custom_tally_sales_ledger: v.salesLedgerName || "",
        custom_tally_party_balance: v._tallyPartyBalance || "",
        custom_tally_sales_ledger_balance: v._tallySalesLedgerBalance || "",
        // ── Narration → additional notes on the ERPNext invoice ─────────────────
        // Tally's narration is the free-text memo on the voucher (shown below entries).
        // Map it to both remarks (idempotency key) and terms (visible on invoice PDF).
        remarks: salesRemarks,
        terms: v.narration || "",
        // Tally narration → Terms & Conditions field
        items
      }
    };
  };
  const purchaseMapper = async (v) => {
    const resolvedExpenseAccount = v._resolvedPurchaseLedgerAccount || expenseAccount;
    const tallyCC = v.salesCostCentre || v.firstCostCentre || null;
    const costCenterERP = tallyCC ? tallyCC + " - " + companyAbbr : null;
    const inventoryRowsP = (v.inventoryItems || []).map((i) => {
      const qty = i.qty || 1;
      const amount = i.amount || 0;
      const rate = i.rate || amount / qty || 0;
      const row = {
        item_code: i.itemName,
        item_name: i.itemName,
        qty,
        rate: Math.abs(rate),
        amount: Math.abs(amount) || Math.abs(rate * qty),
        expense_account: resolvedExpenseAccount
      };
      if (i.godownName) row.warehouse = i.godownName + " - " + companyAbbr;
      const rawBatchP = (i.batchName || "").trim();
      if (rawBatchP && rawBatchP.toLowerCase() !== "primary batch" && !/^\d+$/.test(rawBatchP))
        row.batch_no = rawBatchP;
      if (costCenterERP) row.cost_center = costCenterERP;
      return row;
    });
    const partyKeyPI = (v.partyName || "").trim().toLowerCase();
    const ledgerKeyPI = (v.salesLedgerName || "").trim().toLowerCase();
    const ledgerRowsP = (v.entries || []).filter((e) => {
      const k = (e.ledger || "").trim().toLowerCase();
      return k && k !== partyKeyPI && k !== ledgerKeyPI && Math.abs(e.amount || 0) > 1e-3;
    }).map((e) => {
      const ledgerAccount = v._resolvedLedgerEntryAccounts && v._resolvedLedgerEntryAccounts[e.ledger] || e.ledger + " - " + companyAbbr;
      const amt = Math.abs(e.amount || 0);
      const row = {
        item_code: e.ledger,
        item_name: e.ledger,
        qty: 1,
        rate: amt,
        amount: amt,
        expense_account: ledgerAccount
      };
      if (costCenterERP) row.cost_center = costCenterERP;
      return row;
    });
    const items = inventoryRowsP.length > 0 || ledgerRowsP.length > 0 ? [...inventoryRowsP, ...ledgerRowsP] : [{
      item_code: "Purchase Item",
      item_name: "Purchase Item",
      qty: 1,
      rate: v.netAmount || 0,
      expense_account: resolvedExpenseAccount,
      ...costCenterERP ? { cost_center: costCenterERP } : {}
    }];
    const vPurchaseNum = v.voucherNumber || v.voucherDate + "-" + (v.voucherType || "Purchase") + "-" + (v.guid || "").slice(-6);
    const purchaseRemarks = "Tally Voucher No: " + vPurchaseNum + (v.narration ? " | " + v.narration : "");
    if (!v.voucherDate) {
      logger.warn("Purchase voucher missing voucherDate \u2014 check Tally DATE field", { voucher: vPurchaseNum, guid: v.guid });
    }
    const effectivePurchaseDate = v.voucherDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const creditToAccount = v._resolvedCreditToAccount || "Creditors - " + companyAbbr;
    return {
      filters: { remarks: purchaseRemarks },
      doc: {
        title: "Tally:" + vPurchaseNum,
        supplier: v.partyName || "Unknown Supplier",
        posting_date: effectivePurchaseDate,
        // Tally voucher date (not today)
        set_posting_time: 1,
        // preserve Tally date, not today
        company: companyName,
        credit_to: creditToAccount,
        // Tally party ledger → ERPNext Payable account
        bill_no: v.referenceNo || vPurchaseNum,
        // supplier invoice number
        bill_date: effectivePurchaseDate,
        // Supplier invoice date = Tally voucher date
        due_date: v.dueDate || effectivePurchaseDate,
        // Tally bill due date, else voucher date
        remarks: purchaseRemarks,
        terms: v.narration || "",
        // Tally narration → Terms & Conditions
        custom_tally_id: v.guid || vPurchaseNum,
        items
      }
    };
  };
  const FALLBACK_CUSTOMER = "Walk-in Customer";
  const FALLBACK_SUPPLIER = "Unknown Supplier";
  for (const [doctype2, name, group] of [
    ["Customer", FALLBACK_CUSTOMER, _customerGroup || "Commercial"],
    ["Supplier", FALLBACK_SUPPLIER, _supplierGroup || "Services"]
  ]) {
    try {
      await client.get("/api/resource/" + doctype2 + "/" + encodeURIComponent(name));
    } catch (_) {
      try {
        if (doctype2 === "Customer") {
          await client.post("/api/resource/Customer", {
            doctype: "Customer",
            customer_name: name,
            customer_type: "Individual",
            customer_group: group
          });
        } else {
          await client.post("/api/resource/Supplier", {
            doctype: "Supplier",
            supplier_name: name,
            supplier_type: "Individual",
            supplier_group: group
          });
        }
        logger.info("Auto-created fallback party: " + name + " (" + doctype2 + ")");
      } catch (e) {
        logger.warn('Could not create fallback party "' + name + '": ' + parseErpError(e));
      }
    }
  }
  for (const code of ["Sales Item", "Purchase Item"]) {
    try {
      await client.get("/api/resource/Item/" + encodeURIComponent(code));
      logger.info("Placeholder item already exists: " + code);
    } catch (_) {
      try {
        await client.post("/api/resource/Item", {
          doctype: "Item",
          item_code: code,
          item_name: code,
          item_group: "All Item Groups",
          stock_uom: "Nos",
          is_stock_item: 0,
          is_sales_item: 1,
          is_purchase_item: 1
        });
        logger.info("Created placeholder item: " + code);
      } catch (firstErr) {
        try {
          await ensureHsnCode(client, "99999999");
          await client.post("/api/resource/Item", {
            doctype: "Item",
            item_code: code,
            item_name: code,
            item_group: "All Item Groups",
            stock_uom: "Nos",
            is_stock_item: 0,
            is_sales_item: 1,
            is_purchase_item: 1,
            gst_hsn_code: "99999999"
          });
          logger.info("Created placeholder item (with fallback HSN): " + code);
        } catch (createErr) {
          const msg = parseErpError(createErr);
          logger.warn('Could not create placeholder item "' + code + '": ' + msg + " \u2014 invoices using this item will fail");
        }
      }
    }
  }
  if (purchaseVouchers.length > 0) {
    const uniqueSupplierNames = [
      ...new Set(
        purchaseVouchers.map((v) => (v.partyName || "").trim()).filter(Boolean).filter((n) => n !== "Unknown Supplier")
      )
    ];
    if (uniqueSupplierNames.length > 0) {
      logger.info("Pre-syncing " + uniqueSupplierNames.length + " suppliers before Purchase Invoice batch");
      for (const supplierName of uniqueSupplierNames) {
        try {
          await client.get("/api/resource/Supplier/" + encodeURIComponent(supplierName));
        } catch (_) {
          try {
            await client.post("/api/resource/Supplier", {
              doctype: "Supplier",
              supplier_name: supplierName,
              supplier_type: "Company",
              supplier_group: _supplierGroup || "Services"
            });
            logger.info("Auto-created supplier: " + supplierName);
          } catch (sErr) {
            logger.warn('Could not auto-create supplier "' + supplierName + '": ' + parseErpError(sErr));
          }
          await sleep(300);
        }
      }
    }
  }
  if (salesVouchers.length > 0) {
    const uniqueCustomerNames = [
      ...new Set(
        salesVouchers.map((v) => (v.partyName || "").trim()).filter(Boolean).filter((n) => n !== "Unknown Customer" && n !== "Walk-in Customer")
      )
    ];
    if (uniqueCustomerNames.length > 0) {
      logger.info("Pre-syncing " + uniqueCustomerNames.length + " customers before Sales Invoice batch");
      for (const customerName of uniqueCustomerNames) {
        try {
          const res = await client.get("/api/resource/Customer", {
            params: { filters: JSON.stringify([["Customer", "customer_name", "=", customerName]]), limit: 1 }
          });
          const exists = (res?.data?.data || []).length > 0;
          if (!exists) throw new Error("not found");
        } catch (_) {
          try {
            await client.post("/api/resource/Customer", {
              doctype: "Customer",
              customer_name: customerName,
              customer_type: "Company",
              customer_group: _customerGroup || "Commercial"
            });
            logger.info("Auto-created customer: " + customerName);
          } catch (cErr) {
            logger.warn('Could not auto-create customer "' + customerName + '": ' + parseErpError(cErr));
          }
          await sleep(300);
        }
      }
    }
  }
  const allVouchersForItems = [...salesVouchers, ...purchaseVouchers];
  const uniqueItemNames = [
    ...new Set([
      // Stock item names from inventory entries
      ...allVouchersForItems.flatMap((v) => (v.inventoryItems || []).map((i) => (i.itemName || "").trim())).filter(Boolean),
      // Ledger entry names that will become extra item rows
      ...allVouchersForItems.flatMap((v) => {
        const pKey = (v.partyName || "").trim().toLowerCase();
        const sKey = (v.salesLedgerName || "").trim().toLowerCase();
        return (v.entries || []).filter((e) => {
          const k = (e.ledger || "").trim().toLowerCase();
          return k && k !== pKey && k !== sKey && Math.abs(e.amount || 0) > 1e-3;
        }).map((e) => e.ledger.trim());
      }).filter(Boolean)
    ].filter((n) => n !== "Sales Item" && n !== "Purchase Item"))
  ];
  if (uniqueItemNames.length > 0) {
    logger.info("Pre-syncing " + uniqueItemNames.length + " Tally stock items to ERPNext before invoice batch");
    for (const itemName of uniqueItemNames) {
      try {
        await client.get("/api/resource/Item/" + encodeURIComponent(itemName));
      } catch (_) {
        try {
          await client.post("/api/resource/Item", {
            doctype: "Item",
            item_code: itemName,
            item_name: itemName,
            item_group: "All Item Groups",
            stock_uom: "Nos",
            is_stock_item: 0,
            // non-stock keeps things simple
            is_sales_item: 1,
            is_purchase_item: 1
          });
          logger.info("Auto-created item from Tally: " + itemName);
        } catch (firstErr) {
          try {
            await ensureHsnCode(client, "99999999");
            await client.post("/api/resource/Item", {
              doctype: "Item",
              item_code: itemName,
              item_name: itemName,
              item_group: "All Item Groups",
              stock_uom: "Nos",
              is_stock_item: 0,
              is_sales_item: 1,
              is_purchase_item: 1,
              gst_hsn_code: "99999999"
            });
            logger.info("Auto-created item (with fallback HSN): " + itemName);
          } catch (createErr) {
            logger.warn('Could not auto-create item "' + itemName + '": ' + parseErpError(createErr) + " \u2014 invoice lines for this item may fall back to placeholder");
          }
        }
        await sleep(300);
      }
    }
  }
  function fmtTallyBalance(amount) {
    if (amount === null || amount === void 0 || amount === 0) return "0.00";
    const abs = Math.abs(amount).toFixed(2);
    const [intPart, decPart] = abs.split(".");
    let formatted = "";
    if (intPart.length <= 3) {
      formatted = intPart;
    } else {
      const last3 = intPart.slice(-3);
      const rest = intPart.slice(0, -3);
      formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
    }
    const drCr = amount < 0 ? "Dr" : "Cr";
    return formatted + "." + decPart + " " + drCr;
  }
  let _ledgerBalanceMap = /* @__PURE__ */ new Map();
  try {
    const { fetchTallyLedgers: fetchTallyLedgers2 } = await Promise.resolve().then(() => (init_tallyClient(), tallyClient_exports));
    logger.info("[Invoice] Fetching ledger balances from Tally company: " + tallyCompanyName);
    const allLedgers = await fetchTallyLedgers2(tallyCompanyName);
    for (const l of allLedgers) {
      if (l.name) _ledgerBalanceMap.set(l.name.trim().toLowerCase(), l.closingBalance ?? 0);
    }
    logger.info("[Invoice] Loaded " + _ledgerBalanceMap.size + " ledger balances for balance mapping");
  } catch (e) {
    logger.warn("[Invoice] Could not load ledger balances (party/sales-ledger balance fields will be blank): " + e.message);
  }
  for (const v of salesVouchers) {
    const partyKey = (v.partyName || "").trim().toLowerCase();
    const partyBal = _ledgerBalanceMap.has(partyKey) ? _ledgerBalanceMap.get(partyKey) : null;
    v._tallyPartyBalance = partyBal !== null ? fmtTallyBalance(partyBal) : "";
    const salesLedgerKey = (v.salesLedgerName || "").trim().toLowerCase();
    const salesLedgerBal = _ledgerBalanceMap.has(salesLedgerKey) ? _ledgerBalanceMap.get(salesLedgerKey) : null;
    v._tallySalesLedgerBalance = salesLedgerBal !== null ? fmtTallyBalance(salesLedgerBal) : "";
  }
  const _salesAccountCache = /* @__PURE__ */ new Map();
  const _debitToCache = /* @__PURE__ */ new Map();
  for (const v of salesVouchers) {
    if (v.salesLedgerName && !_salesAccountCache.has(v.salesLedgerName)) {
      try {
        const resolved = await ensureLeafAccount(v.salesLedgerName, "Income", "Sales Accounts");
        _salesAccountCache.set(v.salesLedgerName, resolved || incomeAccount);
      } catch (_) {
        _salesAccountCache.set(v.salesLedgerName, incomeAccount);
      }
    }
    v._resolvedSalesAccount = v.salesLedgerName ? _salesAccountCache.get(v.salesLedgerName) || incomeAccount : incomeAccount;
    const partyKeyPre = (v.partyName || "").trim().toLowerCase();
    const salesKeyPre = (v.salesLedgerName || "").trim().toLowerCase();
    v._resolvedLedgerEntryAccounts = {};
    for (const e of v.entries || []) {
      const k = (e.ledger || "").trim().toLowerCase();
      if (!k || k === partyKeyPre || k === salesKeyPre || Math.abs(e.amount || 0) <= 1e-3) continue;
      if (!_salesAccountCache.has(e.ledger)) {
        try {
          const resolved = await ensureLeafAccount(e.ledger, "Income", "Sales Accounts");
          _salesAccountCache.set(e.ledger, resolved || e.ledger + " - " + companyAbbr);
        } catch (_) {
          _salesAccountCache.set(e.ledger, e.ledger + " - " + companyAbbr);
        }
      }
      v._resolvedLedgerEntryAccounts[e.ledger] = _salesAccountCache.get(e.ledger) || e.ledger + " - " + companyAbbr;
    }
    const customerKey = (v.partyName || "Walk-in Customer").trim();
    if (!_debitToCache.has(customerKey)) {
      try {
        const cRes = await client.get("/api/resource/Customer/" + encodeURIComponent(customerKey), {
          params: { fields: '["name","accounts"]' }
        });
        const accts = cRes?.data?.data?.accounts || [];
        const companyAcct = accts.find((a) => a.company === companyName);
        _debitToCache.set(customerKey, companyAcct?.account || "Debtors - " + companyAbbr);
      } catch (_) {
        _debitToCache.set(customerKey, "Debtors - " + companyAbbr);
      }
    }
    v._resolvedDebitToAccount = _debitToCache.get(customerKey) || "Debtors - " + companyAbbr;
  }
  const _creditToCache = /* @__PURE__ */ new Map();
  const _purchaseAccountCache = /* @__PURE__ */ new Map();
  for (const v of purchaseVouchers) {
    if (v.salesLedgerName && !_purchaseAccountCache.has(v.salesLedgerName)) {
      try {
        const resolved = await ensureLeafAccount(v.salesLedgerName, "Expense", "Purchase Accounts");
        _purchaseAccountCache.set(v.salesLedgerName, resolved || expenseAccount);
      } catch (_) {
        _purchaseAccountCache.set(v.salesLedgerName, expenseAccount);
      }
    }
    v._resolvedPurchaseLedgerAccount = v.salesLedgerName ? _purchaseAccountCache.get(v.salesLedgerName) || expenseAccount : expenseAccount;
    const partyKeyP = (v.partyName || "").trim().toLowerCase();
    const ledgerKeyP = (v.salesLedgerName || "").trim().toLowerCase();
    v._resolvedLedgerEntryAccounts = v._resolvedLedgerEntryAccounts || {};
    for (const e of v.entries || []) {
      const k = (e.ledger || "").trim().toLowerCase();
      if (!k || k === partyKeyP || k === ledgerKeyP || Math.abs(e.amount || 0) <= 1e-3) continue;
      if (!_purchaseAccountCache.has(e.ledger)) {
        try {
          const resolved = await ensureLeafAccount(e.ledger, "Expense", "Purchase Accounts");
          _purchaseAccountCache.set(e.ledger, resolved || e.ledger + " - " + companyAbbr);
        } catch (_) {
          _purchaseAccountCache.set(e.ledger, e.ledger + " - " + companyAbbr);
        }
      }
      v._resolvedLedgerEntryAccounts[e.ledger] = _purchaseAccountCache.get(e.ledger) || e.ledger + " - " + companyAbbr;
    }
    const supplierKey = (v.partyName || "Unknown Supplier").trim();
    if (!_creditToCache.has(supplierKey)) {
      let resolvedCreditTo = "Creditors - " + companyAbbr;
      try {
        const sRes = await client.get("/api/resource/Supplier/" + encodeURIComponent(supplierKey), {
          params: { fields: '["name","accounts"]' }
        });
        const accts = sRes?.data?.data?.accounts || [];
        const companyAcct = accts.find((a) => a.company === companyName);
        if (companyAcct?.account) {
          try {
            const acctRes = await client.get("/api/resource/Account/" + encodeURIComponent(companyAcct.account), {
              params: { fields: '["account_type"]' }
            });
            if (acctRes?.data?.data?.account_type === "Payable") {
              resolvedCreditTo = companyAcct.account;
            } else {
              logger.warn("[Invoice] Supplier " + supplierKey + " account " + companyAcct.account + " is not Payable type \u2014 using Creditors control account");
            }
          } catch (_) {
          }
        }
      } catch (_) {
      }
      _creditToCache.set(supplierKey, resolvedCreditTo);
    }
    v._resolvedCreditToAccount = _creditToCache.get(supplierKey) || "Creditors - " + companyAbbr;
  }
  async function batchSyncWithBatchRetry(doctype2, vouchers2, mapper) {
    const submitHook = async (docName) => {
      try {
        const fullRes = await client.get(
          "/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(docName)
        );
        const fullDoc = fullRes?.data?.data;
        if (!fullDoc || fullDoc.docstatus !== 0) return;
        const postingDate = fullDoc.posting_date;
        await client.post("/api/method/frappe.client.submit", { doc: fullDoc });
      } catch (submitErr) {
        const errMsg = parseErpError(submitErr);
        if (errMsg.toLowerCase().includes("fiscal year") || errMsg.toLowerCase().includes("not in any active")) {
          try {
            const fullRes2 = await client.get(
              "/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(docName)
            );
            const fullDoc2 = fullRes2?.data?.data;
            if (!fullDoc2 || fullDoc2.docstatus !== 0) return;
            const fyCreated = await autoCreateFiscalYear(client, fullDoc2.posting_date, companyName);
            if (fyCreated) {
              const fullRes3 = await client.get(
                "/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(docName)
              );
              const fullDoc3 = fullRes3?.data?.data;
              if (fullDoc3 && fullDoc3.docstatus === 0) {
                await client.post("/api/method/frappe.client.submit", { doc: fullDoc3 });
              }
            } else {
              throw new Error("Could not auto-create fiscal year");
            }
          } catch (retryErr) {
            const retryMsg = parseErpError(retryErr);
            logger.warn("[Submit] " + doctype2 + " " + docName + " (retry): " + retryMsg);
            throw new Error(retryMsg);
          }
        } else {
          logger.warn("[Submit] " + doctype2 + " " + docName + ": " + errMsg);
          throw new Error(errMsg);
        }
      }
    };
    const primaryResults = await batchSync(client, doctype2, vouchers2, mapper, null, submitHook);
    const batchErrVouchers = [];
    for (const v of vouchers2) {
      const mapped = await mapper(v);
      if (mapped.doc && mapped.doc.items && mapped.doc.items.some((i) => i.batch_no)) batchErrVouchers.push(v);
    }
    if (batchErrVouchers.length === 0) return primaryResults;
    let retryCreated = 0, retryFailed = 0;
    for (const v of batchErrVouchers) {
      const { filters, doc } = await mapper(v);
      try {
        const key = filters.remarks;
        if (!key) continue;
        const chk = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
          params: { filters: JSON.stringify([[doctype2, "remarks", "like", key.split(" | ")[0] + "%"]]), fields: '["name","docstatus"]', limit: 1 }
        });
        if (chk?.data?.data?.[0]) continue;
      } catch (_) {
      }
      const docNoBatch = Object.assign({}, doc, {
        items: (doc.items || []).map((i) => {
          const row = Object.assign({}, i);
          delete row.batch_no;
          return row;
        })
      });
      try {
        await client.post("/api/resource/" + encodeURIComponent(doctype2), Object.assign({}, docNoBatch, { doctype: doctype2 }));
        retryCreated++;
        logger.info("[BatchRetry] Created " + doctype2 + " without batch_no: " + (filters.remarks || ""));
      } catch (retryErr) {
        retryFailed++;
        logger.warn("[BatchRetry] Still failed after stripping batch_no: " + parseErpError(retryErr));
      }
      await sleep(300);
    }
    if (retryCreated > 0) logger.info("[BatchRetry] Recovered " + retryCreated + " invoice(s) by stripping Tally batch numbers");
    return {
      created: primaryResults.created + retryCreated,
      updated: primaryResults.updated,
      failed: Math.max(0, primaryResults.failed - retryCreated) + retryFailed,
      skipped: primaryResults.skipped || 0
    };
  }
  const salesResults = await batchSyncWithBatchRetry("Sales Invoice", salesVouchers, salesMapper);
  const purchaseResults = await batchSyncWithBatchRetry("Purchase Invoice", purchaseVouchers, purchaseMapper);
  logger.info("Renaming Sales Invoices to Tally voucher numbers...");
  let renamed = 0, renameSkipped = 0, renameFailed = 0;
  const _registeredSeries = /* @__PURE__ */ new Set();
  async function ensureNamingSeries(prefix) {
    if (!prefix || _registeredSeries.has(prefix)) return;
    _registeredSeries.add(prefix);
    const seriesEntry = prefix + ".####";
    try {
      await client.post("/api/method/frappe.model.document_naming_settings.add_prefix", {
        doctype: "Sales Invoice",
        prefix: seriesEntry
      });
      logger.info("[Rename] Registered naming series via add_prefix: " + seriesEntry);
      return;
    } catch (_) {
    }
    try {
      const optRes = await client.post("/api/method/frappe.client.get_value", {
        doctype: "DocType",
        filters: { name: "Sales Invoice" },
        fieldname: ["autoname"]
      });
      const currentOptions = optRes?.data?.message?.autoname || "";
      if (!currentOptions.includes(prefix)) {
        const newOptions = currentOptions ? currentOptions + "\n" + seriesEntry : seriesEntry;
        await client.post("/api/method/frappe.client.set_default", {
          key: "Sales Invoice-naming_series-options",
          value: newOptions
        });
        logger.info("[Rename] Registered naming series via set_default: " + seriesEntry);
      }
      return;
    } catch (_) {
    }
    try {
      await client.post("/api/resource/Series", {
        name: prefix,
        current: 0
      });
      logger.info("[Rename] Registered naming series via Series doctype: " + prefix);
      return;
    } catch (e3) {
      const msg = parseErpError(e3);
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
        logger.info("[Rename] Series already registered: " + prefix);
        return;
      }
      logger.warn("[Rename] Could not register naming series " + seriesEntry + " (all methods failed): " + msg + " \u2014 invoices will still be created but shown with SINV-XXXXX names instead of Tally numbers");
    }
  }
  const uniquePrefixes = /* @__PURE__ */ new Set();
  for (const v of salesVouchers) {
    if (v.voucherNumber && !/^\d+$/.test(String(v.voucherNumber).trim())) {
      const m = String(v.voucherNumber).match(/^([A-Za-z]+\/)/);
      if (m) uniquePrefixes.add(m[1]);
    }
  }
  if (uniquePrefixes.size > 0) {
    logger.info("[Rename] Pre-registering " + uniquePrefixes.size + " naming series prefix(es): " + [...uniquePrefixes].join(", "));
    for (const prefix of uniquePrefixes) {
      await ensureNamingSeries(prefix);
    }
  }
  for (const v of salesVouchers) {
    const vNum = v.voucherNumber;
    if (!vNum) {
      renameSkipped++;
      continue;
    }
    if (/^\d+$/.test(String(vNum).trim())) {
      renameSkipped++;
      continue;
    }
    try {
      const remarksPrefix = "Tally Voucher No: " + vNum;
      const listRes = await client.get("/api/resource/Sales Invoice", {
        params: {
          filters: JSON.stringify([["Sales Invoice", "remarks", "like", remarksPrefix + "%"]]),
          fields: '["name","docstatus"]',
          limit: 1
        }
      });
      const existing = listRes?.data?.data?.[0];
      if (!existing) {
        renameSkipped++;
        logger.warn("Rename: no doc found for Tally voucher " + vNum);
        continue;
      }
      if (existing.name === String(vNum)) {
        renameSkipped++;
        continue;
      }
      if (existing.docstatus === 1) {
        renameSkipped++;
        logger.warn("Rename skipped (submitted): " + existing.name);
        continue;
      }
      await client.post("/api/method/frappe.client.rename_doc", {
        doctype: "Sales Invoice",
        old_name: existing.name,
        new_name: vNum,
        merge: false
      });
      renamed++;
      logger.info("Renamed Sales Invoice " + existing.name + " \u2192 " + vNum);
    } catch (e) {
      renameFailed++;
      logger.warn("Could not rename Sales Invoice to " + vNum + ": " + (e?.response?.data?.message || e?.message || e));
    }
    await sleep(300);
  }
  logger.info("Sales Invoice rename complete: " + renamed + " renamed, " + renameSkipped + " skipped, " + renameFailed + " failed");
  async function submitDraftInvoices(doctype2, vouchers2) {
    let submitted = 0, failed = 0, fiscalYearMissing = 0;
    for (const v of vouchers2) {
      const effectiveNum = v.voucherNumber || v.voucherDate + "-" + (v.voucherType || doctype2.replace(" Invoice", "")) + "-" + (v.guid || "").slice(-6);
      try {
        const remarksPrefix = "Tally Voucher No: " + effectiveNum;
        const list = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
          params: { filters: JSON.stringify([[doctype2, "remarks", "like", remarksPrefix + "%"]]), fields: '["name","docstatus"]', limit: 1 }
        });
        const stub = list?.data?.data?.[0];
        if (!stub) continue;
        if (stub.docstatus === 1) continue;
        const fullRes = await client.get("/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(stub.name));
        const fullDoc = fullRes?.data?.data;
        if (!fullDoc) continue;
        await client.post("/api/method/frappe.client.submit", { doc: fullDoc });
        submitted++;
      } catch (e) {
        const errMsg = parseErpError(e);
        if (errMsg.toLowerCase().includes("fiscal year") || errMsg.toLowerCase().includes("not in any active")) {
          fiscalYearMissing++;
          const vDate = v.voucherDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          const fyCreated = await autoCreateFiscalYear(client, vDate, companyName);
          if (fyCreated) {
            try {
              const retryList = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
                params: { filters: JSON.stringify([[doctype2, "remarks", "like", "Tally Voucher No: " + effectiveNum + "%"]]), fields: '["name","docstatus"]', limit: 1 }
              });
              const retryStub = retryList?.data?.data?.[0];
              if (retryStub && retryStub.docstatus === 0) {
                const retryFull = await client.get("/api/resource/" + encodeURIComponent(doctype2) + "/" + encodeURIComponent(retryStub.name));
                const retryDoc = retryFull?.data?.data;
                if (retryDoc) {
                  await client.post("/api/method/frappe.client.submit", { doc: retryDoc });
                  submitted++;
                  fiscalYearMissing--;
                  logger.info("[" + doctype2 + "] Submitted after auto-creating fiscal year: " + effectiveNum);
                }
              }
            } catch (retryErr) {
              logger.warn("[" + doctype2 + "] Retry after fiscal year create failed for " + effectiveNum + ": " + parseErpError(retryErr));
            }
          } else if (fiscalYearMissing === 1) {
            logger.warn("[" + doctype2 + "] Fiscal Year missing for date " + vDate + " \u2014 could not auto-create. Re-run sync after creating it manually.");
          }
        } else {
          failed++;
          logger.warn("Could not submit " + doctype2 + " for voucher " + effectiveNum + ": " + errMsg);
        }
      }
      await sleep(200);
    }
    if (fiscalYearMissing > 0) {
      logger.warn("Submit " + doctype2 + ": " + submitted + " submitted, " + failed + " failed, " + fiscalYearMissing + " pending fiscal year setup in ERPNext");
    } else {
      logger.info("Submit " + doctype2 + ": " + submitted + " submitted, " + failed + " failed");
    }
  }
  logger.success("Invoice sync done - sales: +" + salesResults.created + " new/" + salesResults.updated + " updated/" + salesResults.failed + " failed | purchase: +" + purchaseResults.created + " new/" + purchaseResults.updated + " updated/" + purchaseResults.failed + " failed");
  return { sales: salesResults, purchase: purchaseResults };
}
async function ensureBankExists(client, bankName) {
  if (!bankName) return;
  try {
    await client.get(
      "/api/resource/Bank/" + encodeURIComponent(bankName)
    );
    return;
  } catch (_) {
  }
  await client.post(
    "/api/resource/Bank",
    {
      doctype: "Bank",
      bank_name: bankName
    }
  );
  logger.info(
    `[Bank] Auto-created ${bankName}`
  );
}
async function syncBankLedgersToErpNext(ledgers, companyName, creds = {}) {
  const client = createErpClient(creds);
  const companyAbbr = await getCompanyAbbr(client, companyName);
  const BANK_ACCT_CUSTOM_FIELDS = [
    // ── Section Header ──────────────────────────────────────────
    {
      fieldname: "custom_tally_bank_details_section",
      label: "Tally Bank Details",
      fieldtype: "Section Break",
      in_list_view: 0,
      insert_after: "branch_code"
    },
    { fieldname: "custom_tally_bank_branch", label: "Branch", in_list_view: 0, insert_after: "custom_tally_bank_details_section" },
    { fieldname: "custom_tally_bsr_code", label: "BSR Code", in_list_view: 0, insert_after: "custom_tally_bank_branch" },
    { fieldname: "custom_tally_gstin", label: "GSTIN", in_list_view: 1, insert_after: "custom_tally_bsr_code" },
    { fieldname: "custom_tally_mailing_name", label: "Mailing Name", in_list_view: 0, insert_after: "custom_tally_gstin" },
    { fieldname: "custom_tally_address", label: "Address", in_list_view: 0, insert_after: "custom_tally_mailing_name" },
    { fieldname: "custom_tally_state", label: "State", in_list_view: 0, insert_after: "custom_tally_address" },
    { fieldname: "custom_tally_country", label: "Country", in_list_view: 0, insert_after: "custom_tally_state" },
    { fieldname: "custom_tally_pincode", label: "Pincode", in_list_view: 0, insert_after: "custom_tally_country" },
    { fieldname: "custom_tally_mobile", label: "Mobile No", in_list_view: 0, insert_after: "custom_tally_pincode" },
    { fieldname: "custom_tally_alias", label: "Tally Alias", in_list_view: 1, insert_after: "custom_tally_mobile" },
    { fieldname: "custom_tally_under_group", label: "Tally Under Group", in_list_view: 1, insert_after: "custom_tally_alias" }
  ];
  for (const { fieldname, label, in_list_view } of BANK_ACCT_CUSTOM_FIELDS) {
    const cacheKey = "Bank Account::" + fieldname;
    if (!_knownCustomFields.has(cacheKey)) {
      try {
        const existing = await client.get("/api/resource/Custom Field", {
          params: { filters: JSON.stringify([["Custom Field", "dt", "=", "Bank Account"], ["Custom Field", "fieldname", "=", fieldname]]), fields: '["name","in_list_view","insert_after"]', limit: 1 }
        });
        const rows = existing?.data?.data || [];
        if (rows.length > 0) {
          if (in_list_view && !rows[0].in_list_view)
            await client.put("/api/resource/Custom Field/" + encodeURIComponent(rows[0].name), { in_list_view: 1 }).catch(() => {
            });
        } else {
          await client.post("/api/resource/Custom Field", { doctype: "Custom Field", dt: "Bank Account", fieldname, label, read_only: 1, in_list_view });
        }
        _knownCustomFields.add(cacheKey);
      } catch (_) {
        _knownCustomFields.add(cacheKey);
      }
      await sleep(150);
    }
  }
  const bankLedgers = ledgers.filter((l) => {
    const pg = (l.parentGroup || "").toLowerCase();
    return pg.includes("bank account") || pg.includes("bank od");
  });
  if (bankLedgers.length === 0) {
    logger.info("[Bank Account] No bank ledgers found \u2014 skipping Bank Account sync");
    return { synced: 0, failed: 0 };
  }
  logger.info("[Bank Account] Syncing " + bankLedgers.length + " bank ledger(s) to Bank Account master");
  let synced = 0;
  let failed = 0;
  let created = 0;
  let updated = 0;
  for (const l of bankLedgers) {
    await ensureBankExists(
      client,
      l.bankName
    );
    const ledgerName = (l.name || "").trim();
    if (!ledgerName) continue;
    const glAccountName = ledgerName + " - " + companyAbbr;
    try {
      const existing = await client.get("/api/resource/Bank Account", {
        params: {
          fields: JSON.stringify(["name"]),
          filters: JSON.stringify([
            ["Bank Account", "account", "=", glAccountName]
          ]),
          limit_page_length: 1
        }
      });
      const existingName = existing?.data?.data?.[0]?.name || null;
      const doc = {
        doctype: "Bank Account",
        account_name: ledgerName,
        company: companyName,
        account: glAccountName,
        is_company_account: 1,
        bank_account_no: l.bankAccount || "",
        branch_code: l.ifsc || "",
        swift_number: l.swiftCode || "",
        bank: l.bankName || "Unknown Bank",
        bank_account_holder_name: l.holderName || ledgerName,
        custom_tally_bsr_code: l.bsrCode || "",
        custom_tally_bank_branch: l.bankBranch || "",
        custom_tally_gstin: l.gstin || "",
        custom_tally_mailing_name: ledgerName,
        custom_tally_address: l.address || "",
        custom_tally_country: "India",
        custom_tally_pincode: l.pincode || "",
        custom_tally_mobile: l.phone || "",
        custom_tally_alias: l.alias || "",
        custom_tally_under_group: l.parentGroup || ""
      };
      if (existingName) {
        await client.put(
          "/api/resource/Bank Account/" + encodeURIComponent(existingName),
          doc
        );
        logger.info(
          "[Bank Account] Updated: " + ledgerName + " (" + glAccountName + ")"
        );
        updated++;
      } else {
        logger.info(
          `[Bank Account DEBUG] Creating Bank Account for ${ledgerName}`
        );
        const accountName = l.name + " - " + companyAbbr;
        try {
          await client.get("/api/resource/Account/" + encodeURIComponent(accountName));
        } catch {
          try {
            const bankGroupRes = await client.get("/api/resource/Account", {
              params: {
                filters: JSON.stringify([
                  ["Account", "account_type", "=", "Bank"],
                  ["Account", "company", "=", companyName],
                  ["Account", "is_group", "=", 1]
                ]),
                fields: '["name"]',
                limit: 1
              }
            });
            const bankParent = bankGroupRes?.data?.data?.[0]?.name || "Bank Accounts - " + companyAbbr;
            await client.post("/api/resource/Account", {
              doctype: "Account",
              account_name: l.name,
              company: companyName,
              account_type: "Bank",
              root_type: "Asset",
              is_group: 0,
              parent_account: bankParent
            });
            logger.info("[Bank Account] Auto-created GL Account: " + accountName);
          } catch (createErr) {
            const msg = parseErpError(createErr);
            if (!msg.toLowerCase().includes("duplicate") && !msg.toLowerCase().includes("already")) {
              logger.warn("[BANK SKIP] Could not create GL Account " + accountName + ": " + msg);
              continue;
            }
            logger.info("[Bank Account] GL Account already exists: " + accountName);
          }
        }
        await client.post(
          "/api/resource/Bank Account",
          doc
        );
        logger.info(
          "[Bank Account] Created: " + ledgerName + " (" + glAccountName + ")"
        );
        created++;
      }
      synced++;
    } catch (err) {
      logger.warn(
        `[Bank Account] Failed for "${ledgerName}" | status=${err?.response?.status} | message=${err?.response?.data?.exception || err.message}`
      );
      failed++;
    }
    await sleep(300);
  }
  logger.info("[Bank Account] Done \u2014 synced: " + synced + ", failed: " + failed);
  return {
    created,
    updated,
    synced,
    failed
  };
}
async function smartSyncLedgersToErpNext(vouchers, allLedgers, creds = {}) {
  const usedLedgerNames = /* @__PURE__ */ new Set();
  for (const v of vouchers) {
    if (v.partyName) usedLedgerNames.add(v.partyName.trim());
    if (v.entries && Array.isArray(v.entries)) {
      for (const e of v.entries) {
        if (e.ledger) usedLedgerNames.add(e.ledger.trim());
      }
    }
  }
  logger.info("Smart Ledger Sync: found " + usedLedgerNames.size + " unique ledgers used in vouchers");
  const filteredLedgers = allLedgers.filter((l) => usedLedgerNames.has((l.name || "").trim()));
  logger.info("Smart Ledger Sync: matched " + filteredLedgers.length + " / " + allLedgers.length + " total ledgers");
  const matchedNames = new Set(filteredLedgers.map((l) => l.name.trim()));
  const unmatched = [...usedLedgerNames].filter((n) => !matchedNames.has(n));
  if (unmatched.length > 0) {
    logger.warn("Smart Ledger Sync: " + unmatched.length + " ledger(s) in vouchers not found in Tally masters: " + unmatched.slice(0, 10).join(", ") + (unmatched.length > 10 ? "..." : ""));
  }
  if (filteredLedgers.length === 0) {
    logger.warn("Smart Ledger Sync: no matching ledgers found \u2014 skipping");
    return { customers: { created: 0, updated: 0, failed: 0 }, suppliers: { created: 0, updated: 0, failed: 0 }, skipped: 0 };
  }
  return await syncLedgersToErpNext(filteredLedgers, creds);
}
async function runFullSync(companyName, tallyData, options, creds = {}) {
  if (!options) options = {};
  resetCancel();
  clearCaches();
  const tallyCompanyName = companyName.trim();
  creds = { ...creds, _tallyCompanyName: tallyCompanyName };
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  try {
    await client.get("/api/resource/Company/" + encodeURIComponent(companyName));
  } catch (e) {
    const status = e.response && e.response.status;
    if (status === 404) {
      const msg = `ERPNext company "${companyName}" not found. Please check the company name in Step 1 \u2014 it must match exactly (case-sensitive) with the company name in ERPNext.`;
      logger.error(msg);
      return {
        startedAt: (/* @__PURE__ */ new Date()).toISOString(),
        company: companyName,
        status: "failed",
        steps: {},
        errors: [msg],
        finishedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  const result = {
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    company: companyName,
    status: "running",
    steps: {},
    errors: [],
    finishedAt: null
  };
  const ping = await pingErpNext(creds);
  result.steps.erpnextPing = { status: ping.connected ? "ok" : "fail", latencyMs: ping.latencyMs, error: ping.error };
  if (!ping.connected) {
    result.status = "failed";
    result.errors.push("ERPNext not reachable: " + ping.error);
    result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    return result;
  }
  async function runStep(key, fn) {
    try {
      let countFailed = function(r) {
        if (!r || typeof r !== "object") return 0;
        if (typeof r.failed === "number") return r.failed;
        if (r.customers || r.suppliers) {
          return (r.customers && r.customers.failed || 0) + (r.suppliers && r.suppliers.failed || 0);
        }
        if (r.sales || r.purchase) {
          return (r.sales && r.sales.failed || 0) + (r.purchase && r.purchase.failed || 0);
        }
        if (r.paymentEntries || r.journalEntries) {
          return (r.paymentEntries && r.paymentEntries.failed || 0) + (r.journalEntries && r.journalEntries.failed || 0);
        }
        return 0;
      };
      const res = await fn();
      const totalFailed = countFailed(res);
      result.steps[key] = Object.assign({}, res, { status: totalFailed === 0 && !res.error ? "ok" : "warn" });
    } catch (e) {
      if (e._cancelled) {
        result.steps[key] = { status: "cancelled" };
        result.status = "cancelled";
        result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
        logger.info("Sync cancelled by user during step: " + key);
        throw e;
      }
      result.steps[key] = { status: "fail", error: e.message };
      result.errors.push(key + ": " + e.message);
    }
  }
  try {
    if (options.syncChartOfAccounts && tallyData.groups && tallyData.groups.length > 0)
      await runStep("chartOfAccounts", () => syncChartOfAccountsToErpNext(tallyData.groups, companyName, creds));
    if (options.syncLedgers) {
      if (globalThis._lastLedgerSyncResult) {
        result.steps.ledgers = globalThis._lastLedgerSyncResult;
        logger.info(
          "Using cached ledger sync result"
        );
      } else {
        const ledgerResult = await syncLedgersToErpNext(
          tallyData.allLedgers || tallyData.ledgers || [],
          creds
        );
        globalThis._lastLedgerSyncResult = ledgerResult;
        result.steps.ledgers = {
          ...ledgerResult,
          status: "ok"
        };
      }
    }
    tallyData._ledgersAlreadySynced = true;
    if (options.syncSmartLedgers && tallyData.ledgers && tallyData.ledgers.length > 0 && tallyData.vouchers && tallyData.vouchers.length > 0)
      await runStep("smartLedgers", () => smartSyncLedgersToErpNext(tallyData.vouchers, tallyData.ledgers, creds));
    if (options.syncOpeningBalances && tallyData.ledgers && tallyData.ledgers.length > 0)
      await runStep("openingBalances", () => syncOpeningBalancesToErpNext(tallyData.ledgers, companyName, creds));
    if (options.syncGodowns && tallyData.godowns && tallyData.godowns.length > 0)
      await runStep("godowns", () => syncGodownsToErpNext(tallyData.godowns, companyName, creds));
    if (options.syncCostCentres && tallyData.costCentres && tallyData.costCentres.length > 0)
      await runStep("costCentres", () => syncCostCentresToErpNext(tallyData.costCentres, companyName, creds));
    if (options.syncStock && tallyData.stockItems && tallyData.stockItems.length > 0)
      await runStep("stockItems", () => syncStockToErpNext(tallyData.stockItems, creds));
    if ((options.syncVouchers || options.syncInvoices) && tallyData.vouchers && tallyData.vouchers.length > 0) {
      let voucherTypeResolver = null;
      try {
        const { fetchTallyVoucherTypes: fetchTallyVoucherTypes2 } = await Promise.resolve().then(() => (init_tallyClient(), tallyClient_exports));
        const tallyCompany = creds._tallyCompanyName || companyName;
        const voucherTypes = await fetchTallyVoucherTypes2(tallyCompany);
        voucherTypeResolver = buildVoucherTypeResolver(voucherTypes);
        logger.info("Voucher type resolver built \u2014 " + voucherTypes.length + " types mapped");
      } catch (e) {
        logger.warn("Could not build voucher type resolver \u2014 custom types will fall back to Journal Entry: " + e.message);
      }
      if (options.syncVouchers)
        await runStep("vouchers", () => syncVouchersToErpNext(tallyData.vouchers, companyName, creds, voucherTypeResolver));
      if (options.syncInvoices)
        await runStep("invoices", () => syncInvoicesToErpNext(tallyData.vouchers, companyName, creds, voucherTypeResolver));
    }
    if ((options.syncLedgers || options.syncSmartLedgers) && tallyData.allLedgers && tallyData.allLedgers.length > 0)
      await runStep("bankAccounts", () => syncBankLedgersToErpNext(tallyData.allLedgers, companyName, creds));
    if (options.syncTaxes && tallyData.stockItems && tallyData.stockItems.length > 0)
      await runStep("taxes", () => syncTaxesToErpNext(tallyData.stockItems, companyName, creds));
  } catch (e) {
    if (e._cancelled) {
      result.finishedAt = result.finishedAt || (/* @__PURE__ */ new Date()).toISOString();
      logger.info("Full sync stopped by user \u2014 partial results returned");
      return result;
    }
    throw e;
  }
  const CRITICAL_STEPS = /* @__PURE__ */ new Set(["erpnextPing", "chartOfAccounts", "vouchers"]);
  const hasCriticalFail = Object.entries(result.steps).some(
    ([key, s]) => s.status === "fail" && CRITICAL_STEPS.has(key)
  );
  const hasAnyFail = Object.values(result.steps).some((s) => s.status === "fail");
  const hasWarn = Object.values(result.steps).some((s) => s.status === "warn");
  result.status = hasCriticalFail ? "failed" : hasAnyFail || hasWarn ? "warning" : "ok";
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  logger.info("Full sync complete: " + result.status, { company: companyName });
  return result;
}
function _normaliseSalesInvoice(doc) {
  return {
    name: doc.name,
    doctype: "Sales Invoice",
    postingDate: doc.posting_date || null,
    dueDate: doc.due_date || null,
    customer: doc.customer || null,
    customerName: doc.customer_name || doc.customer || null,
    company: doc.company || null,
    currency: doc.currency || "INR",
    conversionRate: doc.conversion_rate || 1,
    grandTotal: doc.grand_total || 0,
    netTotal: doc.net_total || 0,
    totalTaxes: doc.total_taxes_and_charges || 0,
    outstandingAmount: doc.outstanding_amount || 0,
    remarks: doc.remarks || doc.remark || null,
    isReturn: doc.is_return || 0,
    amendedFrom: doc.amended_from || null,
    items: (doc.items || []).map((it) => ({
      itemCode: it.item_code || null,
      itemName: it.item_name || it.item_code || null,
      qty: it.qty || 0,
      rate: it.rate || 0,
      amount: it.amount || 0,
      discountAmount: it.discount_amount || 0,
      incomeAccount: it.income_account || null,
      costCentre: it.cost_center || null,
      warehouse: it.warehouse || null,
      hsnCode: it.gst_hsn_code || it.hsn_code || null,
      uom: it.uom || null
    })),
    taxes: (doc.taxes || []).map((tx) => ({
      chargeType: tx.charge_type || "On Net Total",
      accountHead: tx.account_head || null,
      rate: tx.rate || 0,
      amount: tx.amount || 0,
      description: tx.description || null
    })),
    customFields: doc.custom_tally_voucher_no || null,
    raw: doc
  };
}
async function fetchSalesInvoices(creds = {}, options = {}) {
  const client = createErpClient(creds);
  const {
    fromDate,
    toDate,
    limit = 50,
    filters: extraFilters = []
  } = options;
  const doctype2 = "Sales Invoice";
  const filters = [
    ["Sales Invoice", "docstatus", "=", 1]
  ];
  if (fromDate) filters.push(["Sales Invoice", "posting_date", ">=", fromDate]);
  if (toDate) filters.push(["Sales Invoice", "posting_date", "<=", toDate]);
  for (const f of extraFilters) filters.push(f);
  const allInvoices = [];
  let start = 0;
  const pageSize = Math.min(limit, 100);
  logger.info("Fetching " + doctype2 + " from ERPNext" + (fromDate ? " (" + fromDate + " \u2192 " + (toDate || "latest") + ")" : ""));
  while (true) {
    const page = await withRetry(async () => {
      const res = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
        params: {
          filters: JSON.stringify(filters),
          fields: JSON.stringify([
            "name",
            "posting_date",
            "due_date",
            "customer",
            "customer_name",
            "company",
            "currency",
            "conversion_rate",
            "grand_total",
            "net_total",
            "total_taxes_and_charges",
            "outstanding_amount",
            "remarks",
            "remark",
            "is_return",
            "amended_from",
            "items.item_code",
            "items.item_name",
            "items.qty",
            "items.rate",
            "items.amount",
            "items.discount_amount",
            "items.income_account",
            "items.cost_center",
            "items.warehouse",
            "items.gst_hsn_code",
            "items.hsn_code",
            "items.uom",
            "taxes.charge_type",
            "taxes.account_head",
            "taxes.rate",
            "taxes.amount",
            "taxes.description",
            "custom_tally_voucher_no"
          ]),
          limit_page_length: pageSize,
          limit_start: start,
          order_by: "posting_date asc, name asc"
        }
      });
      return res.data;
    }, doctype2 + " fetch page " + start);
    const rows = page.data || [];
    allInvoices.push(...rows.map(_normaliseSalesInvoice));
    logger.info("Fetched " + rows.length + " " + doctype2 + " (total so far: " + allInvoices.length + ")");
    if (rows.length < pageSize) break;
    start += pageSize;
    await sleep(_throttle.delay());
  }
  logger.info("Total " + doctype2 + " fetched: " + allInvoices.length);
  return allInvoices;
}
function _normalisePurchaseInvoice(doc) {
  return {
    name: doc.name,
    doctype: "Purchase Invoice",
    postingDate: doc.posting_date || null,
    dueDate: doc.due_date || null,
    supplier: doc.supplier || null,
    supplierName: doc.supplier_name || doc.supplier || null,
    company: doc.company || null,
    currency: doc.currency || "INR",
    conversionRate: doc.conversion_rate || 1,
    grandTotal: doc.grand_total || 0,
    netTotal: doc.net_total || 0,
    totalTaxes: doc.total_taxes_and_charges || 0,
    outstandingAmount: doc.outstanding_amount || 0,
    remarks: doc.remarks || doc.remark || null,
    isReturn: doc.is_return || 0,
    amendedFrom: doc.amended_from || null,
    billNo: doc.bill_no || null,
    billDate: doc.bill_date || null,
    items: (doc.items || []).map((it) => ({
      itemCode: it.item_code || null,
      itemName: it.item_name || it.item_code || null,
      qty: it.qty || 0,
      rate: it.rate || 0,
      amount: it.amount || 0,
      discountAmount: it.discount_amount || 0,
      expenseAccount: it.expense_account || null,
      costCentre: it.cost_center || null,
      warehouse: it.warehouse || null,
      hsnCode: it.gst_hsn_code || it.hsn_code || null,
      uom: it.uom || null
    })),
    taxes: (doc.taxes || []).map((tx) => ({
      chargeType: tx.charge_type || "On Net Total",
      accountHead: tx.account_head || null,
      rate: tx.rate || 0,
      amount: tx.amount || 0,
      description: tx.description || null
    })),
    raw: doc
  };
}
async function fetchPurchaseInvoices(creds = {}, options = {}) {
  const client = createErpClient(creds);
  const {
    fromDate,
    toDate,
    limit = 50,
    filters: extraFilters = []
  } = options;
  const doctype2 = "Purchase Invoice";
  const filters = [
    ["Purchase Invoice", "docstatus", "=", 1]
  ];
  if (fromDate) filters.push(["Purchase Invoice", "posting_date", ">=", fromDate]);
  if (toDate) filters.push(["Purchase Invoice", "posting_date", "<=", toDate]);
  for (const f of extraFilters) filters.push(f);
  const allInvoices = [];
  let start = 0;
  const pageSize = Math.min(limit, 100);
  logger.info("Fetching " + doctype2 + " from ERPNext" + (fromDate ? " (" + fromDate + " \u2192 " + (toDate || "latest") + ")" : ""));
  while (true) {
    const page = await withRetry(async () => {
      const res = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
        params: {
          filters: JSON.stringify(filters),
          fields: JSON.stringify([
            "name",
            "posting_date",
            "due_date",
            "supplier",
            "supplier_name",
            "company",
            "currency",
            "conversion_rate",
            "grand_total",
            "net_total",
            "total_taxes_and_charges",
            "outstanding_amount",
            "remarks",
            "remark",
            "is_return",
            "amended_from",
            "bill_no",
            "bill_date",
            "items.item_code",
            "items.item_name",
            "items.qty",
            "items.rate",
            "items.amount",
            "items.discount_amount",
            "items.expense_account",
            "items.cost_center",
            "items.warehouse",
            "items.gst_hsn_code",
            "items.hsn_code",
            "items.uom",
            "taxes.charge_type",
            "taxes.account_head",
            "taxes.rate",
            "taxes.amount",
            "taxes.description"
          ]),
          limit_page_length: pageSize,
          limit_start: start,
          order_by: "posting_date asc, name asc"
        }
      });
      return res.data;
    }, doctype2 + " fetch page " + start);
    const rows = page.data || [];
    allInvoices.push(...rows.map(_normalisePurchaseInvoice));
    logger.info("Fetched " + rows.length + " " + doctype2 + " (total so far: " + allInvoices.length + ")");
    if (rows.length < pageSize) break;
    start += pageSize;
    await sleep(_throttle.delay());
  }
  logger.info("Total " + doctype2 + " fetched: " + allInvoices.length);
  return allInvoices;
}
function _normaliseExpenseEntry(doc) {
  return {
    name: doc.name,
    doctype: "Payment Entry",
    postingDate: doc.posting_date || null,
    paymentType: doc.payment_type || null,
    partyType: doc.party_type || null,
    partyName: doc.party_name || null,
    party: doc.party || null,
    company: doc.company || null,
    currency: doc.currency || "INR",
    paidAmount: doc.paid_amount || 0,
    receivedAmount: doc.received_amount || 0,
    totalAmount: doc.paid_amount || doc.received_amount || 0,
    paidFrom: doc.paid_from || null,
    paidTo: doc.paid_to || null,
    references: (doc.references || []).map((ref) => ({
      referenceDoctype: ref.reference_doctype || null,
      referenceName: ref.reference_name || null,
      allocatedAmount: ref.allocated_amount || 0
    })),
    remarks: doc.remarks || null,
    referenceNo: doc.reference_no || null,
    referenceDate: doc.reference_date || null,
    raw: doc
  };
}
async function fetchExpenseEntries(creds = {}, options = {}) {
  const client = createErpClient(creds);
  const {
    fromDate,
    toDate,
    limit = 50,
    filters: extraFilters = []
  } = options;
  const doctype2 = "Payment Entry";
  const filters = [
    ["Payment Entry", "docstatus", "=", 1]
  ];
  if (fromDate) filters.push(["Payment Entry", "posting_date", ">=", fromDate]);
  if (toDate) filters.push(["Payment Entry", "posting_date", "<=", toDate]);
  for (const f of extraFilters) filters.push(f);
  const allEntries = [];
  let start = 0;
  const pageSize = Math.min(limit, 100);
  logger.info("Fetching " + doctype2 + " from ERPNext" + (fromDate ? " (" + fromDate + " \u2192 " + (toDate || "latest") + ")" : ""));
  while (true) {
    const page = await withRetry(async () => {
      const res = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
        params: {
          filters: JSON.stringify(filters),
          fields: JSON.stringify([
            "name",
            "posting_date",
            "payment_type",
            "party_type",
            "party_name",
            "party",
            "company",
            "currency",
            "paid_amount",
            "received_amount",
            "paid_from",
            "paid_to",
            "references.reference_doctype",
            "references.reference_name",
            "references.allocated_amount",
            "remarks",
            "reference_no",
            "reference_date"
          ]),
          limit_page_length: pageSize,
          limit_start: start,
          order_by: "posting_date asc, name asc"
        }
      });
      return res.data;
    }, doctype2 + " fetch page " + start);
    const rows = page.data || [];
    allEntries.push(...rows.map(_normaliseExpenseEntry));
    logger.info("Fetched " + rows.length + " " + doctype2 + " (total so far: " + allEntries.length + ")");
    if (rows.length < pageSize) break;
    start += pageSize;
    await sleep(_throttle.delay());
  }
  logger.info("Total " + doctype2 + " fetched: " + allEntries.length);
  return allEntries;
}
function _normaliseJournalEntry(doc) {
  return {
    name: doc.name,
    doctype: "Journal Entry",
    postingDate: doc.posting_date || null,
    company: doc.company || null,
    currency: doc.currency || "INR",
    totalDebit: doc.total_debit || 0,
    totalCredit: doc.total_credit || 0,
    multiCurrency: doc.multi_currency || 0,
    remarks: doc.remark || doc.remarks || null,
    voucherType: doc.voucher_type || null,
    isOpening: doc.is_opening || "No",
    accounts: (doc.accounts || []).map((acc) => ({
      account: acc.account || null,
      debit: acc.debit || 0,
      credit: acc.credit || 0,
      partyType: acc.party_type || null,
      party: acc.party || null,
      costCentre: acc.cost_center || null,
      referenceType: acc.reference_type || null,
      referenceName: acc.reference_name || null
    })),
    raw: doc
  };
}
async function fetchJournalEntries(creds = {}, options = {}) {
  const client = createErpClient(creds);
  const {
    fromDate,
    toDate,
    limit = 50,
    filters: extraFilters = []
  } = options;
  const doctype2 = "Journal Entry";
  const filters = [
    ["Journal Entry", "docstatus", "=", 1]
  ];
  if (fromDate) filters.push(["Journal Entry", "posting_date", ">=", fromDate]);
  if (toDate) filters.push(["Journal Entry", "posting_date", "<=", toDate]);
  for (const f of extraFilters) filters.push(f);
  const allEntries = [];
  let start = 0;
  const pageSize = Math.min(limit, 100);
  logger.info("Fetching " + doctype2 + " from ERPNext" + (fromDate ? " (" + fromDate + " \u2192 " + (toDate || "latest") + ")" : ""));
  while (true) {
    const page = await withRetry(async () => {
      const res = await client.get("/api/resource/" + encodeURIComponent(doctype2), {
        params: {
          filters: JSON.stringify(filters),
          fields: JSON.stringify([
            "name",
            "posting_date",
            "company",
            "currency",
            "total_debit",
            "total_credit",
            "multi_currency",
            "remark",
            "remarks",
            "voucher_type",
            "is_opening",
            "accounts.account",
            "accounts.debit",
            "accounts.credit",
            "accounts.party_type",
            "accounts.party",
            "accounts.cost_center",
            "accounts.reference_type",
            "accounts.reference_name"
          ]),
          limit_page_length: pageSize,
          limit_start: start,
          order_by: "posting_date asc, name asc"
        }
      });
      return res.data;
    }, doctype2 + " fetch page " + start);
    const rows = page.data || [];
    allEntries.push(...rows.map(_normaliseJournalEntry));
    logger.info("Fetched " + rows.length + " " + doctype2 + " (total so far: " + allEntries.length + ")");
    if (rows.length < pageSize) break;
    start += pageSize;
    await sleep(_throttle.delay());
  }
  logger.info("Total " + doctype2 + " fetched: " + allEntries.length);
  return allEntries;
}

// syncState.js
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_os3 = __toESM(require("os"), 1);
init_logger();
var STATE_DIR2 = import_path3.default.join(
  import_os3.default.homedir(),
  "AppData",
  "Roaming",
  "TallyERPNextIntegration",
  "data"
);
var STATE_FILE = import_path3.default.join(STATE_DIR2, "sync_state.dat");
var OVERLAP_DAYS = 3;
function ensureDir3() {
  if (!import_fs3.default.existsSync(STATE_DIR2)) import_fs3.default.mkdirSync(STATE_DIR2, { recursive: true });
}
function loadState() {
  ensureDir3();
  if (!import_fs3.default.existsSync(STATE_FILE)) return {};
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = import_fs3.default.readFileSync(STATE_FILE, "utf8");
      if (!raw.trim()) return {};
      return JSON.parse(raw);
    } catch (err) {
      if (attempt < 3) {
        const until = Date.now() + 50;
        while (Date.now() < until) {
        }
      } else {
        logger.warn(
          "syncState: could not parse sync_state.json after 3 attempts \u2014 starting fresh (" + err.message + ")"
        );
        try {
          import_fs3.default.copyFileSync(STATE_FILE, STATE_FILE + ".corrupt." + Date.now());
        } catch (_) {
        }
        return {};
      }
    }
  }
  return {};
}
function saveState(state) {
  ensureDir3();
  const tmp = STATE_FILE + ".tmp";
  import_fs3.default.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  import_fs3.default.renameSync(tmp, STATE_FILE);
}
function stateKey2(company, erpnextUrl) {
  const url = (erpnextUrl || "default").replace(/\/+$/, "").toLowerCase();
  return `${company}::${url}`;
}
function getCompanyState(company, erpnextUrl) {
  const all = loadState();
  const key = stateKey2(company, erpnextUrl);
  return all[key] || {
    lastVoucherSyncDate: null,
    lastMasterSyncAt: null,
    ledgerAlterIds: {},
    stockAlterIds: {},
    groupAlterIds: {},
    costCentreAlterIds: {},
    godownAlterIds: {}
  };
}
function saveCompanyState(company, partial, erpnextUrl) {
  const all = loadState();
  const key = stateKey2(company, erpnextUrl);
  const prev = all[key] || {};
  all[key] = Object.assign({}, prev, partial);
  if (partial.ledgerAlterIds) {
    all[key].ledgerAlterIds = Object.assign({}, prev.ledgerAlterIds || {}, partial.ledgerAlterIds);
  }
  if (partial.stockAlterIds) {
    all[key].stockAlterIds = Object.assign({}, prev.stockAlterIds || {}, partial.stockAlterIds);
  }
  if (partial.groupAlterIds) {
    all[key].groupAlterIds = Object.assign({}, prev.groupAlterIds || {}, partial.groupAlterIds);
  }
  if (partial.costCentreAlterIds) {
    all[key].costCentreAlterIds = Object.assign({}, prev.costCentreAlterIds || {}, partial.costCentreAlterIds);
  }
  if (partial.godownAlterIds) {
    all[key].godownAlterIds = Object.assign({}, prev.godownAlterIds || {}, partial.godownAlterIds);
  }
  saveState(all);
  logger.info(`syncState: saved state for "${company}" \u2192 ${stateKey2(company, erpnextUrl)}`, {
    lastVoucherSyncDate: all[key].lastVoucherSyncDate,
    lastMasterSyncAt: all[key].lastMasterSyncAt
  });
}
function resetCompanyState(company, erpnextUrl) {
  const all = loadState();
  const key = stateKey2(company, erpnextUrl);
  delete all[key];
  saveState(all);
  logger.info(`syncState: reset state for "${key}" \u2014 next sync will be full`);
}
function getIncrementalVoucherDates(company, requestedFromDate, requestedToDate, erpnextUrl) {
  const state = getCompanyState(company, erpnextUrl);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const toDate = requestedToDate || today;
  if (!state.lastVoucherSyncDate) {
    return { fromDate: requestedFromDate || toDate, toDate, isIncremental: false };
  }
  const lastDate = new Date(state.lastVoucherSyncDate);
  lastDate.setDate(lastDate.getDate() - OVERLAP_DAYS);
  const checkpoint = lastDate.toISOString().slice(0, 10);
  const fromDate = requestedFromDate && requestedFromDate < checkpoint ? requestedFromDate : checkpoint;
  const isIncremental = fromDate > (requestedFromDate || "1900-01-01") || !!state.lastVoucherSyncDate;
  logger.info(`syncState: incremental voucher window \u2192 ${fromDate} to ${toDate} (last sync was ${state.lastVoucherSyncDate}, overlap=${OVERLAP_DAYS}d)`);
  return { fromDate, toDate, isIncremental };
}
function filterChangedMasters(items, storedAlterIds, keyField = "name") {
  if (!storedAlterIds || Object.keys(storedAlterIds).length === 0) {
    return { toSync: items, unchanged: 0 };
  }
  const toSync = [];
  let unchanged = 0;
  for (const item of items) {
    const key = item[keyField];
    const alterId = item.alterId != null ? String(item.alterId) : null;
    if (alterId === null) {
      toSync.push(item);
      continue;
    }
    if (!(key in storedAlterIds)) {
      toSync.push(item);
      continue;
    }
    if (storedAlterIds[key] !== alterId) {
      toSync.push(item);
      continue;
    }
    if (key === "Customer6") {
      console.log("ALTERID CHECK", {
        key,
        currentAlterId: alterId,
        storedAlterId: storedAlterIds[key],
        same: storedAlterIds[key] === alterId
      });
    }
    unchanged++;
  }
  return { toSync, unchanged };
}
function buildAlterIdMap(items, keyField = "name") {
  const map = {};
  for (const item of items) {
    if (item[keyField] && item.alterId != null) {
      map[item[keyField]] = String(item.alterId);
    }
  }
  return map;
}
var HISTORY_FILE = import_path3.default.join(STATE_DIR2, "sync_history.json");
function loadSyncHistory(company = null) {
  try {
    ensureDir3();
    if (!import_fs3.default.existsSync(HISTORY_FILE)) return [];
    const raw = import_fs3.default.readFileSync(HISTORY_FILE, "utf8");
    const arr = JSON.parse(raw) || [];
    if (!company) return arr;
    const norm = String(company).trim().toLowerCase();
    return arr.filter((h) => !h.company || String(h.company).trim().toLowerCase() === norm || String(h.tallyCompany || "").trim().toLowerCase() === norm);
  } catch {
    return [];
  }
}
function saveSyncHistoryRecord(record) {
  try {
    ensureDir3();
    if (!record || typeof record !== "object") return;
    const current = loadSyncHistory();
    const key = record.finishedAt || record.startedAt;
    if (!key) return;
    const exists = current.some((e) => e.finishedAt && e.finishedAt === key || e.startedAt && e.startedAt === key);
    if (!exists) {
      const updated = [record, ...current].slice(0, 100);
      const tmp = HISTORY_FILE + ".tmp";
      import_fs3.default.writeFileSync(tmp, JSON.stringify(updated, null, 2), "utf8");
      import_fs3.default.renameSync(tmp, HISTORY_FILE);
      logger.info(`syncState: saved sync history entry for "${record.company || "default"}"`);
    }
  } catch (err) {
    logger.warn("syncState: failed to save history record: " + err.message);
  }
}

// routes/index.js
init_logger();
init_config();
var router = (0, import_express.Router)();
function resolveCompany(req) {
  return req.query.company || config.tally.companyName || null;
}
function extractCreds(req) {
  const { erpnextUrl, erpnextApiKey, erpnextApiSecret, erpnextCompany } = req.body || {};
  const creds = {};
  if (erpnextUrl && erpnextApiKey && erpnextApiSecret) {
    creds.url = erpnextUrl;
    creds.apiKey = erpnextApiKey;
    creds.apiSecret = erpnextApiSecret;
  }
  if (erpnextCompany) creds.erpnextCompany = erpnextCompany;
  return creds;
}
function resolveErpUrl(creds) {
  return creds.url || config.erpnext.url || "default";
}
var jobs = /* @__PURE__ */ new Map();
globalThis._syncJobs = jobs;
function createJob(type, companyName = "") {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  jobs.set(id, { id, type, companyName, status: "running", result: null, error: null, startedAt: (/* @__PURE__ */ new Date()).toISOString() });
  setTimeout(() => jobs.delete(id), 2 * 60 * 60 * 1e3);
  resetCancel();
  return id;
}
function finishJob(id, result) {
  const job = jobs.get(id);
  if (job) {
    Object.assign(job, { status: "done", result, finishedAt: (/* @__PURE__ */ new Date()).toISOString() });
    if (result?.steps) {
      const syncResult = {
        ...result,
        startedAt: job.startedAt,
        finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        triggeredBy: "manual",
        company: job.companyName || result.company || ""
      };
      globalThis._lastManualSyncResult = syncResult;
      globalThis._lastSyncByCompany = globalThis._lastSyncByCompany || {};
      globalThis._lastSyncByCompany[job.companyName || ""] = syncResult;
      saveSyncHistoryRecord(syncResult);
    }
  }
}
function failJob(id, error) {
  const job = jobs.get(id);
  if (job) Object.assign(job, { status: "failed", error: error.message || String(error), finishedAt: (/* @__PURE__ */ new Date()).toISOString() });
}
var cancelledJobs = /* @__PURE__ */ new Set();
function cancelJob(id) {
  const job = jobs.get(id);
  if (job && job.status === "running") {
    Object.assign(job, { status: "cancelled", error: "Stopped by user", finishedAt: (/* @__PURE__ */ new Date()).toISOString() });
    cancelledJobs.add(id);
    setTimeout(() => cancelledJobs.delete(id), 10 * 60 * 1e3);
    return true;
  }
  return false;
}
router.get("/sync/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found (may have expired)" });
  res.json({ ok: true, job });
});
router.get("/sync/jobs", (_req, res) => {
  const list = Array.from(jobs.values()).filter((j) => j.status === "running");
  res.json({ ok: true, jobs: list });
});
router.post("/sync/cancel/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found" });
  if (job.status !== "running") {
    return res.json({ ok: true, message: `Job already in state: ${job.status}` });
  }
  cancelJob(jobId);
  cancelSync();
  logger.info(`Job ${jobId} cancelled by user`);
  res.json({ ok: true, message: "Job cancelled", jobId });
});
router.get("/health", (_req, res) => {
  res.json({ ok: true, ts: (/* @__PURE__ */ new Date()).toISOString(), tallyUrl: config.tally.url });
});
router.get("/tally/ping", async (_req, res) => {
  try {
    res.json(await pingTally());
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});
router.get("/tally/companies", async (_req, res) => {
  try {
    const data = await fetchTallyCompanies();
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch companies", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/groups", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyGroups(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch groups", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/ledgers", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyLedgers(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch ledgers", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/voucher-types", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyVoucherTypes(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch voucher types", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/cost-categories", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyCostCategories(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch cost categories", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/cost-centres", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyCostCentres(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch cost centres", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/currencies", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyCurrencies(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch currencies", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/budgets", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyBudgets(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch budgets", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/stock-groups", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyStockGroups(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch stock groups", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/stock", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyStockItems(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch stock items", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/stock-categories", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyStockCategories(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch stock categories", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/units", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyUnits(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch units", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/godowns", async (req, res) => {
  const company = resolveCompany(req);
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyGodowns(company);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch godowns", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/tally/vouchers", async (req, res) => {
  const company = resolveCompany(req);
  const { from, to } = req.query;
  if (!company) return res.status(400).json({ ok: false, error: "company query param required" });
  try {
    const data = await fetchTallyVouchers(company, from, to);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    logger.error("Failed to fetch vouchers", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post("/middleware/check", async (req, res) => {
  const { company, fromDate, toDate } = req.body || {};
  const companyName = company || config.tally.companyName;
  if (!companyName) {
    return res.status(400).json({
      ok: false,
      error: "No company specified. Pass { company } in the request body or set TALLY_COMPANY_NAME in .env"
    });
  }
  logger.info(`Middleware check started for: ${companyName}`);
  try {
    const report = await runMiddlewareCheck(companyName, { fromDate, toDate });
    res.json({ ok: true, report });
  } catch (err) {
    logger.error("Middleware check failed", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/logs", (req, res) => {
  const { company, fromDate, toDate, level } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 200, 1e3);
  const logs = logger.getLogs({ company: company || null, fromDate, toDate, level, limit });
  res.json({ logs });
});
router.get("/logs/companies", (_req, res) => {
  res.json({ companies: logger.listCompanies() });
});
router.post("/erpnext/resolve-company", async (req, res) => {
  const { company } = req.body || {};
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  try {
    const erpCompany = await resolveErpNextCompanyPublic(company, extractCreds(req));
    res.json({ ok: true, erpCompany });
  } catch (err) {
    res.json({ ok: true, erpCompany: null });
  }
});
router.get("/erpnext/ping", async (_req, res) => {
  try {
    res.json(await pingErpNext());
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});
router.post("/erpnext/ping", async (req, res) => {
  try {
    res.json(await pingErpNext(extractCreds(req)));
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});
router.post("/sync/ledgers", async (req, res) => {
  const company = req.body.company || config.tally.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const erpnextUrl = resolveErpUrl(creds);
  const jobId = createJob("ledgers", company);
  logger.info(`Ledger sync job ${jobId} started for: ${company} \u2192 ${erpnextUrl}`);
  res.json({ ok: true, jobId, message: "Ledger sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const state = getCompanyState(company, erpnextUrl);
      const allLedgers = await fetchTallyLedgers(company);
      const { toSync: changedLedgers, unchanged } = filterChangedMasters(allLedgers, state.ledgerAlterIds);
      const toSync = req.body.force || req.body.forceAll || !state.ledgerAlterIds ? allLedgers : changedLedgers;
      logger.info(`Ledgers: ${toSync.length} to sync, ${unchanged} unchanged (skipped)`);
      if (toSync.length === 0) {
        logger.info(`Ledger sync job ${jobId}: already up to date`);
        saveCompanyState(company, { ledgerAlterIds: buildAlterIdMap(allLedgers), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
        finishJob(jobId, { nothingToSync: true, message: "All ledgers are already up to date \u2014 nothing pushed to ERPNext." });
        return;
      }
      const result = await syncLedgersToErpNext(toSync, creds);
      await syncBankLedgersToErpNext(allLedgers, company, creds);
      saveCompanyState(company, { ledgerAlterIds: buildAlterIdMap(allLedgers), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
      logger.info(`Ledger sync job ${jobId} done`, result);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Ledger sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/smart-ledgers", async (req, res) => {
  const { company, fromDate, toDate } = req.body;
  const companyName = company || config.tally.companyName;
  if (!companyName) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const jobId = createJob("smart-ledgers", companyName);
  logger.info(`Smart Ledger sync job ${jobId} started for: ${companyName} (${fromDate} to ${toDate})`);
  res.json({ ok: true, jobId, message: "Smart Ledger sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      logger.info("Smart Ledger Sync: fetching vouchers to extract used ledger names...");
      const [vouchers, allLedgers] = await Promise.all([
        fetchTallyVouchers(companyName, fromDate, toDate),
        fetchTallyLedgers(companyName)
      ]);
      logger.info(`Smart Ledger Sync: got ${vouchers.length} vouchers and ${allLedgers.length} total ledgers`);
      const result = await smartSyncLedgersToErpNext(vouchers, allLedgers, creds);
      await syncBankLedgersToErpNext(allLedgers, companyName, creds);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Smart Ledger sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/stock", async (req, res) => {
  const company = req.body.company || config.tally.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const erpnextUrl = resolveErpUrl(creds);
  const jobId = createJob("stock", company);
  logger.info(`Stock sync job ${jobId} started for: ${company} \u2192 ${erpnextUrl}`);
  res.json({ ok: true, jobId, message: "Stock sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const state = getCompanyState(company, erpnextUrl);
      const allStock = await fetchTallyStockItems(company);
      const { toSync, unchanged } = filterChangedMasters(allStock, state.stockAlterIds);
      logger.info(`Stock: ${toSync.length} to sync, ${unchanged} unchanged (skipped)`);
      if (toSync.length === 0) {
        logger.info(`Stock sync job ${jobId}: already up to date`);
        saveCompanyState(company, { stockAlterIds: buildAlterIdMap(allStock), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
        finishJob(jobId, { nothingToSync: true, message: "All stock items are already up to date \u2014 nothing pushed to ERPNext." });
        return;
      }
      const result = await syncStockToErpNext(toSync, creds);
      saveCompanyState(company, { stockAlterIds: buildAlterIdMap(allStock), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Stock sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/vouchers", async (req, res) => {
  const { company, fromDate, toDate } = req.body;
  const companyName = company || config.tally.companyName;
  if (!companyName) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const erpnextUrl = resolveErpUrl(creds);
  const jobId = createJob("vouchers", companyName);
  logger.info(`Voucher sync job ${jobId} started for: ${companyName} \u2192 ${erpnextUrl}`);
  res.json({ ok: true, jobId, message: "Voucher sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const { fromDate: effFrom, toDate: effTo, isIncremental } = getIncrementalVoucherDates(companyName, req.body.forceFromDate || fromDate || null, toDate, erpnextUrl);
      const state = getCompanyState(companyName, erpnextUrl);
      const lastSynced = state.lastVoucherSyncDate;
      if (lastSynced && effTo <= lastSynced) {
        logger.info(`Voucher sync job ${jobId}: already up to date (window ${effFrom}\u2192${effTo} covered by last sync ${lastSynced})`);
        finishJob(jobId, { nothingToSync: true, message: "All vouchers in this date window are already up to date \u2014 nothing pushed to ERPNext." });
        return;
      }
      logger.info(`Vouchers: ${isIncremental ? "incremental" : "full"} window ${effFrom} \u2192 ${effTo}`);
      const vouchers = await fetchTallyVouchers(companyName, effFrom, effTo);
      const result = await syncVouchersToErpNext(vouchers, companyName, creds);
      saveCompanyState(companyName, { lastVoucherSyncDate: effTo, lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Voucher sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/godowns", async (req, res) => {
  const company = req.body.company || config.tally.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const erpnextUrl = resolveErpUrl(creds);
  const jobId = createJob("godowns", company);
  logger.info(`Godown sync job ${jobId} started for: ${company} \u2192 ${erpnextUrl}`);
  res.json({ ok: true, jobId, message: "Godown sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const state = getCompanyState(company, erpnextUrl);
      const allGodowns = await fetchTallyGodowns(company);
      const { toSync, unchanged } = filterChangedMasters(allGodowns, state.godownAlterIds);
      logger.info(`Godowns: ${toSync.length} to sync, ${unchanged} unchanged (skipped)`);
      if (toSync.length === 0) {
        logger.info(`Godown sync job ${jobId}: already up to date`);
        saveCompanyState(company, { godownAlterIds: buildAlterIdMap(allGodowns), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
        finishJob(jobId, { nothingToSync: true, message: "All godowns are already up to date \u2014 nothing pushed to ERPNext." });
        return;
      }
      const result = await syncGodownsToErpNext(toSync, company, creds);
      saveCompanyState(company, { godownAlterIds: buildAlterIdMap(allGodowns), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Godown sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/opening-balances", async (req, res) => {
  const company = req.body.company || config.tally.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const jobId = createJob("opening-balances", company);
  logger.info(`Opening balance sync job ${jobId} started for: ${company}`);
  res.json({ ok: true, jobId, message: "Opening balance sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const [groups, ledgers] = await Promise.all([
        fetchTallyGroups(company),
        fetchTallyLedgers(company)
      ]);
      logger.info(`[OB job ${jobId}] Syncing ${groups.length} groups (COA) before opening balances`);
      await syncChartOfAccountsToErpNext(groups, company, creds);
      const result = await syncOpeningBalancesToErpNext(ledgers, company, creds);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Opening balance sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/cost-centres", async (req, res) => {
  const company = req.body.company || config.tally.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const erpnextUrl = resolveErpUrl(creds);
  const jobId = createJob("cost-centres", company);
  logger.info(`Cost centre sync job ${jobId} started for: ${company} \u2192 ${erpnextUrl}`);
  res.json({ ok: true, jobId, message: "Cost centre sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const state = getCompanyState(company, erpnextUrl);
      const allCostCentres = await fetchTallyCostCentres(company);
      const { toSync, unchanged } = filterChangedMasters(allCostCentres, state.costCentreAlterIds);
      logger.info(`Cost Centres: ${toSync.length} to sync, ${unchanged} unchanged (skipped)`);
      if (toSync.length === 0) {
        logger.info(`Cost centre sync job ${jobId}: already up to date`);
        saveCompanyState(company, { costCentreAlterIds: buildAlterIdMap(allCostCentres), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
        finishJob(jobId, { nothingToSync: true, message: "All cost centres are already up to date \u2014 nothing pushed to ERPNext." });
        return;
      }
      const result = await syncCostCentresToErpNext(toSync, company, creds);
      saveCompanyState(company, { costCentreAlterIds: buildAlterIdMap(allCostCentres), lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString() }, erpnextUrl);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Cost centre sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/invoices", async (req, res) => {
  const { company, fromDate, toDate } = req.body;
  const companyName = company || config.tally.companyName;
  if (!companyName) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const jobId = createJob("invoices", companyName);
  logger.info(`Invoice sync job ${jobId} started for: ${companyName}`);
  res.json({ ok: true, jobId, message: "Invoice sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const vouchers = await fetchTallyVouchers(companyName, fromDate, toDate);
      const result = await syncInvoicesToErpNext(vouchers, companyName, creds);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Invoice sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/full", async (req, res) => {
  let {
    company,
    fromDate,
    toDate,
    syncChartOfAccounts = false,
    syncLedgers = false,
    syncOpeningBalances = false,
    syncGodowns = false,
    syncCostCentres = false,
    syncStock = false,
    syncVouchers = false,
    syncInvoices = false,
    syncTaxes = false
  } = req.body;
  const companyName = company || config.tally.companyName;
  if (!companyName) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const erpnextUrl = resolveErpUrl(creds);
  const state = getCompanyState(companyName, erpnextUrl);
  const isFirstSync = !state.lastVoucherSyncDate && !state.lastMasterSyncAt;
  if (isFirstSync && (syncLedgers || syncOpeningBalances)) {
    syncChartOfAccounts = true;
  }
  const jobId = createJob("full", companyName);
  logger.info(`Full sync job ${jobId} started for: ${companyName} \u2192 ${erpnextUrl}`, {
    syncLedgers,
    syncStock,
    syncVouchers,
    syncGodowns,
    syncCostCentres,
    syncOpeningBalances,
    syncInvoices,
    syncTaxes,
    syncChartOfAccounts
  });
  res.json({ ok: true, jobId, message: "Full sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      logger.info(`Full sync: fetching Tally data with incremental logic...`);
      const tallyPing = await pingTally().catch(function() {
        return { connected: false, error: "No response from Tally" };
      });
      if (!tallyPing.connected) {
        const msg = "Tally is not connected \u2014 " + (tallyPing.error || "TallyPrime is not running or server mode is not enabled on port 9000") + ". Please open TallyPrime before syncing.";
        logger.error("[Job " + jobId + "] " + msg);
        failJob(jobId, new Error(msg));
        return;
      }
      logger.info("Tally ping OK (" + tallyPing.latencyMs + "ms)");
      const state2 = getCompanyState(companyName, erpnextUrl);
      const isFirstSync2 = !state2.lastVoucherSyncDate && !state2.lastMasterSyncAt;
      const fullSyncDone = isFullSyncComplete(companyName, erpnextUrl);
      const needsFullSync = isFirstSync2 || !fullSyncDone;
      logger.info(
        `Sync mode: ${needsFullSync ? "FULL CHUNKED (first run or incomplete)" : "INCREMENTAL"} for "${companyName}" \u2192 ${erpnextUrl}`,
        { isFirstSync: isFirstSync2, fullSyncDone }
      );
      let groups = [];
      let costCentres = [];
      let godowns = [];
      let ledgers = [];
      let allLedgers = [];
      let stockItems = [];
      const newAlterIds = {};
      if (syncChartOfAccounts || syncOpeningBalances) {
        const allGroups = await fetchTallyGroups(companyName);
        const { toSync: changedGroups, unchanged: unchangedGroups } = filterChangedMasters(allGroups, state2.groupAlterIds);
        logger.info(`Groups: ${changedGroups.length} to sync, ${unchangedGroups} unchanged (skipped)`);
        groups = changedGroups;
        newAlterIds.groupAlterIds = buildAlterIdMap(allGroups);
      }
      if (syncCostCentres) {
        const allCostCentres = await fetchTallyCostCentres(companyName);
        const { toSync: changedCostCentres, unchanged: unchangedCostCentres } = filterChangedMasters(allCostCentres, state2.costCentreAlterIds);
        logger.info(`Cost Centres: ${changedCostCentres.length} to sync, ${unchangedCostCentres} unchanged (skipped)`);
        costCentres = changedCostCentres;
        newAlterIds.costCentreAlterIds = buildAlterIdMap(allCostCentres);
      }
      if (syncGodowns) {
        const allGodowns = await fetchTallyGodowns(companyName);
        const { toSync: changedGodowns, unchanged: unchangedGodowns } = filterChangedMasters(allGodowns, state2.godownAlterIds);
        logger.info(`Godowns: ${changedGodowns.length} to sync, ${unchangedGodowns} unchanged (skipped)`);
        godowns = changedGodowns;
        newAlterIds.godownAlterIds = buildAlterIdMap(allGodowns);
      }
      if (syncLedgers || syncOpeningBalances) {
        if (needsFullSync) {
          const batchSize = parseInt(process.env.SYNC_LEDGER_BATCH_SIZE, 10) || 500;
          logger.info(`Ledgers (first sync): fetching all, batching by ${batchSize}, resumable`, { company: companyName });
          const { batches, total, batchCount, allLedgers: fetchedAllLedgers } = await fetchTallyLedgersChunked(
            companyName,
            erpnextUrl,
            batchSize,
            (batchId, count, totalBatches, idx, skipped) => {
              logger.info(
                `Ledger batch ${batchId} (${idx}/${totalBatches}): ${skipped ? "skipped (already synced)" : count + " ledgers ready to push"}`
              );
            }
          );
          for (const batch of batches) {
            logger.info(`Pushing ledger batch ${batch.id} (${batch.ledgers.length} ledgers) to ERPNext`);
            markChunkDone(companyName, erpnextUrl, "ledgers", batch.id, {
              from: batch.from,
              to: batch.to,
              count: batch.ledgers.length
            });
            logger.info(`Ledger batch ${batch.id} pushed and cached \u2705`);
          }
          ledgers = batches.flatMap((b) => b.ledgers);
          allLedgers = fetchedAllLedgers;
          newAlterIds.ledgerAlterIds = buildAlterIdMap(allLedgers);
          logger.info(`All ${batchCount} ledger batches complete (${total} total ledgers)`);
        } else {
          allLedgers = await fetchTallyLedgers(companyName);
          const { toSync: changedLedgers, unchanged: unchangedLedgers } = filterChangedMasters(allLedgers, state2.ledgerAlterIds);
          logger.info(`Ledgers: ${changedLedgers.length} to sync, ${unchangedLedgers} unchanged (skipped)`);
          ledgers = changedLedgers;
          newAlterIds.ledgerAlterIds = buildAlterIdMap(allLedgers);
        }
      }
      if (syncStock || syncTaxes) {
        const allStock = await fetchTallyStockItems(companyName);
        const { toSync: changedStock, unchanged: unchangedStock } = filterChangedMasters(allStock, state2.stockAlterIds);
        logger.info(`Stock: ${changedStock.length} to sync, ${unchangedStock} unchanged (skipped)`);
        stockItems = changedStock;
        newAlterIds.stockAlterIds = buildAlterIdMap(allStock);
      }
      let vouchers = [];
      let effectiveFromDate = fromDate;
      let effectiveToDate = toDate;
      if (syncVouchers || syncInvoices) {
        if (needsFullSync) {
          const companies = await fetchTallyCompanies();
          const thisCompany = companies.find((c) => c.name === companyName);
          const booksFrom = thisCompany?.startingFrom || thisCompany?.booksFrom;
          if (!booksFrom) {
            throw new Error(
              `Cannot determine books start date for "${companyName}". Ensure Tally company has a valid Books Beginning Date.`
            );
          }
          const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          logger.info(`First sync: fetching vouchers from ${booksFrom} \u2192 ${today} in monthly chunks`);
          vouchers = await fetchTallyVouchersChunked(
            companyName,
            booksFrom,
            today,
            erpnextUrl,
            (chunkId, count, totalChunks, idx, skipped) => {
              logger.info(
                `Voucher chunk ${chunkId} (${idx}/${totalChunks}): ${skipped ? "skipped (already synced)" : count + " vouchers fetched"}`
              );
            }
          );
          effectiveFromDate = booksFrom;
          effectiveToDate = today;
        } else {
          const dateWindow = getIncrementalVoucherDates(companyName, req.body.forceFromDate || null, toDate, erpnextUrl);
          effectiveFromDate = dateWindow.fromDate;
          effectiveToDate = dateWindow.toDate;
          const lastSynced = state2.lastVoucherSyncDate;
          const windowIsAlreadyCovered = lastSynced && effectiveToDate <= lastSynced && groups.length === 0 && ledgers.length === 0 && stockItems.length === 0 && costCentres.length === 0 && godowns.length === 0;
          if (windowIsAlreadyCovered) {
            logger.info(
              "Vouchers: skipping fetch \u2014 window " + effectiveFromDate + " \u2192 " + effectiveToDate + " already covered by last sync (" + lastSynced + ") and no masters changed"
            );
          } else {
            logger.info(
              "Vouchers: " + (dateWindow.isIncremental ? "incremental" : "full") + " window " + effectiveFromDate + " \u2192 " + effectiveToDate
            );
            vouchers = await fetchTallyVouchers(companyName, effectiveFromDate, effectiveToDate);
          }
        }
      }
      const nothingToSync = groups.length === 0 && ledgers.length === 0 && stockItems.length === 0 && costCentres.length === 0 && godowns.length === 0 && vouchers.length === 0;
      if (nothingToSync) {
        logger.info("[Job " + jobId + "] Nothing to sync \u2014 all masters unchanged, no new vouchers in window");
        finishJob(jobId, {
          status: "ok",
          nothingToSync: true,
          message: "Everything is already up to date. No new or changed data found since the last sync.",
          finishedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        saveCompanyState(companyName, {
          lastVoucherSyncDate: effectiveToDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString(),
          ...newAlterIds
        }, erpnextUrl);
        return;
      }
      const result = await runFullSync(
        companyName,
        { groups, ledgers, allLedgers, stockItems, vouchers, godowns, costCentres },
        {
          syncChartOfAccounts,
          syncCostCentres,
          syncGodowns,
          syncLedgers,
          syncStock,
          syncTaxes,
          syncOpeningBalances,
          syncVouchers,
          syncInvoices
        },
        creds
      );
      logger.info(`Full sync job ${jobId} done`);
      if (result.status !== "failed") {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        saveCompanyState(companyName, {
          lastVoucherSyncDate: effectiveToDate || today,
          lastMasterSyncAt: (/* @__PURE__ */ new Date()).toISOString(),
          ...newAlterIds
        }, erpnextUrl);
        logger.info(`syncState: checkpoint saved \u2192 vouchers up to ${effectiveToDate || today}`);
        if (needsFullSync) {
          markFullSyncComplete(companyName, erpnextUrl);
          logger.info(`Full sync complete \u2014 future syncs for "${companyName}" will be incremental \u2705`);
        }
      }
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Full sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/chart-of-accounts", async (req, res) => {
  const company = req.body.company || config.tally.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const jobId = createJob("chart-of-accounts", company);
  logger.info(`Chart of Accounts sync job ${jobId} started for: ${company}`);
  res.json({ ok: true, jobId, message: "Chart of Accounts sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const groups = await fetchTallyGroups(company);
      const result = await syncChartOfAccountsToErpNext(groups, company, creds);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Chart of Accounts sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.post("/sync/taxes", async (req, res) => {
  const company = req.body.company || config.tally.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const creds = extractCreds(req);
  const jobId = createJob("taxes", company);
  logger.info(`Tax sync job ${jobId} started for: ${company}`);
  res.json({ ok: true, jobId, message: "Tax sync started \u2014 poll /api/sync/status/" + jobId });
  (async () => {
    try {
      const stockItems = await fetchTallyStockItems(company);
      const result = await syncTaxesToErpNext(stockItems, company, creds);
      finishJob(jobId, result);
    } catch (err) {
      logger.error(`Tax sync job ${jobId} failed: ${err.message}`);
      failJob(jobId, err);
    }
  })();
});
router.get("/sync/chunk-progress", (req, res) => {
  const company = req.query.company || config.tally.companyName;
  const erpnextUrl = req.query.erpnextUrl || config.erpnext.url || "default";
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const progress = getChunkProgress(company, erpnextUrl);
  res.json({ ok: true, company, erpnextUrl, progress });
});
router.post("/sync/reset-full-sync", (req, res) => {
  const company = req.body.company || config.tally.companyName;
  const erpnextUrl = req.body.erpnextUrl || config.erpnext.url || "default";
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  resetChunkProgress(company, erpnextUrl);
  res.json({
    ok: true,
    message: `Chunk progress reset for "${company}" \u2014 next sync will be a full chunked sync from scratch`
  });
});
router.get("/sync/tenants", (_req, res) => {
  const tenants = listAllTenants();
  res.json({ ok: true, count: tenants.length, tenants });
});
var routes_default = router;

// routes/licenseRoute.js
var import_express2 = require("express");

// services/lmsService.js
var import_https = __toESM(require("https"), 1);
var import_http = __toESM(require("http"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
init_logger();
var import_url = require("url");
var import_module = require("module");
var LMS_BASE_URL = (process.env.LMS_BASE_URL || "https://dashboard.licentic.org").replace(/\/+$/, "");
var LMS_API_KEY = String(process.env.LMS_API_KEY || "").trim();
var PRODUCT_ID = String(process.env.LMS_PRODUCT_ID || "").trim() || "6a23c644247319b4b7bf7006";
var ACTIVE_LICENSE_PATH_CANDIDATES = (() => {
  const configured = String(process.env.LMS_ACTIVE_LICENSE_PATH || "").trim();
  const list = configured ? [configured] : [];
  for (const p of ["/api/external/actve-license", "/api/external/active-license"]) {
    if (!list.includes(p)) list.push(p);
  }
  return list.map((p) => "/" + p.replace(/^\/+/, "").replace(/\/+$/, ""));
})();
var _resolvedLicensePath = null;
function productIdQuery() {
  const productId = String(process.env.LMS_PRODUCT_ID || "").trim();
  return productId ? `?productId=${encodeURIComponent(productId)}` : "";
}
var HEARTBEAT_INTERVAL_MS = 30 * 60 * 1e3;
var __filename = (0, import_url.fileURLToPath)(__importMetaUrl);
var __dirname = import_path4.default.dirname(__filename);
var LICENSE_CACHE_PATH = import_path4.default.join(__dirname, "../logs/license-cache.json");
var REGISTRY_CACHE_PATH = import_path4.default.join(__dirname, "../logs/feature-registry-cache.json");
var USAGE_CACHE_PATH = import_path4.default.join(__dirname, "../logs/usage-cache.json");
var _require = (0, import_module.createRequire)(__importMetaUrl);
var APP_VERSION = "1.0.0";
try {
  APP_VERSION = _require("../package.json").version || "1.0.0";
} catch {
}
function lmsFetch(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(LMS_BASE_URL + endpoint);
    const lib = url.protocol === "https:" ? import_https.default : import_http.default;
    const body = options.body ? JSON.stringify(options.body) : void 0;
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LMS_API_KEY,
        ...body ? { "Content-Length": Buffer.byteLength(body) } : {},
        ...options.headers || {}
      }
    };
    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15e3, () => {
      req.destroy();
      reject(new Error("LMS request timed out"));
    });
    if (body) req.write(body);
    req.end();
  });
}
function maskEmail(email) {
  const s = String(email || "");
  const at = s.indexOf("@");
  if (at < 1) return s ? `${s.slice(0, 1)}***` : "(empty)";
  const name = s.slice(0, at);
  const domain = s.slice(at + 1);
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  return `${name.slice(0, Math.min(2, name.length))}***@***.${tld}`;
}
var EMAIL_MAX_LENGTH = 254;
var EMAIL_RE = /^[^\s@,;:<>()[\]\\"]+@[^\s@,;:<>()[\]\\".]+(\.[^\s@,;:<>()[\]\\".]+)+$/;
function normalizeEmail(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
}
function isStructurallyValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  if (email.length > EMAIL_MAX_LENGTH) return false;
  if (/\s/.test(email)) return false;
  return EMAIL_RE.test(email);
}
function saveLicenseCache(info) {
  try {
    const dir = import_path4.default.dirname(LICENSE_CACHE_PATH);
    if (!import_fs4.default.existsSync(dir)) import_fs4.default.mkdirSync(dir, { recursive: true });
    import_fs4.default.writeFileSync(LICENSE_CACHE_PATH, JSON.stringify({
      ...info,
      // licenseKey is a secret and nothing consumes it - never persist it.
      licenseKey: void 0,
      productId: info.productId || String(process.env.LMS_PRODUCT_ID || "").trim(),
      cachedAt: (/* @__PURE__ */ new Date()).toISOString()
    }));
  } catch (e) {
    logger.warn(`[LMS] Cache save failed: ${e.message}`);
  }
}
function saveRegistryCache(data) {
  try {
    const dir = import_path4.default.dirname(REGISTRY_CACHE_PATH);
    if (!import_fs4.default.existsSync(dir)) import_fs4.default.mkdirSync(dir, { recursive: true });
    import_fs4.default.writeFileSync(REGISTRY_CACHE_PATH, JSON.stringify({
      data,
      cachedAt: Date.now()
    }));
  } catch (e) {
    logger.warn("[LMS] Registry cache save failed: " + e.message);
  }
}
function loadRegistryCache() {
  try {
    if (import_fs4.default.existsSync(REGISTRY_CACHE_PATH)) {
      const raw = JSON.parse(import_fs4.default.readFileSync(REGISTRY_CACHE_PATH, "utf8"));
      if (raw?.cachedAt && Date.now() - raw.cachedAt < 24 * 60 * 60 * 1e3) {
        return raw.data;
      }
    }
  } catch {
  }
  return null;
}
async function fetchFeatureRegistry() {
  const cached = loadRegistryCache();
  if (cached) {
    logger.info("[LMS] Feature registry loaded from cache");
    return cached;
  }
  try {
    logger.info("[LMS] Fetching feature registry from LMS...");
    const { status, data } = await lmsFetch(
      `/api/feature-registry/${PRODUCT_ID}`,
      { headers: { "x-api-key": LMS_API_KEY } }
    );
    if (status !== 200) {
      logger.warn(`[LMS] Feature registry fetch failed --- HTTP ${status}`);
      return null;
    }
    const registry = data.data || data;
    if (!registry?.features || !Array.isArray(registry.features)) {
      logger.warn("[LMS] Feature registry response has no features array --- response: " + JSON.stringify(data).substring(0, 200));
      return null;
    }
    saveRegistryCache(registry);
    logger.info(`[LMS] Feature registry fetched --- ${registry.features.length} features for product ${PRODUCT_ID}`);
    return registry;
  } catch (err) {
    logger.warn("[LMS] Feature registry fetch error: " + err.message);
    return null;
  }
}
function parseFeatures(featuresArray = [], registry = null) {
  if (!Array.isArray(featuresArray)) return featuresArray;
  const map = {};
  if (registry?.features && Array.isArray(registry.features)) {
    for (const regFeature of registry.features) {
      const slug = regFeature.featureSlug;
      if (!slug) continue;
      if (regFeature.featureType === "limit") {
        map[slug] = 0;
      } else {
        map[slug] = false;
      }
    }
  }
  for (const f of featuresArray) {
    const slug = f.featureSlug;
    if (!slug) continue;
    if (f.featureType === "boolean") {
      map[slug] = f.value === true || f.value === "true" || f.value === 1;
    } else if (f.featureType === "limit") {
      map[slug] = Number(f.value) || 0;
    } else {
      map[slug] = f.value;
    }
  }
  return map;
}
async function fetchActiveLicense(normalizedEmail) {
  const query = productIdQuery();
  const encoded = encodeURIComponent(normalizedEmail);
  const TRANSIENT_RETRIES = 2;
  const order = _resolvedLicensePath ? [_resolvedLicensePath, ...ACTIVE_LICENSE_PATH_CANDIDATES.filter((p) => p !== _resolvedLicensePath)] : ACTIVE_LICENSE_PATH_CANDIDATES;
  let lastRouteAbsent = null;
  for (const path6 of order) {
    const endpoint = `${path6}/${encoded}${query}`;
    let transientMisses = 0;
    for (let attempt = 0; attempt <= TRANSIENT_RETRIES; attempt++) {
      let status, data;
      try {
        ({ status, data } = await lmsFetch(endpoint, { headers: { "x-api-key": LMS_API_KEY } }));
      } catch (netErr) {
        return { failed: true, reason: `Licentic verification unavailable: ${netErr.message}` };
      }
      logger.info(`[LMS] Licentic ${path6} attempt ${attempt + 1} -> HTTP ${status}`);
      if (status === 200 && data && data.success !== false) {
        if (_resolvedLicensePath !== path6) {
          logger.info(`[LMS] Resolved Licentic route: ${path6}`);
          _resolvedLicensePath = path6;
        }
        return { ok: true, status, data, path: path6 };
      }
      const msg = String(data?.message || data?.error || "");
      if (status === 404 && /^not found\s*-\s*\//i.test(msg)) {
        lastRouteAbsent = path6;
        logger.warn(`[LMS] Route ${path6} is not registered on this Licentic deployment`);
        break;
      }
      if (status === 401) {
        return { failed: true, reason: "Licentic rejected the request: API key missing (HTTP 401)" };
      }
      if (status === 403) {
        return { failed: true, reason: "Licentic rejected the request: API key invalid (HTTP 403)" };
      }
      if (status >= 500) {
        return { failed: true, reason: `Licentic server error (HTTP ${status}) --- verification could not be completed` };
      }
      if (status === 404) {
        transientMisses++;
        if (attempt < TRANSIENT_RETRIES) {
          logger.warn(`[LMS] Licentic reported "${msg}" --- retrying (${attempt + 1}/${TRANSIENT_RETRIES})`);
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return { rejected: true, reason: msg || "No active license found for this email", path: path6 };
      }
      return { rejected: true, reason: msg || `No active license found for this email (HTTP ${status})`, path: path6 };
    }
  }
  if (lastRouteAbsent) {
    return {
      failed: true,
      reason: `Licentic has no active-licence route (tried: ${ACTIVE_LICENSE_PATH_CANDIDATES.join(", ")})`
    };
  }
  return { failed: true, reason: "Licentic verification could not be completed" };
}
var _currentLicenseId = null;
async function validateLicense(customerEmail) {
  const normalizedInputEmail = String(customerEmail || "").trim().toLowerCase();
  if (!normalizedInputEmail || !normalizedInputEmail.includes("@")) {
    return { valid: false, reason: "Invalid or missing customer email" };
  }
  const requiredProductId = String(process.env.LMS_PRODUCT_ID || "").trim();
  try {
    logger.info(`[LMS] Validating license for ${maskEmail(normalizedInputEmail)} (product ${requiredProductId || "NOT SET"})`);
    if (!LMS_BASE_URL) {
      return { valid: false, reason: "Licentic base URL is not configured", customerEmail: normalizedInputEmail };
    }
    if (!requiredProductId) {
      return { valid: false, reason: "Required product is not configured (LMS_PRODUCT_ID)", customerEmail: normalizedInputEmail };
    }
    const res = await fetchActiveLicense(normalizedInputEmail);
    if (res.failed) {
      logger.error(`[LMS] Verification failed for ${maskEmail(normalizedInputEmail)}: ${res.reason}`);
      return {
        valid: false,
        verified: false,
        verificationFailed: true,
        reason: res.reason,
        customerEmail: normalizedInputEmail
      };
    }
    if (res.rejected) {
      logger.warn(`[LMS] No licence for ${maskEmail(normalizedInputEmail)}: ${res.reason}`);
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: res.reason,
        customerEmail: normalizedInputEmail
      };
    }
    const data = res.data;
    const license = data.activeLicense || data.license || data.data?.activeLicense || data.data?.license || null;
    if (!license || typeof license !== "object") {
      logger.warn(`[LMS] HTTP 200 but no activeLicense object for ${maskEmail(normalizedInputEmail)}`);
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: "No active license found for this email",
        customerEmail: normalizedInputEmail
      };
    }
    const licenseProductId = (typeof license.productId === "string" ? license.productId : license.productId?._id) || license.product_id || license.licenseTypeId?.productId || license.licenseTypeId?.product?._id || null;
    if (!licenseProductId) {
      logger.warn("[LMS] Licence exposes no productId --- cannot confirm it is Tally ERP Middleware");
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: "Could not confirm the license belongs to the required product",
        customerEmail: normalizedInputEmail
      };
    }
    if (String(licenseProductId) !== requiredProductId) {
      logger.warn(`[LMS] Wrong product: licence is "${licenseProductId}", required "${requiredProductId}"`);
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: "Active license is for a different product",
        customerEmail: normalizedInputEmail
      };
    }
    logger.info(`[LMS] Product OK: ${requiredProductId}`);
    const rawStatus = String(license.status || license.licenseStatus || "").trim().toLowerCase();
    const statusOk = rawStatus === "active" || license.valid === true || license.isActive === true;
    if (!statusOk) {
      logger.warn(`[LMS] Licence status is "${rawStatus || "inactive"}"`);
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: `License status is "${license.status || license.licenseStatus || "inactive"}" (not active)`,
        customerEmail: normalizedInputEmail
      };
    }
    logger.info(`[LMS] Status OK: ${rawStatus || "active"}`);
    const expiryRaw = license.endDate || license.expiresAt || license.expirationDate;
    if (!expiryRaw) {
      logger.warn("[LMS] Licence carries no endDate --- cannot confirm it is unexpired");
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: "Could not read the license expiry date",
        customerEmail: normalizedInputEmail
      };
    }
    const expDate = new Date(expiryRaw);
    if (isNaN(expDate.getTime())) {
      logger.warn(`[LMS] Licence endDate is unreadable: "${expiryRaw}"`);
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: "Could not read the license expiry date",
        customerEmail: normalizedInputEmail
      };
    }
    if (expDate.getTime() < Date.now()) {
      logger.warn(`[LMS] Licence expired on ${expDate.toISOString()}`);
      return {
        valid: false,
        verified: true,
        verificationFailed: false,
        reason: `License expired on ${expDate.toLocaleDateString("en-IN")}`,
        customerEmail: normalizedInputEmail
      };
    }
    logger.info(`[LMS] Expiry OK: ${expDate.toISOString()}`);
    const registry = await fetchFeatureRegistry();
    const licType = typeof license.licenseTypeId === "object" && license.licenseTypeId ? license.licenseTypeId : {};
    const rawFeatures = license.features || licType.features || data.features || [];
    const features = parseFeatures(rawFeatures, registry);
    const result = {
      valid: true,
      verified: true,
      verificationFailed: false,
      licenseId: license._id || license.id || license.licenseId || null,
      productId: requiredProductId,
      productName: typeof license.productId === "object" && license.productId?.name || licType.product?.name || null,
      plan: licType.name || license.planName || license.plan || "Active License",
      status: "active",
      endDate: expiryRaw,
      features,
      registry,
      customerEmail: normalizedInputEmail,
      appVersion: APP_VERSION
    };
    saveLicenseCache(result);
    _currentLicenseId = result.licenseId;
    logger.info(`[LMS] APPROVED ${maskEmail(normalizedInputEmail)} --- ${result.plan} until ${expDate.toISOString()}`);
    return result;
  } catch (err) {
    logger.error(`[LMS] validateLicense exception for ${maskEmail(normalizedInputEmail)}: ${err.message}`);
    return {
      valid: false,
      verified: false,
      verificationFailed: true,
      reason: "License verification failed",
      customerEmail: normalizedInputEmail
    };
  }
}

// routes/licenseRoute.js
var router2 = (0, import_express2.Router)();
function present(result, email) {
  return {
    valid: !!result.valid,
    // Distinguishes "we checked and there is no licence" from "we could not
    // check" (Licentic down / bad key). The UI must not treat the second as
    // either a pass or a plain rejection.
    verified: !!result.verified,
    verificationFailed: !!result.verificationFailed,
    plan: result.plan || null,
    productId: result.productId || null,
    productName: result.productName || null,
    endDate: result.endDate || null,
    customerEmail: result.customerEmail || email,
    features: result.features || {},
    reason: result.reason || null
  };
}
router2.post("/license/verify-email", async (req, res) => {
  const raw = (req.body || {}).email;
  if (typeof raw !== "string" || raw.trim() === "") {
    return res.status(400).json({ valid: false, reason: "Email required" });
  }
  const email = normalizeEmail(raw);
  if (!isStructurallyValidEmail(email)) {
    return res.status(400).json({ valid: false, reason: "Invalid email address" });
  }
  try {
    return res.json(present(await validateLicense(email), email));
  } catch {
    return res.status(500).json({
      valid: false,
      verified: false,
      verificationFailed: true,
      reason: "License verification failed"
    });
  }
});
router2.get("/license/status", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.json({ valid: false, reason: "Email query param required" });
  }
  try {
    const result = await validateLicense(email.trim().toLowerCase());
    res.json({
      valid: result.valid,
      plan: result.plan,
      endDate: result.endDate,
      customerEmail: result.customerEmail,
      features: result.features || {},
      reason: result.reason || null
    });
  } catch (e) {
    res.status(500).json({ valid: false, reason: e.message });
  }
});
var licenseRoute_default = router2;

// server.js
init_logger();
init_tallyClient();
init_syncChunkState();

// tally/erpToTallySync.js
init_tallyClient();
init_logger();
var import_fs5 = require("fs");
var import_path5 = require("path");
var sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
var TALLY_IMPORT_DELAY_MS = 600;
function _newTypeResult(typeName) {
  return {
    type: typeName,
    fetched: 0,
    created: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    startedAt: null,
    finishedAt: null
  };
}
async function syncSalesInvoices(creds = {}, options = {}) {
  const result = _newTypeResult("Sales Invoice \u2192 Sales Voucher");
  result.startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const companyName = options.companyName || "default";
  try {
    logger.info("[ERP\u2192Tally] Starting Sales Invoice sync \u2192 Tally Sales Voucher");
    const invoices = await fetchSalesInvoices(creds, {
      fromDate: options.fromDate,
      toDate: options.toDate,
      limit: options.limit || 50,
      filters: options.filters || []
    });
    result.fetched = invoices.length;
    if (invoices.length === 0) {
      logger.info("[ERP\u2192Tally] No Sales Invoices to sync");
      result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
      return result;
    }
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
        logger.error("[ERP\u2192Tally] Sales Voucher failed for " + inv.name + ": " + err.message);
      }
      if (i < invoices.length - 1) await sleep2(TALLY_IMPORT_DELAY_MS);
    }
    logger.info(
      "[ERP\u2192Tally] Sales Invoice sync complete: " + invoices.length + " fetched, " + result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP\u2192Tally] Sales Invoice sync failed: " + err.message);
  }
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return result;
}
async function syncPurchaseInvoices(creds = {}, options = {}) {
  const result = _newTypeResult("Purchase Invoice \u2192 Purchase Voucher");
  result.startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const companyName = options.companyName || "default";
  try {
    logger.info("[ERP\u2192Tally] Starting Purchase Invoice sync \u2192 Tally Purchase Voucher");
    const invoices = await fetchPurchaseInvoices(creds, {
      fromDate: options.fromDate,
      toDate: options.toDate,
      limit: options.limit || 50,
      filters: options.filters || []
    });
    result.fetched = invoices.length;
    if (invoices.length === 0) {
      logger.info("[ERP\u2192Tally] No Purchase Invoices to sync");
      result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
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
        logger.error("[ERP\u2192Tally] Purchase Voucher failed for " + inv.name + ": " + err.message);
      }
      if (i < invoices.length - 1) await sleep2(TALLY_IMPORT_DELAY_MS);
    }
    logger.info(
      "[ERP\u2192Tally] Purchase Invoice sync complete: " + invoices.length + " fetched, " + result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP\u2192Tally] Purchase Invoice sync failed: " + err.message);
  }
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return result;
}
async function syncExpenseEntries(creds = {}, options = {}) {
  const result = _newTypeResult("Payment Entry \u2192 Payment/Receipt Voucher");
  result.startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const companyName = options.companyName || "default";
  try {
    logger.info("[ERP\u2192Tally] Starting Payment Entry sync \u2192 Tally Payment/Receipt Voucher");
    const entries = await fetchExpenseEntries(creds, {
      fromDate: options.fromDate,
      toDate: options.toDate,
      limit: options.limit || 50,
      filters: options.filters || []
    });
    result.fetched = entries.length;
    if (entries.length === 0) {
      logger.info("[ERP\u2192Tally] No Payment Entries to sync");
      result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
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
        logger.error("[ERP\u2192Tally] Payment Voucher failed for " + entry.name + ": " + err.message);
      }
      if (i < entries.length - 1) await sleep2(TALLY_IMPORT_DELAY_MS);
    }
    logger.info(
      "[ERP\u2192Tally] Payment Entry sync complete: " + entries.length + " fetched, " + result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP\u2192Tally] Payment Entry sync failed: " + err.message);
  }
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return result;
}
async function syncJournalEntries(creds = {}, options = {}) {
  const result = _newTypeResult("Journal Entry \u2192 Journal Voucher");
  result.startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const companyName = options.companyName || "default";
  try {
    logger.info("[ERP\u2192Tally] Starting Journal Entry sync \u2192 Tally Journal Voucher");
    const entries = await fetchJournalEntries(creds, {
      fromDate: options.fromDate,
      toDate: options.toDate,
      limit: options.limit || 50,
      filters: options.filters || []
    });
    result.fetched = entries.length;
    if (entries.length === 0) {
      logger.info("[ERP\u2192Tally] No Journal Entries to sync");
      result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
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
        logger.error("[ERP\u2192Tally] Journal Voucher failed for " + entry.name + ": " + err.message);
      }
      if (i < entries.length - 1) await sleep2(TALLY_IMPORT_DELAY_MS);
    }
    logger.info(
      "[ERP\u2192Tally] Journal Entry sync complete: " + entries.length + " fetched, " + result.created + " created, " + result.updated + " updated, " + result.failed + " failed"
    );
  } catch (err) {
    result.errors.push({ name: "batch", error: err.message });
    logger.error("[ERP\u2192Tally] Journal Entry sync failed: " + err.message);
  }
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return result;
}
async function runErpToTallySync(creds = {}, options = {}) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const companyName = options.companyName || "default";
  logger.info("[ERP\u2192Tally] \u2550\u2550\u2550 Full ERPNext \u2192 Tally sync started \u2550\u2550\u2550");
  logger.info("[ERP\u2192Tally] Company: " + companyName + " | Date range: " + (options.fromDate || "all") + " \u2192 " + (options.toDate || "all"));
  const result = {
    company: companyName,
    startedAt,
    finishedAt: null,
    status: "running",
    sales: null,
    purchase: null,
    expenses: null,
    journals: null,
    totals: { fetched: 0, created: 0, updated: 0, failed: 0, skipped: 0 },
    errors: []
  };
  const steps = [];
  if (options.syncSales !== false) steps.push(["sales", () => syncSalesInvoices(creds, options)]);
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
      result.totals.failed += res.failed;
      result.totals.skipped += res.skipped;
      result.errors.push(...res.errors || []);
    } catch (err) {
      logger.error("[ERP\u2192Tally] " + key + " step crashed: " + err.message);
      result.errors.push({ name: key + "-step", error: err.message });
      result.totals.failed++;
    }
  }
  const hasCriticalFail = result.errors.length > 0 && result.totals.created === 0;
  const hasPartialFail = result.totals.failed > 0 && result.totals.created > 0;
  result.status = hasCriticalFail ? "failed" : hasPartialFail ? "warning" : "ok";
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  logger.info(
    "[ERP\u2192Tally] \u2550\u2550\u2550 Full sync complete: " + result.status + " \u2550\u2550\u2550 | Fetched: " + result.totals.fetched + ", Created: " + result.totals.created + ", Updated: " + result.totals.updated + ", Failed: " + result.totals.failed
  );
  return result;
}
var DEFAULT_INTERVAL_MS = 5 * 60 * 1e3;
var STATE_FILE2 = (0, import_path5.join)(process.cwd(), "erpToTallyScheduler.json");
var _timer = null;
var _running = false;
var _lastSyncTime = null;
var _intervalMs = DEFAULT_INTERVAL_MS;
var _schedulerOpts = {};
var _schedulerCreds = {};
var _syncCount = 0;
var _lastResult = null;
function _loadState() {
  try {
    if ((0, import_fs5.existsSync)(STATE_FILE2)) {
      const data = JSON.parse((0, import_fs5.readFileSync)(STATE_FILE2, "utf8"));
      _lastSyncTime = data.lastSyncTime || null;
      _syncCount = data.syncCount || 0;
      logger.info("[Scheduler] State loaded \u2014 last sync: " + (_lastSyncTime || "never") + ", total runs: " + _syncCount);
    }
  } catch (err) {
    logger.warn("[Scheduler] Could not load state file: " + err.message + " \u2014 starting fresh");
  }
}
function _saveState() {
  try {
    (0, import_fs5.writeFileSync)(STATE_FILE2, JSON.stringify({
      lastSyncTime: _lastSyncTime,
      syncCount: _syncCount,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2), "utf8");
  } catch (err) {
    logger.warn("[Scheduler] Could not save state file: " + err.message);
  }
}
async function _tick() {
  if (_running) {
    logger.warn("[Scheduler] Previous sync still running \u2014 skipping this tick");
    return;
  }
  _running = true;
  const tickStart = (/* @__PURE__ */ new Date()).toISOString();
  try {
    logger.info("[Scheduler] \u2550\u2550\u2550 Tick #" + (_syncCount + 1) + " \u2014 polling ERPNext \u2550\u2550\u2550");
    const result = await runErpToTallySync(_schedulerCreds, {
      ..._schedulerOpts,
      fromDate: _lastSyncTime || void 0
    });
    _lastResult = result;
    _syncCount++;
    if (result.totals.fetched > 0) {
      _lastSyncTime = tickStart;
    }
    _saveState();
    logger.info(
      "[Scheduler] Tick #" + _syncCount + " complete: " + result.status + " | Fetched: " + result.totals.fetched + ", Created: " + result.totals.created + ", Failed: " + result.totals.failed
    );
  } catch (err) {
    logger.error("[Scheduler] Tick #" + (_syncCount + 1) + " crashed: " + err.message);
    _lastResult = { status: "crashed", error: err.message, finishedAt: (/* @__PURE__ */ new Date()).toISOString() };
  } finally {
    _running = false;
  }
}
function startErpToTallyScheduler(creds = {}, options = {}) {
  if (!creds?.url || !creds?.apiKey || creds.url.includes("your-erpnext-domain") || creds.apiKey === "your_api_key_here") {
    logger.info("[Scheduler] Scheduler idle \u2014 configure ERPNext credentials in Settings or Sync UI to enable auto-sync.");
    return { started: false, message: "Credentials not configured" };
  }
  if (_timer) {
    logger.warn("[Scheduler] Already running \u2014 call stopErpToTallyScheduler() first");
    return { started: false, intervalMs: _intervalMs };
  }
  _schedulerCreds = creds;
  _schedulerOpts = { ...options };
  _intervalMs = options.intervalMs || DEFAULT_INTERVAL_MS;
  _loadState();
  if (options.fromDate && !_lastSyncTime) {
    _lastSyncTime = options.fromDate;
  }
  logger.info("[Scheduler] Starting \u2014 interval: " + _intervalMs / 1e3 + "s | company: " + (options.companyName || "default"));
  _tick();
  _timer = setInterval(_tick, _intervalMs);
  return { started: true, intervalMs: _intervalMs };
}

// server.js
var import_fs6 = __toESM(require("fs"), 1);
var import_path6 = __toESM(require("path"), 1);
var import_os4 = __toESM(require("os"), 1);
var import_url2 = require("url");
if (process.env.ERP_TO_TALLY_ENABLED === "true" && process.env.ERPNEXT_URL && !process.env.ERPNEXT_URL.includes("localhost:8000")) {
  startErpToTallyScheduler(
    { url: process.env.ERPNEXT_URL, apiKey: process.env.ERPNEXT_API_KEY, apiSecret: process.env.ERPNEXT_API_SECRET },
    { companyName: process.env.TALLY_COMPANY_NAME || "Tally", intervalMs: 6e4 }
  );
}
var app = (0, import_express3.default)();
app.use((0, import_cors.default)());
app.use(import_express3.default.json());
app.use("/api", routes_default);
app.use("/api", licenseRoute_default);
var __dirname2 = import_path6.default.dirname((0, import_url2.fileURLToPath)(__importMetaUrl));
var DATA_DIR_DEFAULT = import_path6.default.join(import_os4.default.homedir(), "AppData", "Roaming", "TallyERPNextIntegration", "data");
var CONFIG_DIR = process.env.DATA_DIR || DATA_DIR_DEFAULT;
var CONFIG_FILE = import_path6.default.join(CONFIG_DIR, "auto_sync_config.json");
var CREDS_FILE = import_path6.default.join(CONFIG_DIR, "auto_sync_creds.json");
var DEFAULT_CONFIG = {
  enabled: false,
  // FIX: Read from .env instead of hardcoding 24h / 30 days.
  // Set AUTO_SYNC_INTERVAL_MINUTES and AUTO_SYNC_FROM_DAYS in your .env file.
  intervalMs: (parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES, 10) || 1440) * 60 * 1e3,
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
    syncTaxes: false
  },
  creds: {
    url: "",
    apiKey: "",
    apiSecret: "",
    erpnextCompany: ""
  },
  companyName: "",
  // FIX: Read fromDays from .env — not hardcoded to 30
  fromDays: parseInt(process.env.AUTO_SYNC_FROM_DAYS, 10) || 30
};
function loadAutoSyncConfig() {
  try {
    if (!import_fs6.default.existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
    const raw = import_fs6.default.readFileSync(CONFIG_FILE, "utf8");
    const saved = JSON.parse(raw);
    let savedCreds = {};
    try {
      if (import_fs6.default.existsSync(CREDS_FILE)) {
        savedCreds = JSON.parse(import_fs6.default.readFileSync(CREDS_FILE, "utf8"));
        logger.info("Auto-sync: loaded ERPNext credentials from creds file");
      }
    } catch (e) {
      logger.warn("Could not load auto-sync creds file: " + e.message);
    }
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      options: { ...DEFAULT_CONFIG.options, ...saved.options || {} },
      creds: { ...DEFAULT_CONFIG.creds, ...saved.creds || {}, ...savedCreds }
    };
  } catch (err) {
    logger.warn("Could not load auto-sync config \u2014 using defaults. (" + err.message + ")");
    return { ...DEFAULT_CONFIG };
  }
}
var _persistTimer = null;
function persistAutoSyncConfig(immediate = false) {
  if (_persistTimer) {
    clearTimeout(_persistTimer);
    _persistTimer = null;
  }
  const doWrite = () => {
    _persistTimer = null;
    _writeAutoSyncConfig();
  };
  if (immediate) {
    doWrite();
    return;
  }
  _persistTimer = setTimeout(doWrite, 500);
}
function _writeAutoSyncConfig() {
  try {
    if (!import_fs6.default.existsSync(CONFIG_DIR)) import_fs6.default.mkdirSync(CONFIG_DIR, { recursive: true });
    const toSave = {
      ..._autoSyncConfig,
      creds: {
        url: _autoSyncConfig.creds.url,
        erpnextCompany: _autoSyncConfig.creds.erpnextCompany
      }
    };
    const tmp = CONFIG_FILE + ".bak";
    import_fs6.default.writeFileSync(tmp, JSON.stringify(toSave, null, 2), "utf8");
    import_fs6.default.renameSync(tmp, CONFIG_FILE);
    if (_autoSyncConfig.creds.apiKey && _autoSyncConfig.creds.apiSecret) {
      const credsToSave = {
        url: _autoSyncConfig.creds.url,
        apiKey: _autoSyncConfig.creds.apiKey,
        apiSecret: _autoSyncConfig.creds.apiSecret,
        erpnextCompany: _autoSyncConfig.creds.erpnextCompany
      };
      import_fs6.default.writeFileSync(CREDS_FILE, JSON.stringify(credsToSave, null, 2), "utf8");
    }
  } catch (err) {
    logger.warn("Could not save auto-sync config: " + err.message);
  }
}
var _autoSyncConfig = loadAutoSyncConfig();
var _autoSyncTimer = null;
var _syncRunning = false;
var _lastAutoSync = null;
var _lastSyncByCompany = {};
var _nextRunAt = null;
var _autoSyncRunCount = 0;
async function runAutoSync(triggeredBy = "interval") {
  if (_syncRunning) {
    logger.human.headsUp("Auto-sync skipped \u2014 previous run is still in progress.");
    return;
  }
  const { companyName, options, creds, fromDays } = _autoSyncConfig;
  logger.info(`[auto-sync] Pre-flight check \u2014 companyName="${companyName}" erpUrl="${creds.url || config.erpnext.url}" hasKey=${!!(creds.apiKey || config.erpnext.apiKey)}`);
  if (!companyName) {
    logger.human.headsUp("Auto-sync skipped \u2014 no Tally company name is set. Please go to Sync settings and enter your company name.");
    return;
  }
  const erpUrl = creds.url || config.erpnext.url;
  const erpKey = creds.apiKey || config.erpnext.apiKey;
  if (!erpUrl || !erpKey) {
    logger.human.headsUp("Auto-sync skipped \u2014 ERPNext connection details are missing. Please go to Sync settings and enter your ERPNext URL and API key.");
    return;
  }
  _syncRunning = true;
  _autoSyncRunCount++;
  const _runNum = _autoSyncRunCount;
  const now = /* @__PURE__ */ new Date();
  const toDate = now.toISOString().slice(0, 10);
  const effectiveCreds = {
    url: erpUrl,
    apiKey: erpKey,
    apiSecret: creds.apiSecret || config.erpnext.apiSecret,
    erpnextCompany: creds.erpnextCompany || ""
  };
  const erpnextUrl = effectiveCreds.url || "default";
  const state = getCompanyState(companyName, erpnextUrl);
  const isFirstSync = !state.lastVoucherSyncDate && !state.lastMasterSyncAt;
  let fallbackFromDate;
  if (isFirstSync) {
    try {
      const companies = await fetchTallyCompanies();
      const match = companies.find(
        (c) => c.name && c.name.trim().toLowerCase() === companyName.trim().toLowerCase()
      ) || companies[0];
      if (match) {
        const companyStart = match.startingFrom || match.booksFrom;
        if (companyStart) {
          fallbackFromDate = companyStart;
          logger.human.step(`First sync \u2014 using Tally company start date: ${fallbackFromDate}`);
        }
      }
    } catch (e) {
      logger.warn(`Could not fetch Tally company start date: ${e.message}`);
    }
  }
  if (!fallbackFromDate) {
    const d = new Date(now);
    d.setDate(d.getDate() - fromDays);
    fallbackFromDate = d.toISOString().slice(0, 10);
  }
  logger.resetLastSeenCompany(companyName);
  logger.human.autoSyncTriggered(companyName, _autoSyncConfig.intervalLabel, _runNum);
  logger.human.syncStarted(companyName, effectiveCreds.url);
  _lastAutoSync = {
    startedAt: now.toISOString(),
    status: "running",
    company: companyName,
    triggeredBy,
    fromDate: state.lastVoucherSyncDate || fallbackFromDate,
    toDate,
    isIncremental: !isFirstSync
  };
  try {
    let groups = [];
    let costCentres = [];
    let godowns = [];
    let ledgers = [];
    let stockItems = [];
    if (options.syncChartOfAccounts || options.syncOpeningBalances) {
      logger.human.syncStepStarting("Chart of Accounts \u2014 reading account groups from Tally");
      const allGroups = await fetchTallyGroups(companyName);
      const { toSync: changedGroups, unchanged: unchangedGroups } = filterChangedMasters(allGroups, state.groupAlterIds);
      logger.human.masterSyncResult("Groups", changedGroups.length, unchangedGroups);
      if (changedGroups.length === 0) logger.human.syncStepSkipped("Chart of Accounts", unchangedGroups);
      groups = changedGroups;
      saveCompanyState(companyName, { groupAlterIds: buildAlterIdMap(allGroups) }, erpnextUrl);
    }
    if (options.syncCostCentres) {
      logger.human.syncStepStarting("Cost Centres \u2014 reading from Tally");
      const allCostCentres = await fetchTallyCostCentres(companyName);
      const { toSync: changedCostCentres, unchanged: unchangedCostCentres } = filterChangedMasters(allCostCentres, state.costCentreAlterIds);
      logger.human.masterSyncResult("Cost Centres", changedCostCentres.length, unchangedCostCentres);
      if (changedCostCentres.length === 0) logger.human.syncStepSkipped("Cost Centres", unchangedCostCentres);
      costCentres = changedCostCentres;
      saveCompanyState(companyName, { costCentreAlterIds: buildAlterIdMap(allCostCentres) }, erpnextUrl);
    }
    if (options.syncGodowns) {
      logger.human.syncStepStarting("Godowns \u2014 reading warehouses from Tally");
      const allGodowns = await fetchTallyGodowns(companyName);
      const { toSync: changedGodowns, unchanged: unchangedGodowns } = filterChangedMasters(allGodowns, state.godownAlterIds);
      logger.human.masterSyncResult("Godowns", changedGodowns.length, unchangedGodowns);
      if (changedGodowns.length === 0) logger.human.syncStepSkipped("Godowns", unchangedGodowns);
      godowns = changedGodowns;
      saveCompanyState(companyName, { godownAlterIds: buildAlterIdMap(allGodowns) }, erpnextUrl);
    }
    if (options.syncLedgers || options.syncOpeningBalances || options.syncSmartLedgers) {
      const stepLabel = options.syncSmartLedgers && !options.syncLedgers ? "Smart Ledgers \u2014 reading all ledgers from Tally (will filter by voucher usage)" : "Ledgers \u2014 reading from Tally";
      logger.human.syncStepStarting(stepLabel);
      const allLedgers = await fetchTallyLedgers(companyName);
      const { toSync: changedLedgers, unchanged: unchangedLedgers } = filterChangedMasters(allLedgers, state.ledgerAlterIds);
      logger.human.masterSyncResult("Ledgers", changedLedgers.length, unchangedLedgers);
      if (changedLedgers.length === 0 && !options.syncSmartLedgers)
        logger.human.syncStepSkipped("Ledgers", unchangedLedgers);
      ledgers = options.syncSmartLedgers && !options.syncLedgers ? allLedgers : changedLedgers;
      saveCompanyState(companyName, { ledgerAlterIds: buildAlterIdMap(allLedgers) }, erpnextUrl);
    }
    if (options.syncStock || options.syncTaxes) {
      logger.human.syncStepStarting("Stock Items \u2014 reading from Tally");
      const allStock = await fetchTallyStockItems(companyName);
      const { toSync: changedStock, unchanged: unchangedStock } = filterChangedMasters(allStock, state.stockAlterIds);
      logger.human.masterSyncResult("Stock Items", changedStock.length, unchangedStock);
      if (changedStock.length === 0) logger.human.syncStepSkipped("Stock Items", unchangedStock);
      stockItems = changedStock;
      saveCompanyState(companyName, { stockAlterIds: buildAlterIdMap(allStock) }, erpnextUrl);
    }
    let vouchers = [];
    if (options.syncVouchers || options.syncInvoices || options.syncSmartLedgers) {
      const fullSyncDone = isFullSyncComplete(companyName, erpnextUrl);
      const needsFullSync = isFirstSync || !fullSyncDone;
      if (needsFullSync) {
        const chunkFrom = fallbackFromDate;
        const chunkTo = toDate;
        logger.human.syncStepStarting(`Vouchers (FIRST SYNC) \u2014 reading monthly chunks from ${chunkFrom} to ${chunkTo}`);
        vouchers = await fetchTallyVouchersChunked(
          companyName,
          chunkFrom,
          chunkTo,
          erpnextUrl,
          (chunkId, count, totalChunks, idx, skipped) => {
            logger.human.step(
              `Voucher chunk ${chunkId} (${idx}/${totalChunks}): ${skipped ? "already synced, skipping" : count + " vouchers fetched"}`
            );
          }
        );
        logger.human.step(`First sync: ${vouchers.length} total vouchers fetched across all chunks`);
      } else {
        const { fromDate, toDate: vToDate } = getIncrementalVoucherDates(companyName, fallbackFromDate, toDate, erpnextUrl);
        logger.human.syncStepStarting(`Vouchers \u2014 reading from ${fromDate} to ${vToDate}`);
        vouchers = await fetchTallyVouchers(companyName, fromDate, vToDate);
        logger.human.step(`Read ${vouchers.length} voucher${vouchers.length !== 1 ? "s" : ""} from Tally (${fromDate} \u2192 ${vToDate})`);
      }
    }
    const result = await runFullSync(
      companyName,
      { groups, ledgers, stockItems, vouchers, godowns, costCentres },
      options,
      effectiveCreds
    );
    const shouldSaveState = result.status === "ok" || result.status === "warning";
    if (shouldSaveState) {
      const voucherStepOk = result.steps?.vouchers?.status === "ok" || result.steps?.vouchers?.status === "uptodate";
      const vouchersWereRequested = options.syncVouchers || options.syncInvoices || options.syncSmartLedgers;
      const shouldSaveVoucherDate = !vouchersWereRequested || voucherStepOk || vouchers.length > 0;
      saveCompanyState(companyName, {
        // Only advance the voucher checkpoint if vouchers actually synced
        ...shouldSaveVoucherDate ? { lastVoucherSyncDate: toDate } : {},
        lastMasterSyncAt: now.toISOString()
      }, erpnextUrl);
      logger.human.stateSaved(companyName);
      const fullSyncDone = isFullSyncComplete(companyName, erpnextUrl);
      const needsFullSync = isFirstSync || !fullSyncDone;
      if (needsFullSync && (options.syncVouchers || options.syncInvoices)) {
        markFullSyncComplete(companyName, erpnextUrl);
        logger.human.step(`Full sync complete \u2014 future auto-syncs for "${companyName}" will be incremental \u2705`);
      }
    } else {
      logger.human.headsUp(
        `Progress was not saved for "${companyName}" because a critical step failed. Fix the issue and run again.`
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
      finishedAt: (/* @__PURE__ */ new Date()).toISOString()
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
      finishedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveSyncHistoryRecord(_lastAutoSync);
    logger.human.syncFailed(companyName, err.message);
  } finally {
    _syncRunning = false;
    if (_autoSyncConfig.enabled && _autoSyncTimer) {
      _nextRunAt = new Date(Date.now() + _autoSyncConfig.intervalMs);
    }
    if (_autoSyncConfig.enabled && _nextRunAt) {
      logger.human.autoSyncNextScheduled(
        _nextRunAt.toLocaleTimeString("en-IN", { hour12: false }),
        _autoSyncConfig.intervalLabel
      );
    }
  }
}
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
  _autoSyncTimer = setInterval(() => {
    _nextRunAt = new Date(Date.now() + _autoSyncConfig.intervalMs);
    runAutoSync("interval");
  }, _autoSyncConfig.intervalMs);
  if (!silent) {
    logger.human.autoSyncScheduled(
      Object.entries(_autoSyncConfig.options).filter(([, v]) => v).map(([k]) => k).join(", "),
      _autoSyncConfig.intervalLabel
    );
  }
}
app.post("/api/auto-sync/configure", (req, res) => {
  const body = req.body || {};
  if (body.interval !== void 0) {
    const PRESETS = {
      // UI button labels → minutes
      "15 min": 15,
      "15min": 15,
      "15m": 15,
      "30 min": 30,
      "30min": 30,
      "30m": 30,
      "1 hour": 60,
      "1hour": 60,
      "1h": 60,
      "2 hours": 120,
      "2h": 120,
      "4 hours": 240,
      "4h": 240,
      "8 hours": 480,
      "8h": 480,
      "daily": 1440,
      "24h": 1440,
      "1 day": 1440
    };
    const raw = String(body.interval).trim().toLowerCase();
    let minutes;
    if (PRESETS[raw] !== void 0) {
      minutes = PRESETS[raw];
      _autoSyncConfig.intervalLabel = body.interval;
    } else {
      minutes = parseInt(raw, 10);
      _autoSyncConfig.intervalLabel = `${minutes}m`;
    }
    if (!isNaN(minutes) && minutes > 0) {
      _autoSyncConfig.intervalMs = minutes * 60 * 1e3;
    } else {
      return res.status(400).json({ ok: false, error: `Invalid interval "${body.interval}". Use '15 min', '30 min', '1 hour', '4 hours', '8 hours', 'daily' or a number of minutes.` });
    }
  }
  if (body.enabled !== void 0) _autoSyncConfig.enabled = !!body.enabled;
  if (body.companyName !== void 0) _autoSyncConfig.companyName = body.companyName.trim();
  if (body.fromDays !== void 0) _autoSyncConfig.fromDays = parseInt(body.fromDays, 10) || 30;
  if (body.options && typeof body.options === "object") {
    _autoSyncConfig.options = { ..._autoSyncConfig.options, ...body.options };
  }
  if (body.creds && typeof body.creds === "object") {
    _autoSyncConfig.creds = { ..._autoSyncConfig.creds, ...body.creds };
  }
  const scheduleFieldChanged = body.enabled !== void 0 || body.interval !== void 0 || body.companyName !== void 0;
  if (scheduleFieldChanged) {
    startScheduler();
  }
  persistAutoSyncConfig();
  res.json({
    ok: true,
    message: _autoSyncConfig.enabled ? `Auto-sync enabled \u2014 runs every ${_autoSyncConfig.intervalLabel}` : "Auto-sync configured but not enabled (set enabled: true to start)",
    config: _safeConfig()
  });
});
app.get("/api/auto-sync/status", (req, res) => {
  const requestedCompany = req.query.company || _autoSyncConfig.companyName;
  const history = loadSyncHistory(requestedCompany);
  let lastManual = null;
  try {
    const syncJobs = globalThis._syncJobs;
    if (syncJobs) {
      const completed = Array.from(syncJobs.values()).filter((j) => j.status === "done" && j.result?.steps).sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
      lastManual = completed[0]?.result || null;
    }
  } catch (_) {
  }
  const lastSync = _lastSyncByCompany[requestedCompany] || globalThis._lastSyncByCompany?.[requestedCompany] || _lastAutoSync || lastManual || history[0] || null;
  res.json({
    config: _safeConfig(),
    running: _syncRunning,
    lastSync,
    history,
    nextRunIn: _autoSyncConfig.enabled && _autoSyncTimer ? `up to ${_autoSyncConfig.intervalLabel}` : "not scheduled",
    nextRunAt: _nextRunAt ? _nextRunAt.toISOString() : null
  });
});
app.post("/api/auto-sync/run-now", async (_req, res) => {
  if (_syncRunning) {
    return res.status(409).json({ ok: false, error: "A sync is already running. Wait for it to finish." });
  }
  res.json({ ok: true, message: "Auto-sync triggered manually \u2014 running in background" });
  runAutoSync("manual");
});
app.post("/api/auto-sync/enable", (_req, res) => {
  _autoSyncConfig.enabled = true;
  startScheduler();
  const what = Object.entries(_autoSyncConfig.options).filter(([, v]) => v).map(([k]) => k).join(", ");
  logger.human.autoSyncEnabled(_autoSyncConfig.intervalLabel, what);
  persistAutoSyncConfig();
  res.json({ ok: true, message: `Auto-sync enabled \u2014 runs every ${_autoSyncConfig.intervalLabel}` });
});
app.post("/api/auto-sync/disable", (_req, res) => {
  _autoSyncConfig.enabled = false;
  stopScheduler();
  logger.human.autoSyncDisabled();
  persistAutoSyncConfig();
  res.json({ ok: true, message: "Auto-sync disabled" });
});
app.post("/api/auto-sync/reset-state", (req, res) => {
  const company = (req.body || {}).company || _autoSyncConfig.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const erpnextUrl = _autoSyncConfig.creds.url || config.erpnext.url || "default";
  resetCompanyState(company, erpnextUrl);
  resetChunkProgress(company, erpnextUrl);
  res.json({ ok: true, message: `Incremental state cleared for "${company}" \u2014 next sync will be a full sync` });
});
app.get("/api/auto-sync/state", (req, res) => {
  const company = req.query.company || _autoSyncConfig.companyName;
  if (!company) return res.status(400).json({ ok: false, error: "company required" });
  const erpnextUrl = _autoSyncConfig.creds.url || config.erpnext.url || "default";
  const state = getCompanyState(company, erpnextUrl);
  res.json({ ok: true, company, state });
});
function _safeConfig() {
  return {
    enabled: _autoSyncConfig.enabled,
    interval: _autoSyncConfig.intervalLabel,
    intervalMs: _autoSyncConfig.intervalMs,
    companyName: _autoSyncConfig.companyName,
    fromDays: _autoSyncConfig.fromDays,
    options: _autoSyncConfig.options,
    erpnextUrl: _autoSyncConfig.creds.url || config.erpnext.url || "",
    erpnextCompany: _autoSyncConfig.creds.erpnextCompany || ""
    // Never expose apiKey / apiSecret
  };
}
if (_autoSyncConfig.enabled) {
  startScheduler(true);
}
var FRONTEND_BUILD = import_path6.default.join(
  process.env.FRONTEND_DIR || (process.pkg ? import_path6.default.dirname(process.execPath) : __dirname2),
  "frontend-build"
);
console.log("=== DEBUG ===");
console.log("FRONTEND_DIR env:", process.env.FRONTEND_DIR);
console.log("process.pkg:", !!process.pkg);
console.log("process.execPath:", process.execPath);
console.log("Resolved FRONTEND_BUILD:", FRONTEND_BUILD);
console.log("Exists:", import_fs6.default.existsSync(FRONTEND_BUILD));
console.log("=============");
if (import_fs6.default.existsSync(FRONTEND_BUILD)) {
  app.use(import_express3.default.static(FRONTEND_BUILD));
  app.get("*", (_req, res) => {
    res.sendFile(import_path6.default.join(FRONTEND_BUILD, "index.html"));
  });
}
app.listen(config.port, () => {
  logger.human.tallyConnected(config.tally.url);
  logger.human.checkReady();
  if (!_autoSyncConfig.enabled) {
    logger.human.headsUp(
      "Auto-sync is off. You can turn it on from the Sync settings page and choose how often it should run."
    );
  }
});
