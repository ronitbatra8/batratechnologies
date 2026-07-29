const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { sendOrderConfirmation } = require("../utils/email");
const { safeErrorMessage } = require("../utils/helpers");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { items, shippingName, shippingPhone, shippingAddress, shippingCity, shippingState, shippingPincode, paymentMethod } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: "No items in order" });
    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
      return res.status(400).json({ error: "Shipping details are required" });
    }

    let verifiedTotal = 0;
    const verifiedItems = [];
    for (const item of items) {
      const productId = item.productId || item.id;
      if (!productId) return res.status(400).json({ error: "Invalid item: missing productId" });
      const qty = parseInt(item.quantity) || 1;
      if (qty < 1 || qty > 10) return res.status(400).json({ error: "Quantity must be between 1 and 10" });
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(400).json({ error: `Product not found: ${productId}` });
      if (!product.inStock) return res.status(400).json({ error: `Product out of stock: ${product.name}` });
      verifiedTotal += product.price * qty;
      verifiedItems.push({ productId: product.id, name: product.name, price: product.price, quantity: qty, image: product.images?.[0] || "" });
    }

    const shipping = verifiedTotal >= 4999 ? 0 : 99;
    const totalAmount = Math.round((verifiedTotal + shipping) * 100) / 100;

    const order = await prisma.order.create({
      data: {
        userId: req.userId,
        items: verifiedItems,
        totalAmount,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        paymentMethod: paymentMethod === "UPI" ? "UPI" : "COD",
        status: "confirmed",
      },
    });

    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true, name: true } });
      if (user && user.email) {
        await sendOrderConfirmation(user.email, user.name, order);
      }
    } catch (emailErr) {
      console.error("Order confirmation email failed:", emailErr.message);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    const enriched = await Promise.all(orders.map(async (order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      let needsUpdate = false;
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { images: true } });
        const correctImage = product?.images?.[0] || "";
        if (item.image !== correctImage) {
          needsUpdate = true;
          return { ...item, image: correctImage };
        }
        return item;
      }));
      if (needsUpdate) {
        try { await prisma.order.update({ where: { id: order.id }, data: { items: enrichedItems } }); } catch {}
      }
      return { ...order, items: enrichedItems };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/track/:id", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, items: true, totalAmount: true, status: true, createdAt: true,
        shippingName: true, shippingPhone: true, shippingAddress: true,
        shippingCity: true, shippingState: true, shippingPincode: true, paymentMethod: true,
      },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.userId !== req.userId) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

module.exports = router;
