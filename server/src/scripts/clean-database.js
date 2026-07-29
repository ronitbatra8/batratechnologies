const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const OWNER_EMAIL = "batra.ronit.08.11@gmail.com";

async function main() {
  console.log("Cleaning database — preserving owner account and products...\n");

  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    console.error("Owner account not found! Aborting.");
    process.exit(1);
  }
  console.log(`Owner preserved: ${owner.email} (${owner.id})`);

  const otherUsers = await prisma.user.findMany({ where: { email: { not: OWNER_EMAIL } } });
  const otherUserIds = otherUsers.map(u => u.id);
  console.log(`Found ${otherUsers.length} non-owner users to delete`);

  const results = {};

  results.reviews = await prisma.review.deleteMany({});
  results.wishlists = await prisma.wishlist.deleteMany({});
  results.messages = await prisma.message.deleteMany({});
  results.passwordResets = await prisma.passwordReset.deleteMany({});
  results.newsletter = await prisma.newsletter.deleteMany({});
  results.orders = await prisma.order.deleteMany({});
  results.visits = await prisma.visit.deleteMany({});
  results.otp = await prisma.otp.deleteMany({});

  results.addresses = await prisma.savedAddress.deleteMany({
    where: { userId: { not: OWNER_EMAIL } }
  });

  if (otherUserIds.length > 0) {
    results.users = await prisma.user.deleteMany({
      where: { id: { in: otherUserIds } }
    });
  }

  results.productReviews = await prisma.review.deleteMany({});
  results.productWishlists = await prisma.wishlist.deleteMany({});

  await prisma.product.updateMany({
    data: { rating: 0, reviewCount: 0 }
  });

  console.log("\nResults:");
  for (const [table, result] of Object.entries(results)) {
    console.log(`  ${table}: ${result.count} rows deleted`);
  }
  console.log("\nDone. Owner account and all products preserved.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
