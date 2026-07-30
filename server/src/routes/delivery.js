const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { safeErrorMessage } = require("../utils/helpers");
const { sendDeliveryCodeEmail, sendReturnCodeEmail, sendOrderStatusUpdate } = require("../utils/email");

const router = express.Router();

router.get("/orders", auth, requireRole("DELIVERY"), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { assignedTo: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/orders/:id", auth, requireRole("DELIVERY"), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.assignedTo !== req.userId) return res.status(403).json({ error: "Not assigned to you" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/orders/:id/send-code", auth, requireRole("DELIVERY"), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.assignedTo !== req.userId) return res.status(403).json({ error: "Not assigned to you" });
    if (order.status !== "shipped" && order.status !== "out_for_delivery") return res.status(400).json({ error: "Order must be shipped first" });
    if (order.deliveryCode) return res.status(400).json({ error: "Code already sent" });

    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (!user || !user.email) return res.status(400).json({ error: "Customer has no email" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryCode: code, deliveryCodeSentAt: new Date(), status: "out_for_delivery" },
    });

    const deliveryGuy = await prisma.user.findUnique({ where: { id: req.userId } });
    await sendDeliveryCodeEmail(user.email, user.name || "Customer", code, deliveryGuy?.name || "Delivery Executive");

    res.json({ message: "Verification code sent to customer" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/orders/:id/verify-code", auth, requireRole("DELIVERY"), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.assignedTo !== req.userId) return res.status(403).json({ error: "Not assigned to you" });
    if (order.deliveryCode !== code) return res.status(400).json({ error: "Invalid verification code" });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "delivered", deliveryCode: null, deliveredAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (user?.email) {
      sendOrderStatusUpdate(user.email, user.name, { ...order, status: "delivered" }, order.status).catch((e) => console.error("Delivery email failed:", e.message));
    }

    res.json({ message: "Order delivered successfully" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/orders/:id/cancel-delivery", auth, requireRole("DELIVERY"), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.assignedTo !== req.userId) return res.status(403).json({ error: "Not assigned to you" });
    if (order.status === "delivered" || order.status === "cancelled") return res.status(400).json({ error: "Cannot cancel a delivered/cancelled order" });

    const updateData = { assignedTo: null };
    if (order.status === "out_for_delivery") {
      updateData.status = "shipped";
      updateData.deliveryCode = null;
      updateData.deliveryCodeSentAt = null;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    res.json({ message: "Delivery cancelled. Order returned to unassigned pool." });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/orders/:id/send-return-code", auth, requireRole("DELIVERY"), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.assignedTo !== req.userId) return res.status(403).json({ error: "Not assigned to you" });
    if (order.status !== "return_requested") return res.status(400).json({ error: "Order is not awaiting return pickup" });
    if (order.deliveryCode) return res.status(400).json({ error: "Code already sent" });

    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (!user || !user.email) return res.status(400).json({ error: "Customer has no email" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryCode: code, deliveryCodeSentAt: new Date(), status: "return_pickup_out" },
    });

    const deliveryGuy = await prisma.user.findUnique({ where: { id: req.userId } });
    await sendReturnCodeEmail(user.email, user.name || "Customer", code, deliveryGuy?.name || "Delivery Executive");

    res.json({ message: "Return pickup code sent to customer" });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/orders/:id/verify-return-code", auth, requireRole("DELIVERY"), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.assignedTo !== req.userId) return res.status(403).json({ error: "Not assigned to you" });
    if (order.deliveryCode !== code) return res.status(400).json({ error: "Invalid verification code" });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "returned", deliveryCode: null, returnedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (user?.email) {
      sendOrderStatusUpdate(user.email, user.name, { ...order, status: "returned" }, order.status).catch((e) => console.error("Return email failed:", e.message));
    }

    res.json({ message: "Return pickup completed. Order marked as returned." });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

module.exports = router;
