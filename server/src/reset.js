const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("=== Resetting database ===");

  // Delete in dependency order
  console.log("Deleting password resets...");
  await prisma.passwordReset.deleteMany();
  console.log("Deleting messages...");
  await prisma.message.deleteMany();
  console.log("Deleting wishlists...");
  await prisma.wishlist.deleteMany();
  console.log("Deleting reviews...");
  await prisma.review.deleteMany();
  console.log("Deleting saved addresses...");
  await prisma.savedAddress.deleteMany();
  console.log("Deleting orders...");
  await prisma.order.deleteMany();
  console.log("Deleting visits...");
  await prisma.visit.deleteMany();
  console.log("Deleting OTPs...");
  await prisma.otp.deleteMany();
  console.log("Deleting newsletter subscribers...");
  await prisma.newsletter.deleteMany();
  console.log("Deleting all users...");
  await prisma.user.deleteMany();
  console.log("Deleting all products...");
  await prisma.product.deleteMany();

  // Create owner account
  const hashedPassword = await bcrypt.hash("owner_ronit_123", 10);
  const owner = await prisma.user.create({
    data: {
      name: "Ronit Batra",
      email: "batra.ronit.08.11@gmail.com",
      phone: "9351396757",
      password: hashedPassword,
      role: "ADMIN",
      approved: true,
    },
  });
  console.log(`Owner created: ${owner.email} (role: ${owner.role})`);

  // Reseed products
  const products = require("../products.json");
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice || null,
        description: p.description,
        features: p.features,
        specifications: p.specifications,
        images: p.images,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        badge: p.badge || null,
      },
    });
  }
  console.log(`Seeded ${products.length} products`);

  console.log("=== Reset complete ===");
}

main()
  .catch((e) => {
    console.error("Reset error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
