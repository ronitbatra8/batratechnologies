const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const u = await p.user.findUnique({ where: { email: "batra.ronit.08.11@gmail.com" } });
  if (u) { await p.user.update({ where: { id: u.id }, data: { role: "ADMIN", approved: true } }); console.log("Owner set to ADMIN"); }
  else { console.log("Owner not found"); }
  await p.$disconnect();
})();
