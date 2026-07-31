const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { safeErrorMessage } = require("../utils/helpers");

const router = express.Router();

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, GIF, and AVIF images are allowed"));
    }
    cb(null, true);
  },
});

function validateProduct(body, isUpdate) {
  const { name, brand, category, price, originalPrice, description, features, specifications, images, inStock, badge } = body;
  const errors = [];
  if (!isUpdate || name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) errors.push("Name must be 2-100 characters");
  }
  if (!isUpdate || brand !== undefined) {
    if (typeof brand !== "string" || brand.trim().length < 1 || brand.trim().length > 60) errors.push("Brand must be 1-60 characters");
  }
  if (!isUpdate || category !== undefined) {
    if (typeof category !== "string" || category.trim().length < 1 || category.trim().length > 60) errors.push("Category must be 1-60 characters");
  }
  if (price !== undefined) {
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0 || p > 10000000) errors.push("Price must be a positive number up to 10,000,000");
  }
  if (originalPrice !== undefined && originalPrice !== null) {
    const op = parseFloat(originalPrice);
    if (isNaN(op) || op <= 0 || op > 10000000) errors.push("Original price must be a positive number up to 10,000,000");
  }
  if (!isUpdate || description !== undefined) {
    if (typeof description !== "string" || description.trim().length < 10) errors.push("Description must be at least 10 characters");
  }
  if (images !== undefined) {
    if (!Array.isArray(images) || images.length > 8 || images.some((i) => typeof i !== "string" || !/^https?:\/\/.+/.test(i))) errors.push("Images must be an array of up to 8 valid URLs");
  }
  if (features !== undefined) {
    if (!Array.isArray(features) || features.length > 20 || features.some((f) => typeof f !== "string")) errors.push("Features must be an array of up to 20 strings");
  }
  if (specifications !== undefined) {
    if (typeof specifications !== "object" || specifications === null || Array.isArray(specifications)) errors.push("Specifications must be an object");
  }
  if (badge !== undefined && badge !== null && typeof badge !== "string") errors.push("Badge must be a string");
  if (inStock !== undefined && typeof inStock !== "boolean") errors.push("inStock must be a boolean");
  return errors;
}

router.post("/upload", auth, requireRole("SELLER"), (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "Image must be 5MB or smaller" });
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    if (!req.file) return res.status(400).json({ error: "No image file received" });
    const base = `${req.protocol}://${req.get("host")}`;
    res.json({ url: `${base}/api/uploads/${req.file.filename}` });
  });
});

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
    const validationErrors = validateProduct(req.body, false);
    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors[0] });
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
    const validationErrors = validateProduct(req.body, true);
    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors[0] });
    }
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
