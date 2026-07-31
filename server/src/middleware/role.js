const prisma = require("../prisma");

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    prisma.user.findUnique({ where: { id: req.userId } }).then(user => {
      if (!user) return res.status(401).json({ error: "User not found" });
      if (!roles.includes(user.role)) return res.status(403).json({ error: "Insufficient permissions" });
      req.user = user;
      next();
    }).catch(() => res.status(500).json({ error: "Server error" }));
  };
}

module.exports = { requireRole };
