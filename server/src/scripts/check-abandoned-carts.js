const prisma = require("../prisma");
const { sendAbandonedCartEmail } = require("../utils/email");

const HOURS_BEFORE_REMINDER = 1;

async function main() {
  console.log(`[${new Date().toISOString()}] Checking abandoned carts...`);
  const cutoff = new Date(Date.now() - HOURS_BEFORE_REMINDER * 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: { updatedAt: { lt: cutoff } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  let sent = 0;
  for (const cart of carts) {
    if (!cart.user.email || !Array.isArray(cart.items) || cart.items.length === 0) continue;
    try {
      await sendAbandonedCartEmail(cart.user.email, cart.user.name || "Customer", cart.items);
      sent++;
      console.log(`  Reminder sent to ${cart.user.email}`);
    } catch (e) {
      console.error(`  Failed for ${cart.user.email}: ${e.message}`);
    }
  }
  console.log(`Done. Sent ${sent} reminders.`);
  await prisma.$disconnect();
}

main();
