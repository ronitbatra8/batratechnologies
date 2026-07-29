const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { safeErrorMessage } = require("../utils/helpers");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.userId } });
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: "items must be an array" });
    const cart = await prisma.cart.upsert({
      where: { userId: req.userId },
      update: { items },
      create: { userId: req.userId, items },
    });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    await prisma.cart.deleteMany({ where: { userId: req.userId } });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

module.exports = router;
