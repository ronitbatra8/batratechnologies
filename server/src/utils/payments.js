const PAYMENT_WINDOW_HOURS = 24;

const FINAL_STATUSES = ["cancelled", "delivered", "returned", "return_requested", "return_pickup_out"];

async function expireUnpaidOrders(prisma) {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_HOURS * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: {
      paymentMethod: "ONLINE",
      paymentStatus: "PENDING",
      createdAt: { lt: cutoff },
      status: { notIn: FINAL_STATUSES },
    },
    select: { id: true },
  });
  for (const o of stale) {
    await prisma.order.update({
      where: { id: o.id },
      data: {
        paymentStatus: "EXPIRED",
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "Payment not completed within 24 hours",
      },
    });
  }
  return stale.length;
}

async function maybeExpireOrder(prisma, order) {
  if (!order || order.paymentMethod !== "ONLINE" || order.paymentStatus !== "PENDING") return order;
  if (FINAL_STATUSES.includes(order.status)) return order;
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  if (ageMs >= PAYMENT_WINDOW_HOURS * 60 * 60 * 1000) {
    return prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "EXPIRED",
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "Payment not completed within 24 hours",
      },
    });
  }
  return order;
}

module.exports = { PAYMENT_WINDOW_HOURS, expireUnpaidOrders, maybeExpireOrder };
