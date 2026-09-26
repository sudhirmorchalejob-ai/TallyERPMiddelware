import { Router } from "express";
import { validateLicense } from "../services/lmsService.js";

const router = Router();

/**
 * POST /api/license/verify-email
 * Body: { email }
 * Returns: { valid, plan, endDate, customerEmail, features, reason }
 */
router.post("/license/verify-email", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ valid: false, reason: "Email required" });
  }

  try {
    const result = await validateLicense(email.trim().toLowerCase());
    // Only send what the frontend needs — never expose secret license keys to browser
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