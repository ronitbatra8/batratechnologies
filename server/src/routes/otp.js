const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { generateOTP, sendOTPEmail } = require("../utils/email");
const { safeErrorMessage, validateEmail, normalizePhone } = require("../utils/helpers");

const router = express.Router();

function validatePhone(phone) {
  if (!phone) return true;
  const n = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(n);
}

router.post("/send-otp", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !password || !email) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian phone number" });
    }

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const normalizedPhone = phone ? normalizePhone(phone) : null;
    if (normalizedPhone) {
      const phoneExists = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      if (phoneExists) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
    }

    const code = generateOTP();
    const hashed = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const existing = await prisma.otp.findUnique({ where: { email } });
    if (existing) {
      const elapsed = Date.now() - new Date(existing.createdAt).getTime();
      if (elapsed < 60000) {
        return res.status(429).json({ error: "Please wait 60 seconds before requesting a new OTP" });
      }
    }

    await prisma.otp.upsert({
      where: { email },
      update: { code, password: hashed, phone: normalizedPhone, name: name.trim(), role: role || "CUSTOMER", expiresAt, createdAt: new Date() },
      create: { email, code, password: hashed, phone: normalizedPhone, name: name.trim(), role: role || "CUSTOMER", expiresAt },
    });

    try {
      await sendOTPEmail(email, code, name.trim());
    } catch (err) {
      console.error("Email OTP failed:", err.message);
      return res.status(500).json({ error: "Failed to send OTP email. Please try again." });
    }

    res.json({ message: "OTP sent to your email", email });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }

    const record = await prisma.otp.findUnique({ where: { email } });
    if (!record) {
      return res.status(400).json({ error: "No pending registration found. Please register again." });
    }

    if (new Date() > record.expiresAt) {
      await prisma.otp.delete({ where: { email } });
      return res.status(400).json({ error: "OTP has expired. Please register again." });
    }

    if (record.code !== code.trim()) {
      return res.status(400).json({ error: "Incorrect OTP. Please try again." });
    }

    const validRoles = ["CUSTOMER", "DELIVERY", "SELLER"];
    const userRole = validRoles.includes(record.role) ? record.role : "CUSTOMER";
    const needsApproval = userRole === "DELIVERY" || userRole === "SELLER";
    const user = await prisma.user.create({
      data: { name: record.name, email: record.email, password: record.password, phone: record.phone, role: userRole, approved: !needsApproval },
    });

    await prisma.otp.delete({ where: { email } });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, approved: !needsApproval },
    });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const record = await prisma.otp.findUnique({ where: { email } });
    if (!record) {
      return res.status(400).json({ error: "No pending registration found. Please register again." });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.update({ where: { email }, data: { code, expiresAt } });

    try {
      await sendOTPEmail(email, code, record.name);
    } catch (err) {
      return res.status(500).json({ error: "Failed to resend OTP. Please try again." });
    }

    res.json({ message: "OTP resent to your email" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

module.exports = router;
