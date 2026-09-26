import { Router } from "express";
import { validateLicense, normalizeEmail, isStructurallyValidEmail } from "../services/lmsService.js";

const router = Router();

/** Shape a result for the browser. Never includes the licence key. */
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
    reason: result.reason || null,
  };
}

/**
 * POST /api/license/verify-email
 * Body: { email }
 * Returns: { valid, verified, verificationFailed, plan, productId, productName,
 *            endDate, customerEmail, features, reason }
 */
router.post("/license/verify-email", async (req, res) => {
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
    // Fail closed, and do not echo internal error text to the browser.
    return res.status(500).json({
      valid: false, verified: false, verificationFailed: true,
      reason: "License verification failed",
    });
  }
});

/**
 * GET /api/license/status?email=...
 * Returns current license status for a given email or loaded cache
 */
router.get("/license/status", async (req, res) => {
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
      reason: result.reason || null,
    });
  } catch (e) {
    res.status(500).json({ valid: false, reason: e.message });
  }
});

export default router;