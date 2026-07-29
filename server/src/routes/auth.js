const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { safeErrorMessage, validateEmail, normalizePhone, isEmail, isPhone } = require("../utils/helpers");
const { generateOTP, sendResetPasswordEmail, sendPasswordChangedEmail } = require("../utils/email");

const router = express.Router();

function validatePhone(phone) {
  if (!phone) return false;
  const n = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(n);
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Name, email, password and phone are required" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian phone number" });
    }
    if (email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }
    const cleaned = phone.replace(/[\s\-\(\)+]/g, "");
    const normalizedPhone = cleaned.startsWith("91") && cleaned.length === 12 ? cleaned.slice(2) : cleaned;
    const phoneExists = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    if (phoneExists) {
      return res.status(400).json({ error: "Phone number already registered" });
    }
    const validRoles = ["CUSTOMER", "DELIVERY", "SELLER"];
    const userRole = validRoles.includes(role) ? role : "CUSTOMER";
    const needsApproval = userRole === "DELIVERY" || userRole === "SELLER";
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone: normalizedPhone, role: userRole, approved: !needsApproval },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, approved: !needsApproval },
    });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone is required" });
    }
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else {
      const cleaned = phone.replace(/[\s\-\(\)+]/g, "");
      const num = cleaned.startsWith("91") && cleaned.length === 12 ? cleaned.slice(2) : cleaned;
      user = await prisma.user.findFirst({
        where: { phone: num },
      });
    }
    if (!user) {
      const msg = email ? "No account found with this email" : "No account found with this phone number";
      return res.status(401).json({ error: msg, code: "NOT_FOUND" });
    }
    if (!password) {
      return res.status(401).json({ error: "Please enter your password", code: "NO_PASSWORD" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect password. Please try again.", code: "WRONG_PASSWORD" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, approved: user.approved },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, approved: true, createdAt: true, savedAddresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, phone },
      select: { id: true, name: true, email: true, phone: true, role: true, approved: true, createdAt: true, savedAddresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: "Email or phone number is required" });

    let user;
    let lookupType;

    if (isEmail(identifier)) {
      lookupType = "email";
      user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase().trim() } });
      if (!user) return res.status(404).json({ error: "No account found with this email address" });
    } else if (isPhone(identifier)) {
      lookupType = "phone";
      const normalizedPhone = normalizePhone(identifier);
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      if (!user) return res.status(404).json({ error: "No account found with this phone number" });
    } else {
      return res.status(400).json({ error: "Please enter a valid email address or phone number" });
    }

    if (!user.email) return res.status(400).json({ error: "No email linked to this account. Please contact support." });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.upsert({
      where: { email: user.email },
      update: { code, name: user.name, password: "RESET", expiresAt, createdAt: new Date() },
      create: { email: user.email, code, name: user.name, password: "RESET", expiresAt },
    });

    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
    const method = lookupType === "email" ? "Email → OTP" : "Phone → Email OTP";
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        email: user.email,
        method,
        ipAddress: typeof ip === "string" ? ip : ip?.[0] || null,
        status: "requested",
      },
    });

    await sendResetPasswordEmail(user.email, code, user.name);

    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    res.json({ message: `OTP sent to ${maskedEmail}`, maskedEmail, identifier: maskedEmail });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/verify-reset-code", async (req, res) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) return res.status(400).json({ error: "Identifier and OTP code are required" });

    let user;
    if (isEmail(identifier)) {
      user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase().trim() } });
    } else if (isPhone(identifier)) {
      const normalizedPhone = normalizePhone(identifier);
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    } else {
      return res.status(400).json({ error: "Invalid identifier" });
    }

    if (!user) return res.status(404).json({ error: "No account found" });
    if (!user.email) return res.status(400).json({ error: "No email linked to this account" });

    const record = await prisma.otp.findUnique({ where: { email: user.email } });
    if (!record) return res.status(400).json({ error: "No reset request found. Please try again." });
    if (record.password !== "RESET") return res.status(400).json({ error: "Invalid reset session. Please try again." });
    if (new Date() > record.expiresAt) {
      await prisma.otp.delete({ where: { email: user.email } });
      const pending = await prisma.passwordReset.findFirst({ where: { userId: user.id, status: "requested" }, orderBy: { createdAt: "desc" } });
      if (pending) await prisma.passwordReset.update({ where: { id: pending.id }, data: { status: "expired", failReason: "OTP expired" } });
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }
    if (record.code !== code.trim()) {
      const pending = await prisma.passwordReset.findFirst({ where: { userId: user.id, status: "requested" }, orderBy: { createdAt: "desc" } });
      if (pending) await prisma.passwordReset.update({ where: { id: pending.id }, data: { status: "failed", failReason: "Incorrect OTP entered" } });
      return res.status(400).json({ error: "Incorrect OTP. Please try again." });
    }

    const resetToken = jwt.sign({ userId: user.id, purpose: "reset" }, process.env.JWT_SECRET, { expiresIn: "15m" });
    await prisma.otp.delete({ where: { email: user.email } });

    const pending = await prisma.passwordReset.findFirst({ where: { userId: user.id, status: "requested" }, orderBy: { createdAt: "desc" } });
    if (pending) await prisma.passwordReset.update({ where: { id: pending.id }, data: { status: "verified", verifiedAt: new Date() } });

    res.json({ resetToken, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ error: "Reset token and new password are required" });
    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "Invalid or expired reset token. Please start over." });
    }
    if (decoded.purpose !== "reset") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } });

    const pending = await prisma.passwordReset.findFirst({ where: { userId: decoded.userId, status: "verified" }, orderBy: { createdAt: "desc" } });
    if (pending) {
      await prisma.passwordReset.update({ where: { id: pending.id }, data: { status: "completed", completedAt: new Date() } });
    }

    try {
      const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
      await sendPasswordChangedEmail(user.email, user.name, pending?.method || "Forgot Password", typeof ip === "string" ? ip : ip?.[0] || null);
    } catch (emailErr) {
      console.error("Password changed email failed:", emailErr.message);
    }

    res.json({ message: "Password reset successfully! You can now sign in with your new password." });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

module.exports = router;
