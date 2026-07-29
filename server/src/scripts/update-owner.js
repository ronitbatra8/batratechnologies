const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "batraronit32@gmail.com" } });
  if (!user) { console.log("Old owner not found — checking new email"); const u2 = await prisma.user.findUnique({ where: { email: "batra.ronit.08.11@gmail.com" } }); if (u2) { console.log("Already updated"); return; } console.log("No owner found at all"); return; }
  const hash = await bcrypt.hash("owner_ronit_123", 10);
  await prisma.user.update({ where: { id: user.id }, data: { email: "batra.ronit.08.11@gmail.com", password: hash } });
  console.log("Owner updated: email -> batra.ronit.08.11@gmail.com, password -> owner_ronit_123");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
