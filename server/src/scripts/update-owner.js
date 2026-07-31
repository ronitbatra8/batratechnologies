require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const ownerPassword = process.env.OWNER_PASSWORD;
  if (!ownerPassword) {
    console.error("OWNER_PASSWORD is not set in server/.env");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email: "batraronit32@gmail.com" } });
  if (!user) {
    console.log("Old owner not found — checking new email");
    const u2 = await prisma.user.findUnique({ where: { email: "batra.ronit.08.11@gmail.com" } });
    if (u2) { console.log("Already updated"); return; }
    console.log("No owner found at all");
    return;
  }
  const hash = await bcrypt.hash(ownerPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { email: "batra.ronit.08.11@gmail.com", password: hash } });
  console.log("Owner updated: email -> batra.ronit.08.11@gmail.com");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
