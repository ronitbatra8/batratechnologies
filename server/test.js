const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.user.findMany({ take: 1 }).then(r => { console.log(JSON.stringify(r)); p.$disconnect(); }).catch(e => { console.log("ERROR:", e.message); p.$disconnect(); });
