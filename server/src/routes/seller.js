const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { safeErrorMessage } = require("../utils/helpers");

const router = express.Router();

router.get("/products", auth, requireRole("SELLER"), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.userId },
      orderBy: { name: "asc" },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/products", auth, requireRole("SELLER"), async (req, res) => {
  try {
    const { id, name, brand, category, price, originalPrice, description, features, specifications, images, inStock, badge } = req.body;
    if (!name || !brand || !category || !price || !description) {
      return res.status(400).json({ error: "Missing required fields: name, brand, category, price, description" });
    }
    const productId = id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (existing) return res.status(400).json({ error: "Product with this ID already exists" });

    const product = await prisma.product.create({
      data: {
        id: productId, name, brand, category, price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        description, features: features || [], specifications: specifications || {},
        images: images || [], inStock: inStock !== false, badge: badge || null,
        sellerId: req.userId,
      },
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/products/:id", auth, requireRole("SELLER"), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== req.userId) return res.status(403).json({ error: "Not your product" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.put("/products/:id", auth, requireRole("SELLER"), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== req.userId) return res.status(403).json({ error: "Not your product" });

    const { name, brand, category, price, originalPrice, description, features, specifications, images, inStock, badge } = req.body;
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(brand !== undefined && { brand }),
        ...(category !== undefined && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(description !== undefined && { description }),
        ...(features !== undefined && { features }),
        ...(specifications !== undefined && { specifications }),
        ...(images !== undefined && { images }),
        ...(inStock !== undefined && { inStock }),
        ...(badge !== undefined && { badge: badge || null }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.delete("/products/:id", auth, requireRole("SELLER"), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== req.userId) return res.status(403).json({ error: "Not your product" });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

module.exports = router;
