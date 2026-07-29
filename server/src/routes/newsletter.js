const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { safeErrorMessage } = require("../utils/helpers");

const router = express.Router();

function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_KEY) return res.status(403).json({ error: "Invalid admin key" });
  next();
}

router.post("/subscribe", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    const existing = await prisma.newsletter.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      if (existing.active) return res.json({ message: "Already subscribed!" });
      await prisma.newsletter.update({ where: { email: email.toLowerCase() }, data: { active: true, name: name || existing.name } });
      return res.json({ message: "Welcome back! You have been re-subscribed." });
    }
    await prisma.newsletter.create({ data: { email: email.toLowerCase(), name: name || null } });
    res.json({ message: "Subscribed successfully!" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/list", adminAuth, async (req, res) => {
  try {
    const [subscribers, activeCount] = await Promise.all([
      prisma.newsletter.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.newsletter.count({ where: { active: true } }),
    ]);
    res.json({ total: subscribers.length, active: activeCount, subscribers });
  } catch (err) {
    res.status(500).json({ error: "Failed to load subscribers" });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await prisma.newsletter.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.put("/:id/toggle", adminAuth, async (req, res) => {
  try {
    const sub = await prisma.newsletter.findUnique({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ error: "Subscriber not found" });
    const updated = await prisma.newsletter.update({ where: { id: req.params.id }, data: { active: !sub.active } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

module.exports = router;
