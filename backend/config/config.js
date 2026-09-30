import dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";
import os from "os";
import path from "path";
dotenv.config();

// TallyPrime only ever listens on the IPv4 loopback interface.
//
// `http://localhost:9000` is ambiguous: on Windows `localhost` resolves to
// `::1` (IPv6) first, and Node then dials `[::1]:9000` — which Tally is not
// listening on — giving `ECONNREFUSED ::1:9000` and a bogus "Tally not
// running" even though Tally is running. Whether the IPv6 attempt is even made
// depends on `net.getDefaultAutoSelectFamily()`, which is `true` on modern Node
// (so it silently falls back to IPv4) but `false` on the Node 18 runtime bundled
// by pkg — i.e. the bug only shows up on machines running the packaged EXE.
//
// Rewriting the loopback host to 127.0.0.1 removes the ambiguity entirely.
function normalizeTallyUrl(raw) {
  const url = String(raw || "").trim() || "http://127.0.0.1:9000";
  return url.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?=[/:?#]|$)/i,
    (_m, proto) => `${proto}127.0.0.1`);
}

// The packaged app ships without a `.env`, so an env var is not an option for
// end users whose Tally HTTP port is not 9000. Read an optional override file
// instead — same data folder the rest of the app already uses.
function readTallyUrlOverride() {
  try {
    const dir = process.env.DATA_DIR
      || path.join(os.homedir(), "AppData", "Roaming", "TallyERPNextIntegration", "data");
    const file = path.join(dir, "tally_url.txt");
    if (!existsSync(file)) return "";
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

const DEFAULT_TALLY_URL = "http://127.0.0.1:9000";

export const config = {
  port: parseInt(process.env.PORT) || 5000,

  tally: {
    // Precedence: TALLY_URL env var > override file > 127.0.0.1:9000
    url: normalizeTallyUrl(
      process.env.TALLY_URL || readTallyUrlOverride() || DEFAULT_TALLY_URL
    ),
    companyName: process.env.TALLY_COMPANY_NAME || "",
    timeoutMs: 600_000,
  },

  erpnext: {
    url:       process.env.ERPNEXT_URL       || "",   // e.g. https://mysite.frappe.cloud
    apiKey:    process.env.ERPNEXT_API_KEY    || "",   // from ERPNext → Settings → API Access
    apiSecret: process.env.ERPNEXT_API_SECRET || "",
  },
};