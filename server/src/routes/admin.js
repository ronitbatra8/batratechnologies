const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { sendOrderStatusUpdate, sendAdminEmail } = require("../utils/email");
const { VALID_ORDER_STATUSES, safeErrorMessage } = require("../utils/helpers");

const router = express.Router();

function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_KEY) return res.status(403).json({ error: "Invalid admin key" });
  next();
}

router.get("/orders", adminAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        deliveryExecutive: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
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

router.put("/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(", ")}` });
    }
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Order not found" });
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    try {
      if (existing) {
        const user = await prisma.user.findUnique({ where: { id: existing.userId }, select: { email: true, name: true } });
        if (user && user.email) {
          await sendOrderStatusUpdate(user.email, user.name, order, existing.status);
        }
      }
    } catch (emailErr) {
      console.error("Order status email failed:", emailErr.message);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, role: true, approved: true,
        createdAt: true,
        _count: { select: { orders: true, savedAddresses: true } },
      },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const revenue = await prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: "cancelled" } } });
    const pendingOrders = await prisma.order.count({ where: { status: "pending" } });
    const confirmedOrders = await prisma.order.count({ where: { status: "confirmed" } });
    const deliveredOrders = await prisma.order.count({ where: { status: "delivered" } });
    res.json({
      totalOrders, totalUsers, totalProducts,
      totalRevenue: revenue._sum.totalAmount || 0,
      pendingOrders, confirmedOrders, deliveredOrders,
    });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/password-resets", adminAuth, async (req, res) => {
  try {
    const resets = await prisma.passwordReset.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
    res.json(resets);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, approved: true, createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, items: true, totalAmount: true, status: true,
            shippingName: true, shippingPhone: true, shippingAddress: true,
            shippingCity: true, shippingState: true, shippingPincode: true,
            paymentMethod: true, createdAt: true,
          },
        },
        savedAddresses: { orderBy: { createdAt: "desc" } },
        reviews: {
          orderBy: { createdAt: "desc" },
          select: { id: true, rating: true, comment: true, createdAt: true, product: { select: { id: true, name: true, brand: true } } },
        },
        wishlists: {
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, product: { select: { id: true, name: true, brand: true, price: true, images: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          select: { id: true, subject: true, message: true, status: true, replyMessage: true, createdAt: true },
        },
        passwordResets: {
          orderBy: { createdAt: "desc" },
          select: { id: true, method: true, status: true, failReason: true, ipAddress: true, requestedAt: true, verifiedAt: true, completedAt: true, createdAt: true },
        },
        products: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, brand: true, category: true, price: true, originalPrice: true, description: true, images: true, inStock: true, badge: true, rating: true, reviewCount: true },
        },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const totalSpent = user.orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.totalAmount : 0), 0);
    res.json({ ...user, totalSpent });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/users/:id/email", adminAuth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: "Subject and message are required" });
    if (subject.trim().length < 2) return res.status(400).json({ error: "Subject must be at least 2 characters" });
    if (message.trim().length < 3) return res.status(400).json({ error: "Message must be at least 3 characters" });

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.email) return res.status(400).json({ error: "This user has no email address" });

    await sendAdminEmail(user.email, user.name, subject.trim(), message.trim());
    res.json({ success: true, message: `Email sent to ${user.name}` });
  } catch (err) {
    console.error("Admin send email failed:", err.message);
    res.status(500).json({ error: "Failed to send email. Please try again." });
  }
});

module.exports = router;

router.get("/delivery-executives", adminAuth, async (req, res) => {
  try {
    const execs = await prisma.user.findMany({
      where: { role: "DELIVERY" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, approved: true, createdAt: true,
        _count: { select: { assignedOrders: true } },
      },
    });
    res.json(execs);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/sellers", adminAuth, async (req, res) => {
  try {
    const sellers = await prisma.user.findMany({
      where: { role: "SELLER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, approved: true, createdAt: true,
        _count: { select: { products: true } },
      },
    });
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.put("/users/:id/approve", adminAuth, async (req, res) => {
  try {
    const { approved } = req.body;
    if (typeof approved !== "boolean") return res.status(400).json({ error: "approved must be true or false" });
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "ADMIN") return res.status(400).json({ error: "Cannot approve/reject admin" });
    await prisma.user.update({ where: { id: req.params.id }, data: { approved } });
    res.json({ message: approved ? "User approved" : "User rejected" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.put("/orders/:id/assign", adminAuth, async (req, res) => {
  try {
    const { deliveryId } = req.body;
    if (!deliveryId) return res.status(400).json({ error: "deliveryId is required" });
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    const exec = await prisma.user.findUnique({ where: { id: deliveryId } });
    if (!exec || exec.role !== "DELIVERY") return res.status(400).json({ error: "Invalid delivery executive" });
    if (!exec.approved) return res.status(400).json({ error: "Delivery executive is not approved" });
    await prisma.order.update({ where: { id: req.params.id }, data: { assignedTo: deliveryId } });
    res.json({ message: "Order assigned" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/impersonate/:id", adminAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true, role: true, approved: true } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});
