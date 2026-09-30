/**
 * LMS Integration Service
 * Validates a customer email against Licentic and approves it ONLY when
 * Licentic returns an active, unexpired licence for the configured product.
 *
 * Config (all from environment, nothing hardcoded):
 *   LMS_BASE_URL              e.g. https://dashboard.licentic.org
 *   LMS_API_KEY               sent as the x-api-key header
 *   LMS_PRODUCT_ID            required product, e.g. 6a23c644247319b4b7bf7006
 *   LMS_ACTIVE_LICENSE_PATH   route override (see ACTIVE_LICENSE_PATH_CANDIDATES)
 *
 * Fail closed: no licence, bad key, outage or unexpected shape all reject.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { logger } from '../logs/logger.js';

const LMS_BASE_URL = (process.env.LMS_BASE_URL || 'https://dashboard.licentic.org').replace(/\/+$/, '');
const LMS_API_KEY = String(process.env.LMS_API_KEY || '').trim();
// "Tally ERP Middleware". Env wins; the literal is only a last-resort default
// so a misconfigured .env still verifies against the right product.
const PRODUCT_ID = String(process.env.LMS_PRODUCT_ID || '').trim() || '6a23c644247319b4b7bf7006';

// Route that Licentic serves for "give me this email's active licence".
//
// IMPORTANT --- the deployed Licentic answers on `/actve-license` (no "i").
// `/active-license` is NOT registered and returns the catch-all 404. Verified
// against dashboard.licentic.org: actve 6/6 -> 200, active 6/6 -> 404.
// The configured path is tried first, then the known alternates, so this keeps
// working if Licentic ever corrects the spelling (or if you point at a
// deployment that already has). The winner is remembered for the process.
const ACTIVE_LICENSE_PATH_CANDIDATES = (() => {
  const configured = String(process.env.LMS_ACTIVE_LICENSE_PATH || '').trim();
  const list = configured ? [configured] : [];
  for (const p of ['/api/external/actve-license', '/api/external/active-license']) {
    if (!list.includes(p)) list.push(p);
  }
  return list.map((p) => '/' + p.replace(/^\/+/, '').replace(/\/+$/, ''));
})();

let _resolvedLicensePath = null;   // set once a path is known to work

function productIdQuery() {
  // Must use the PRODUCT_ID constant, not process.env directly: the packaged
  // EXE ships without a .env, so process.env.LMS_PRODUCT_ID is empty there and
  // the request would go out with no ?productId=, which Licentic answers with
  // "License not found for this product" for every customer.
  return PRODUCT_ID ? `?productId=${encodeURIComponent(PRODUCT_ID)}` : '';
}

const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// ── Cache location ─────────────────────────────────────────────────────────────
// FIX: these used to be `path.join(__dirname, '../logs/...')`. That resolves to
// the real project folder when run from source, but inside the packaged EXE
// __dirname is PKG's read-only virtual filesystem (C:\snapshot\backend), so
// every save died with "Cannot mkdir in a snapshot" and a successful login was
// never remembered. That is why the app looked reliable for the developer
// (cache worked) and unreliable for customers (cache never worked, so every
// single login hit Licentic's flaky endpoint).
//
// Caches now live in AppData alongside the other writable state, using the SAME
// folder name as logger.js / syncState.js / syncChunkState.js.
const LMS_CACHE_DIR = path.join(
  os.homedir(), 'AppData', 'Roaming', 'TallyERPNextIntegration', 'logs'
);

const LICENSE_CACHE_PATH = path.join(LMS_CACHE_DIR, 'license-cache.json');
const REGISTRY_CACHE_PATH = path.join(LMS_CACHE_DIR, 'feature-registry-cache.json');
const USAGE_CACHE_PATH = path.join(LMS_CACHE_DIR, 'usage-cache.json');

// A cached approval is honoured for this long before we re-ask Licentic. This is
// deliberately generous: the upstream endpoint intermittently 404s
// ("User not found") for real licence holders, and re-asking on every launch
// meant a transient upstream glitch locked a paying customer out of their app.
// Expiry of the LICENCE itself is still enforced separately in loadLicenseCache.
const CACHE_GRACE_MS = 12 * 60 * 60 * 1000; // 12 hours

import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
let APP_VERSION = '1.0.0';
try { APP_VERSION = _require('../package.json').version || '1.0.0'; } catch { }


// ------ HTTP helper ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function lmsFetch(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(LMS_BASE_URL + endpoint);
    const lib = url.protocol === 'https:' ? https : http;
    const body = options.body ? JSON.stringify(options.body) : undefined;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LMS_API_KEY,
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(options.headers || {}),
      },
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: { raw: data } }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('LMS request timed out')); });
    if (body) req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Logging helper. Customer addresses are masked so a log file cannot be used
// to harvest your customer list, while still being correlatable per request.
// ---------------------------------------------------------------------------
function maskEmail(email) {
  const s = String(email || '');
  const at = s.indexOf('@');
  if (at < 1) return s ? `${s.slice(0, 1)}***` : '(empty)';
  const name = s.slice(0, at);
  const domain = s.slice(at + 1);
  const tld = domain.slice(domain.lastIndexOf('.') + 1);
  return `${name.slice(0, Math.min(2, name.length))}***@***.${tld}`;
}

// ---------------------------------------------------------------------------
// Email normalisation / structural validation, shared with the route layer so
// bad input is rejected with 400 instead of becoming a wasted API call.
// ---------------------------------------------------------------------------
const EMAIL_MAX_LENGTH = 254;
const EMAIL_RE = /^[^\s@,;:<>()[\]\\"]+@[^\s@,;:<>()[\]\\".]+(\.[^\s@,;:<>()[\]\\".]+)+$/;

function normalizeEmail(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase();
}

function isStructurallyValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > EMAIL_MAX_LENGTH) return false;
  if (/\s/.test(email)) return false;
  return EMAIL_RE.test(email);
}

// ------ Cache helpers ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function saveLicenseCache(info) {
  try {
    const dir = path.dirname(LICENSE_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LICENSE_CACHE_PATH, JSON.stringify({
      ...info,
      // licenseKey is a secret and nothing consumes it - never persist it.
      licenseKey: undefined,
      productId: info.productId || String(process.env.LMS_PRODUCT_ID || '').trim(),
      cachedAt: new Date().toISOString(),
    }));
  } catch (e) { logger.warn(`[LMS] Cache save failed: ${e.message}`); }
}

/**
 * Load the cached licence, but ONLY when it genuinely belongs to this email and
 * this product and has not expired. Without those guards a cached approval for
 * one customer could be handed to another - the cache is never allowed to turn
 * an unlicensed email into a licensed one.
 *
 * `withinGraceMs` additionally requires the cache to be younger than that, so a
 * stale approval is refreshed from the LMS rather than trusted indefinitely.
 */
function loadLicenseCache(email, withinGraceMs = 0) {
  try {
    if (!fs.existsSync(LICENSE_CACHE_PATH)) return null;
    const cache = JSON.parse(fs.readFileSync(LICENSE_CACHE_PATH, 'utf8'));
    if (!cache) return null;

    if (email !== undefined) {
      const wanted = String(email || '').trim().toLowerCase();
      if (String(cache.customerEmail || '').trim().toLowerCase() !== wanted) return null;
    }

    const requiredProduct = String(PRODUCT_ID || '').trim();
    if (requiredProduct && String(cache.productId || '').trim() !== requiredProduct) return null;

    if (cache.endDate) {
      const exp = new Date(cache.endDate).getTime();
      if (Number.isNaN(exp) || exp < Date.now()) return null;   // expired cache is no cache
    }

    if (withinGraceMs > 0) {
      const at = new Date(cache.cachedAt).getTime();
      if (Number.isNaN(at) || Date.now() - at > withinGraceMs) return null;
    }

    return cache;
  } catch { return null; }
}

// Force clear registry cache so fresh features are fetched
function clearRegistryCache() {
  try {
    if (fs.existsSync(REGISTRY_CACHE_PATH)) fs.unlinkSync(REGISTRY_CACHE_PATH);
    if (fs.existsSync(LICENSE_CACHE_PATH)) fs.unlinkSync(LICENSE_CACHE_PATH);
    logger.info('[LMS] Cache cleared --- will re-fetch from LMS on next validation');
  } catch (e) { logger.warn('[LMS] Cache clear failed: ' + e.message); }
}

// ------ Feature Registry cache ------------------------------------------------------------------------------------------------------------------------------------------------------------
function saveRegistryCache(data) {
  try {
    const dir = path.dirname(REGISTRY_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REGISTRY_CACHE_PATH, JSON.stringify({
      data,
      cachedAt: Date.now()
    }));
  } catch (e) { logger.warn('[LMS] Registry cache save failed: ' + e.message); }
}

function loadRegistryCache() {
  try {
    if (fs.existsSync(REGISTRY_CACHE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(REGISTRY_CACHE_PATH, 'utf8'));
      // Registry cache valid for 24 hours
      if (raw?.cachedAt && (Date.now() - raw.cachedAt) < 24 * 60 * 60 * 1000) {
        return raw.data;
      }
    }
  } catch { }
  return null;
}

function saveUsageCache(data) {
  try {
    const dir = path.dirname(USAGE_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USAGE_CACHE_PATH, JSON.stringify(data));
  } catch { }
}

function loadUsageCache() {
  try {
    if (fs.existsSync(USAGE_CACHE_PATH))
      return JSON.parse(fs.readFileSync(USAGE_CACHE_PATH, 'utf8'));
  } catch { }
  return { companyCount: 0 };
}

// Called on startup --- syncs local cache to match what LMS actually has
// Prevents any drift from previous sessions
function syncUsageCacheFromLMS(lmsCompanyUsage) {
  const count = Number(lmsCompanyUsage) || 0;
  saveUsageCache({ companyCount: count });
  logger.info(`[LMS] Usage cache synced from LMS --- companyCount: ${count}`);
}

// ------ Fetch feature registry from LMS ------------------------------------------------------------------------------------------------------------------------------
// GET /api/feature-registry/:productId  (requires x-api-key)
// Returns all feature slugs, types and descriptions for this product
async function fetchFeatureRegistry() {
  // Try cache first
  const cached = loadRegistryCache();
  if (cached) {
    logger.info('[LMS] Feature registry loaded from cache');
    return cached;
  }

  try {
    logger.info('[LMS] Fetching feature registry from LMS...');
    const { status, data } = await lmsFetch(
      `/api/feature-registry/${PRODUCT_ID}`,
      { headers: { 'x-api-key': LMS_API_KEY } }
    );

    if (status !== 200) {
      logger.warn(`[LMS] Feature registry fetch failed --- HTTP ${status}`);
      return null;
    }

    // Handle both response shapes from LMS
    // Shape A: { success: true, data: { productId, features: [...] } }
    // Shape B: { success: true, features: [...] }
    const registry = data.data || data;
    if (!registry?.features || !Array.isArray(registry.features)) {
      logger.warn('[LMS] Feature registry response has no features array --- response: ' + JSON.stringify(data).substring(0, 200));
      return null;
    }

    saveRegistryCache(registry);
    logger.info(`[LMS] Feature registry fetched --- ${registry.features.length} features for product ${PRODUCT_ID}`);
    return registry;
  } catch (err) {
    logger.warn('[LMS] Feature registry fetch error: ' + err.message);
    return null;
  }
}

// ------ Feature parser ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Maps LMS LicenseType.features keys --- scheduler feature flags
// Admin sets these keys in the LMS dashboard per plan.
//
// Expected LMS feature keys:
//   syncInterval   (number, minutes)   --- 5 / 15 / 60
//   outstandingSync (bool)             --- true for all plans
//   ledgerSync      (bool)             --- Custom+
//   dueDateSync     (bool)             --- Custom+
//   maxCompanies    (number)           --- 1 or 3

// LMS returns license features as array: [{ featureSlug, featureType, value }]
// Registry provides the master list of all possible slugs + their types
// We merge both: registry defines what exists, license defines what's enabled
function parseFeatures(featuresArray = [], registry = null) {
  if (!Array.isArray(featuresArray)) return featuresArray;

  const map = {};

  // Step 1 --- seed all known slugs from registry with disabled defaults
  // This ensures every slug exists in the map even if not in the license
  if (registry?.features && Array.isArray(registry.features)) {
    for (const regFeature of registry.features) {
      const slug = regFeature.featureSlug;
      if (!slug) continue;
      if (regFeature.featureType === 'limit') {
        map[slug] = 0; // default limit = 0
      } else {
        map[slug] = false; // default boolean = false
      }
    }
  }

  // Step 2 --- overlay actual license values on top of registry defaults
  for (const f of featuresArray) {
    const slug = f.featureSlug;
    if (!slug) continue;
    if (f.featureType === 'boolean') {
      map[slug] = f.value === true || f.value === 'true' || f.value === 1;
    } else if (f.featureType === 'limit') {
      map[slug] = Number(f.value) || 0;
    } else {
      map[slug] = f.value;
    }
  }

  return map;
}

/**
 * Ask Licentic for an email's active licence.
 *
 * Two things the raw endpoint needs handling for:
 *
 *  1. Route discovery --- only one spelling of the route is registered, and the
 *     other answers with a catch-all 404. The catch-all is recognisable because
 *     its message echoes the path back ("Not Found - /api/..."), so we can tell
 *     "this route does not exist" apart from "this route ran and found no
 *     licence" and keep probing in the first case only.
 *
 *  2. Transient 404s --- the endpoint intermittently answers
 *     "License not found for this product" for customers who genuinely hold a
 *     licence. That is a Licentic-side glitch, so it is retried before being
 *     believed. Only after retries are exhausted is it a real rejection.
 */
async function fetchActiveLicense(normalizedEmail) {
  const query = productIdQuery();
  const encoded = encodeURIComponent(normalizedEmail);

  // Licentic intermittently answers 404 "User not found" for customers who DO
  // hold a licence. Observed in the field: the same address was approved at
  // 09:24 and rejected at 09:29 from the same machine and same product. The
  // previous budget (3 tries inside ~1.5s) was exhausted by the glitch and the
  // customer was then told they had no licence. Retry patiently, but keep the
  // whole sequence short enough that the browser is still waiting.
  const TRANSIENT_RETRIES = 4;
  const BACKOFF_BASE_MS = 500;
  const BACKOFF_MAX_MS = 3000;   // cap: 500 + 1000 + 2000 + 3000 = ~6.5s worst case

  const order = _resolvedLicensePath
    ? [_resolvedLicensePath, ...ACTIVE_LICENSE_PATH_CANDIDATES.filter((p) => p !== _resolvedLicensePath)]
    : ACTIVE_LICENSE_PATH_CANDIDATES;

  let lastRouteAbsent = null;
  // Set when a route that clearly EXISTS answers with a business-level miss.
  // This is what separates "Licentic is glitching" from "Licentic has no such
  // endpoint", and it must not be overwritten by a later candidate path that
  // happens to be unregistered.
  let transientMisses = 0;
  let lastTransientMsg = null;

  for (const path of order) {
    const endpoint = `${path}/${encoded}${query}`;

    for (let attempt = 0; attempt <= TRANSIENT_RETRIES; attempt++) {
      let status, data;
      try {
        ({ status, data } = await lmsFetch(endpoint, { headers: { 'x-api-key': LMS_API_KEY } }));
      } catch (netErr) {
        // Network/timeout: never a rejection, always a verification failure.
        return { failed: true, reason: `Licentic verification unavailable: ${netErr.message}` };
      }

      logger.info(`[LMS] Licentic ${path} attempt ${attempt + 1} -> HTTP ${status}`);

      if (status === 200 && data && data.success !== false) {
        if (_resolvedLicensePath !== path) {
          logger.info(`[LMS] Resolved Licentic route: ${path}`);
          _resolvedLicensePath = path;
        }
        return { ok: true, status, data, path };
      }

      const msg = String(data?.message || data?.error || '');

      // Route absent -> the catch-all echoes the requested path back.
      if (status === 404 && /^not found\s*-\s*\//i.test(msg)) {
        lastRouteAbsent = path;
        logger.warn(`[LMS] Route ${path} is not registered on this Licentic deployment`);
        break;   // try the next spelling
      }

      if (status === 401) {
        return { failed: true, reason: 'Licentic rejected the request: API key missing (HTTP 401)' };
      }
      if (status === 403) {
        return { failed: true, reason: 'Licentic rejected the request: API key invalid (HTTP 403)' };
      }
      if (status >= 500) {
        return { failed: true, reason: `Licentic server error (HTTP ${status}) --- verification could not be completed` };
      }

      // Route exists but returned a business-level miss. Licentic does this
      // intermittently for real licence holders, so retry before rejecting.
      if (status === 404) {
        transientMisses++;
        lastTransientMsg = msg;
        if (attempt < TRANSIENT_RETRIES) {
          const wait = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
          logger.warn(
            `[LMS] Licentic reported "${msg}" --- transient, retrying ` +
            `(attempt ${attempt + 1}/${TRANSIENT_RETRIES}) in ${wait}ms`
          );
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        break;  // fall through to the shared handling below
      }

      return { rejected: true, reason: msg || `No active license found for this email (HTTP ${status})`, path };
    }
  }

  // A business-level 404 that survived every retry is a Licentic-side glitch far
  // more often than a genuine "no licence". This takes precedence over
  // "route absent": the actve-license route demonstrably ran and answered, so the
  // app must say "could not verify, try again" rather than accusing a paying
  // customer of having no licence.
  if (transientMisses > 0) {
    return {
      failed: true,
      reason: lastTransientMsg
        ? `Licentic could not confirm this licence (upstream returned "${lastTransientMsg}" after ${TRANSIENT_RETRIES + 1} attempts). Please try again in a moment.`
        : 'Licentic could not confirm this licence. Please try again in a moment.',
    };
  }

  if (lastRouteAbsent) {
    return {
      failed: true,
      reason: `Licentic has no active-licence route (tried: ${ACTIVE_LICENSE_PATH_CANDIDATES.join(', ')})`,
    };
  }
  return { failed: true, reason: 'Licentic verification could not be completed' };
}

// ------ Public API ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

let _heartbeatTimer = null;
let _currentLicenseId = null;

/**
 * Validate license for the given customer email.
 *
 * Approves ONLY when Licentic returns an active, unexpired licence for the
 * configured product (LMS_PRODUCT_ID --- Tally ERP Middleware).
 *
 * Ownership (Case B): the Licentic response contains no email field at all ---
 * I verified the payload end to end and the only identity it carries is
 * `ownerUserId`, an ObjectId. There is therefore nothing to cross-check
 * against, and the endpoint's contract is relied upon instead: the route is
 * keyed by the email in the URL, so the licence returned IS the licence
 * resolved for that address. `activeLicense.email` is deliberately never
 * invented or assumed.
 *
 * Fails closed: every error path returns valid:false.
 * Returns: { valid, plan, features, licenseId, endDate, productId, ... }
 */
async function validateLicense(customerEmail) {
  const normalizedInputEmail = String(customerEmail || '').trim().toLowerCase();
  if (!normalizedInputEmail || !normalizedInputEmail.includes('@')) {
    return { valid: false, reason: 'Invalid or missing customer email' };
  }

  const requiredProductId = String(process.env.LMS_PRODUCT_ID || '').trim();

  try {
    logger.info(`[LMS] Validating license for ${maskEmail(normalizedInputEmail)} (product ${requiredProductId || 'NOT SET'})`);

    if (!LMS_BASE_URL) {
      return { valid: false, reason: 'Licentic base URL is not configured', customerEmail: normalizedInputEmail };
    }
    if (!requiredProductId) {
      // Without a product we cannot honour "licence must be for Tally ERP Middleware".
      return { valid: false, reason: 'Required product is not configured (LMS_PRODUCT_ID)', customerEmail: normalizedInputEmail };
    }

    // A previous approval for THIS email, THIS product, unexpired and still
    // inside the grace window is trusted without re-asking Licentic. Licentic's
    // endpoint is intermittently flaky, and re-asking on every launch meant a
    // passing upstream glitch locked a paying customer out of their own app.
    // The email, product and expiry guards inside loadLicenseCache keep this
    // from ever approving anyone who is not actually licensed.
    const cached = loadLicenseCache(normalizedInputEmail, CACHE_GRACE_MS);
    if (cached && cached.valid === true) {
      logger.info(
        `[LMS] Using cached approval for ${maskEmail(normalizedInputEmail)} ` +
        `(verified ${cached.cachedAt || 'unknown'}) --- skipping Licentic round trip`
      );
      _currentLicenseId = cached.licenseId || null;
      return {
        ...cached,
        valid: true,
        verified: true,
        verificationFailed: false,
        fromCache: true,
        customerEmail: normalizedInputEmail,
      };
    }

    const res = await fetchActiveLicense(normalizedInputEmail);

    // Verification could not be completed --- never a rejection disguised as one,
    // and never an approval.
    if (res.failed) {
      logger.error(`[LMS] Verification failed for ${maskEmail(normalizedInputEmail)}: ${res.reason}`);
      return {
        valid: false, verified: false, verificationFailed: true,
        reason: res.reason, customerEmail: normalizedInputEmail,
      };
    }
    if (res.rejected) {
      logger.warn(`[LMS] No licence for ${maskEmail(normalizedInputEmail)}: ${res.reason}`);
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: res.reason, customerEmail: normalizedInputEmail,
      };
    }

    const data = res.data;

    // A 200 alone is not a pass --- the licence object must exist.
    const license = data.activeLicense || data.license || data.data?.activeLicense || data.data?.license || null;
    if (!license || typeof license !== 'object') {
      logger.warn(`[LMS] HTTP 200 but no activeLicense object for ${maskEmail(normalizedInputEmail)}`);
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: 'No active license found for this email', customerEmail: normalizedInputEmail,
      };
    }

    // ------ Product must be Tally ERP Middleware ---------------------------------------------------------------------------------------------------
    // Licentic returns productId as a populated object on the licence and as a
    // plain string on the licenceType; both are accepted.
    const licenseProductId =
      (typeof license.productId === 'string' ? license.productId : license.productId?._id) ||
      license.product_id ||
      license.licenseTypeId?.productId ||
      license.licenseTypeId?.product?._id ||
      null;

    if (!licenseProductId) {
      logger.warn('[LMS] Licence exposes no productId --- cannot confirm it is Tally ERP Middleware');
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: 'Could not confirm the license belongs to the required product',
        customerEmail: normalizedInputEmail,
      };
    }
    if (String(licenseProductId) !== requiredProductId) {
      logger.warn(`[LMS] Wrong product: licence is "${licenseProductId}", required "${requiredProductId}"`);
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: 'Active license is for a different product',
        customerEmail: normalizedInputEmail,
      };
    }
    logger.info(`[LMS] Product OK: ${requiredProductId}`);

    // ------ Status must be active ---------------------------------------------------------------------------------------------------------------------------------------------
    const rawStatus = String(license.status || license.licenseStatus || '').trim().toLowerCase();
    const statusOk = rawStatus === 'active'
      || license.valid === true
      || license.isActive === true;
    if (!statusOk) {
      logger.warn(`[LMS] Licence status is "${rawStatus || 'inactive'}"`);
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: `License status is "${license.status || license.licenseStatus || 'inactive'}" (not active)`,
        customerEmail: normalizedInputEmail,
      };
    }
    logger.info(`[LMS] Status OK: ${rawStatus || 'active'}`);

    // ------ Expiry ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    const expiryRaw = license.endDate || license.expiresAt || license.expirationDate;
    if (!expiryRaw) {
      logger.warn('[LMS] Licence carries no endDate --- cannot confirm it is unexpired');
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: 'Could not read the license expiry date',
        customerEmail: normalizedInputEmail,
      };
    }
    const expDate = new Date(expiryRaw);
    if (isNaN(expDate.getTime())) {
      logger.warn(`[LMS] Licence endDate is unreadable: "${expiryRaw}"`);
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: 'Could not read the license expiry date',
        customerEmail: normalizedInputEmail,
      };
    }
    if (expDate.getTime() < Date.now()) {
      logger.warn(`[LMS] Licence expired on ${expDate.toISOString()}`);
      return {
        valid: false, verified: true, verificationFailed: false,
        reason: `License expired on ${expDate.toLocaleDateString("en-IN")}`,
        customerEmail: normalizedInputEmail,
      };
    }
    logger.info(`[LMS] Expiry OK: ${expDate.toISOString()}`);

    // All checks passed. Ownership relies on the endpoint being keyed by the
    // requested email --- see the note above validateLicense().
    const registry = await fetchFeatureRegistry();
    const licType = (typeof license.licenseTypeId === 'object' && license.licenseTypeId) ? license.licenseTypeId : {};
    const rawFeatures = license.features || licType.features || data.features || [];
    const features = parseFeatures(rawFeatures, registry);

    const result = {
      valid: true,
      verified: true,
      verificationFailed: false,
      licenseId: license._id || license.id || license.licenseId || null,
      productId: requiredProductId,
      productName: (typeof license.productId === 'object' && license.productId?.name) || licType.product?.name || null,
      plan: licType.name || license.planName || license.plan || 'Active License',
      status: 'active',
      endDate: expiryRaw,
      features,
      registry,
      customerEmail: normalizedInputEmail,
      appVersion: APP_VERSION,
    };

    saveLicenseCache(result);
    _currentLicenseId = result.licenseId;
    logger.info(`[LMS] APPROVED ${maskEmail(normalizedInputEmail)} --- ${result.plan} until ${expDate.toISOString()}`);
    return result;

  } catch (err) {
    // Fail closed. An exception is never turned into an approval.
    logger.error(`[LMS] validateLicense exception for ${maskEmail(normalizedInputEmail)}: ${err.message}`);
    return {
      valid: false, verified: false, verificationFailed: true,
      reason: 'License verification failed',
      customerEmail: normalizedInputEmail,
    };
  }
}

/**
 * POST /api/heartbeat/:licenseId
 * Keeps the license ACTIVE in LMS. Non-fatal if it fails.
 */
async function sendHeartbeat(licenseId, usageFeatures = []) {
  const id = licenseId || _currentLicenseId;
  if (!id) return;

  // Get userId from license cache --- LMS expects the user's _id, not licenseId
  const cache = loadLicenseCache();
  const userId = cache?.userId || cache?.licenseId || id;

  try {
    const { status } = await lmsFetch(`/api/heartbeat/${id}`, {
      method: 'POST',
      body: {
        userId,
        features: usageFeatures, // [{ slug, value }]
      },
    });
    if (status === 200) logger.debug(`[LMS] Heartbeat OK`);
    else logger.warn(`[LMS] Heartbeat HTTP ${status}`);
  } catch (e) {
    logger.warn(`[LMS] Heartbeat failed: ${e.message}`);
  }
}

function startHeartbeat(licenseId) {
  clearHeartbeatInterval();
  _currentLicenseId = licenseId || _currentLicenseId;
  sendHeartbeat(_currentLicenseId, []);
  _heartbeatTimer = setInterval(() => sendHeartbeat(_currentLicenseId, []), HEARTBEAT_INTERVAL_MS);
  logger.info('[LMS] Heartbeat loop started (every 30 min)');
}

/**
 * Update company-limit usage in LMS via heartbeat
 * value = number of companies currently configured
 * LMS increments usage, so we send the delta (not absolute count)
 */
async function updateCompanyUsage(newCount) {
  const id = _currentLicenseId;
  if (!id) {
    logger.warn('[LMS] Cannot update company usage --- no active licenseId');
    return;
  }

  const usage = loadUsageCache();
  const prevCount = usage.companyCount || 0;
  const delta = newCount - prevCount;

  if (delta === 0) {
    logger.info(`[LMS] company-limit unchanged (${newCount}) --- skipping`);
    return;
  }

  const cache = loadLicenseCache();
  const userId = cache?.licenseId || id;

  try {
    logger.info(`[LMS] Updating company-limit --- prev: ${prevCount}, new: ${newCount}, delta: ${delta > 0 ? '+' : ''}${delta}`);

    // Save cache BEFORE the API call so rapid sequential calls
    // read the updated count and don't recalculate wrong deltas
    saveUsageCache({ companyCount: newCount });

    const { status } = await lmsFetch(`/api/heartbeat/${id}`, {
      method: 'POST',
      body: {
        userId,
        features: [{ slug: 'company-limit', value: delta }]
      }
    });
    if (status === 200) {
      logger.info(`[LMS] company-limit updated: ${prevCount} --- ${newCount}`);
    } else {
      // Revert cache if LMS call failed
      saveUsageCache({ companyCount: prevCount });
      logger.warn(`[LMS] company-limit update failed --- HTTP ${status}, reverted cache`);
    }
  } catch (e) {
    // Revert cache on error
    saveUsageCache({ companyCount: prevCount });
    logger.warn(`[LMS] updateCompanyUsage error: ${e.message}`);
  }
}

function clearHeartbeatInterval() {
  if (_heartbeatTimer) { clearInterval(_heartbeatTimer); _heartbeatTimer = null; }
}

// ------ Periodic re-validation ------------------------------------------------------------------------------------------------------------------------------------------------------------
let _revalidateTimer = null;

function startRevalidation(customerEmail, onResult) {
  if (_revalidateTimer) clearInterval(_revalidateTimer);
  _revalidateTimer = setInterval(async () => {
    logger.info('[LMS] Periodic re-validation...');
    const result = await validateLicense(customerEmail);
    onResult(result);
  }, 6 * 60 * 60 * 1000); // every 6 hours
}

function stopRevalidation() {
  if (_revalidateTimer) { clearInterval(_revalidateTimer); _revalidateTimer = null; }
}

export {
  validateLicense, fetchFeatureRegistry, startHeartbeat, startRevalidation,
  stopRevalidation, clearHeartbeatInterval, parseFeatures, loadLicenseCache,
  loadUsageCache, saveUsageCache, syncUsageCacheFromLMS, clearRegistryCache,
  updateCompanyUsage, normalizeEmail, isStructurallyValidEmail, maskEmail,
};
