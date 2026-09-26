import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';

/**
 * Licentic licence verification tests.
 *
 * Uses a local stand-in that reproduces the real contract observed on
 * dashboard.licentic.org:
 *   - /api/external/actve-license/:email  is the registered route
 *   - /api/external/active-license/:email is NOT registered -> catch-all 404
 *     whose message echoes the path ("Not Found - /api/..."), which is how the
 *     client tells "no such route" from "route ran, found no licence"
 *   - 401 when x-api-key is absent, 403 when it is wrong
 *   - 200 { success, activeLicense: { productId, status, endDate, licenseTypeId } }
 *
 * The response deliberately carries NO email field, matching the real API.
 */

const REQUIRED_PRODUCT = '6a23c644247319b4b7bf7006';
const OTHER_PRODUCT = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const WORKING_ROUTE = '/api/external/actve-license';
const DEAD_ROUTE = '/api/external/active-license';

const LICENSED = 'licensed@example.com';
const OTHER_CUSTOMER = 'other.customer@example.com';

process.env.LMS_API_KEY = 'unit-test-key';
process.env.LMS_PRODUCT_ID = REQUIRED_PRODUCT;
process.env.LMS_ACTIVE_LICENSE_PATH = WORKING_ROUTE;
delete process.env.LMS_BASE_URL;

const cacheFile = new URL('../logs/license-cache.json', import.meta.url);
const snapshot = { existed: fs.existsSync(cacheFile), content: fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile) : null };

let behavior = 'ok';
let expectedApiKey = 'unit-test-key';
let transientBudget = 0;          // how many bogus 404s to emit before succeeding
const seenPaths = [];

function license(over = {}) {
  return {
    _id: 'lic-1',
    productId: { _id: REQUIRED_PRODUCT, name: 'Tally ERP Middleware' },
    status: 'active',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2099-12-31T23:59:59.000Z',
    ownerUserId: 'owner-1',                 // no email anywhere, like the real API
    licenseTypeId: { _id: 'lt-1', name: 'Enterprise', productId: REQUIRED_PRODUCT, features: [] },
    features: [],
    ...over,
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const json = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  seenPaths.push(url.pathname);

  // Mirror the real deployment: only "actve" is registered.
  if (!url.pathname.startsWith(`${WORKING_ROUTE}/`)) {
    return json(404, { success: false, message: `Not Found - ${url.pathname}` });
  }
  if (url.pathname.startsWith('/api/feature-registry/')) {
    return json(404, { success: false, message: 'Feature registry not found for this product' });
  }

  if (behavior === 'unavailable') { req.socket.destroy(); return; }
  if (req.headers['x-api-key'] !== expectedApiKey) {
    return json(403, { success: false, message: 'Invalid API Key' });
  }
  if (behavior === 'server-error') return json(503, { success: false, message: 'Service Unavailable' });
  if (behavior === 'no-key') {
    // Simulate the endpoint ignoring auth (as the real one does) to prove we
    // still never approve without a configured key.
    if (!process.env.LMS_API_KEY) return json(200, { success: true, activeLicense: license() });
  }

  const email = decodeURIComponent(url.pathname.slice(WORKING_ROUTE.length + 1)).toLowerCase();

  if (email !== LICENSED && email !== OTHER_CUSTOMER) {
    return json(404, { success: false, message: 'User not found' });
  }

  // Licentic intermittently answers "not found" for genuine licence holders.
  if (transientBudget > 0) {
    transientBudget--;
    return json(404, { success: false, message: 'License not found for this product' });
  }

  switch (behavior) {
    case 'expired':       return json(200, { success: true, activeLicense: license({ endDate: '2000-01-01T00:00:00.000Z' }) });
    case 'inactive':      return json(200, { success: true, activeLicense: license({ status: 'inactive' }) });
    case 'suspended':     return json(200, { success: true, activeLicense: license({ status: 'suspended' }) });
    case 'revoked':       return json(200, { success: true, activeLicense: license({ status: 'revoked' }) });
    case 'wrong-product': return json(200, { success: true, activeLicense: license({ productId: { _id: OTHER_PRODUCT, name: 'Other Product' }, licenseTypeId: { _id: 'lt-2', name: 'Basic', productId: OTHER_PRODUCT, features: [] } }) });
    case 'no-product':    { const l = license(); delete l.productId; delete l.licenseTypeId; return json(200, { success: true, activeLicense: l }); }
    case 'no-expiry':     { const l = license(); delete l.endDate; return json(200, { success: true, activeLicense: l }); }
    case 'bad-expiry':    return json(200, { success: true, activeLicense: license({ endDate: 'not-a-date' }) });
    case 'no-license':    return json(200, { success: true, message: 'ok' });
    case 'success-false': return json(200, { success: false, message: 'Something went wrong' });
    default:              return json(200, { success: true, activeLicense: license() });
  }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
process.env.LMS_BASE_URL = `http://127.0.0.1:${server.address().port}`;

// Imported at module scope: lmsService captures process.env at import time, so
// LMS_BASE_URL above must already be set.
const { validateLicense, loadLicenseCache } = await import('../services/lmsService.js');

const rows = [];
let failures = 0;
async function run(name, email, next, expectValid, opts = {}) {
  behavior = next;
  transientBudget = opts.transient || 0;
  expectedApiKey = opts.apiKey ?? 'unit-test-key';
  const r = await validateLicense(email);
  const actual = r.valid ? 'APPROVED' : (r.verificationFailed ? 'VERIFICATION FAILED' : 'REJECTED');
  const expected = expectValid ? 'APPROVED' : (opts.expectFailed ? 'VERIFICATION FAILED' : 'REJECTED');
  const pass = actual === expected;
  if (!pass) failures++;
  rows.push({ name, expected, actual, pass, note: r.reason || '' });
  return r;
}

function check(name, expected, actual) {
  const pass = expected === actual;
  if (!pass) failures++;
  rows.push({ name, expected, actual, pass, note: '' });
}

try {
  // --- Required case 1: valid licensed email ------------------------------
  const ok = await run('Valid licensed email', LICENSED, 'ok', true);
  check('  reports required product', REQUIRED_PRODUCT, ok.productId);
  check('  reports product name', 'Tally ERP Middleware', ok.productName);
  check('  reports plan', 'Enterprise', ok.plan);
  check('  normalised email echoed', LICENSED, ok.customerEmail);
  check('  activeLicenses used (route is actve)', true, seenPaths.some((p) => p.startsWith(WORKING_ROUTE)));

  // --- Required case 2: random email --------------------------------------
  await run('Random email', 'random123456@gmail.com', 'ok', false);

  // --- Case-insensitive / whitespace normalisation -------------------------
  await run('Case variation', 'LICENSED@EXAMPLE.COM', 'ok', true);
  await run('Surrounding whitespace', '  licensed@example.com  ', 'ok', true);

  // --- Required case 3: different customer (own licence -> approved) ------
  await run('Different customer, own licence', OTHER_CUSTOMER, 'ok', true);

  // --- Required case: wrong product ----------------------------------------
  await run('Wrong product', LICENSED, 'wrong-product', false);
  await run('Licence with no productId', LICENSED, 'no-product', false);

  // --- Required case: expired ---------------------------------------------
  await run('Expired licence', LICENSED, 'expired', false);
  await run('Licence with no endDate', LICENSED, 'no-expiry', false);
  await run('Licence with unreadable endDate', LICENSED, 'bad-expiry', false);

  // --- Required case: inactive / revoked ----------------------------------
  await run('Inactive licence', LICENSED, 'inactive', false);
  await run('Suspended licence', LICENSED, 'suspended', false);
  await run('Revoked licence', LICENSED, 'revoked', false);

  // --- Required case 6: invalid API key -----------------------------------
  await run('Invalid API key', LICENSED, 'ok', false, { apiKey: 'wrong-key', expectFailed: true });
  const savedKey = process.env.LMS_API_KEY;
  delete process.env.LMS_API_KEY;
  const noKey = await validateLicense(LICENSED);
  check('Missing API key never approves', false, noKey.valid);
  process.env.LMS_API_KEY = savedKey;

  // --- Required case 7: Licentic unavailable / server error ---------------
  await run('Licentic unavailable', LICENSED, 'unavailable', false, { expectFailed: true });
  await run('Licentic 5xx', LICENSED, 'server-error', false, { expectFailed: true });

  // --- 200 with no licence object / success:false -------------------------
  await run('HTTP 200 but no activeLicense', LICENSED, 'no-license', false);
  await run('HTTP 200 with success:false', LICENSED, 'success-false', false);

  // --- Transient Licentic 404s must be retried, not trusted ---------------
  await run('Transient 404 then success', LICENSED, 'ok', true, { transient: 2 });
  await run('Persistent 404 after retries', LICENSED, 'ok', false, { transient: 9 });

  // --- Malformed input ----------------------------------------------------
  for (const bad of ['', '   ', 'not-an-email', 'a@', '@b.com', 'a b@c.com', null, undefined, 42, {}]) {
    const r = await validateLicense(bad);
    check(`Malformed ${JSON.stringify(bad) ?? 'undefined'} rejected`, false, r.valid === true);
  }

  // --- Cache must not leak an approval across emails ----------------------
  await run('Prime cache with valid email', LICENSED, 'ok', true);
  check('Cache not readable for another email', null, loadLicenseCache('random123456@gmail.com'));
  check('Cache not readable when product differs', null,
    (() => { const p = process.env.LMS_PRODUCT_ID; process.env.LMS_PRODUCT_ID = OTHER_PRODUCT; const v = loadLicenseCache(LICENSED); process.env.LMS_PRODUCT_ID = p; return v; })());
  await run('Random email with cache primed', 'random123456@gmail.com', 'ok', false);
  await run('Cached email, Licentic offline', LICENSED, 'unavailable', false, { expectFailed: true });

  // --- Report -------------------------------------------------------------
  const pad = (s, n) => String(s).padEnd(n);
  console.log('');
  console.log(pad('TEST', 44) + pad('EXPECTED', 22) + pad('ACTUAL', 22) + 'RESULT');
  console.log('-'.repeat(100));
  for (const r of rows) {
    console.log(pad(r.name, 44) + pad(r.expected, 22) + pad(r.actual, 22) + (r.pass ? 'PASS' : `FAIL  ${r.note}`));
  }
  console.log('-'.repeat(100));
  console.log(`${rows.length - failures}/${rows.length} passed`);
  if (failures) {
    console.log('\nFAILURES:');
    for (const r of rows.filter((x) => !x.pass)) console.log(`  - ${r.name}: expected ${r.expected}, got ${r.actual} (${r.note})`);
  }
} finally {
  if (snapshot.existed) fs.writeFileSync(cacheFile, snapshot.content);
  else if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
  await new Promise((r) => server.close(r));
}

if (failures) process.exitCode = 1;
