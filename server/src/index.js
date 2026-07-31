require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const prisma = require("./prisma");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const addressRoutes = require("./routes/addresses");
const otpRoutes = require("./routes/otp");
const analyticsRoutes = require("./routes/analytics");
const reviewRoutes = require("./routes/reviews");
const wishlistRoutes = require("./routes/wishlist");
const newsletterRoutes = require("./routes/newsletter");
const messageRoutes = require("./routes/messages");
const deliveryRoutes = require("./routes/delivery");
const sellerRoutes = require("./routes/seller");
const cartRoutes = require("./routes/cart");
const { createRateLimiter } = require("./utils/rateLimit");
const { sendAbandonedCartEmail } = require("./utils/email");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://batratechnologies.netlify.app",
  "https://batratechnologies.vercel.app",
  process.env.PRODUCTION_URL,
  process.env.TUNNEL_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".netlify.app")) return cb(null, true);
    return cb(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

const authLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20 });
const strictAuthLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30 });
const adminLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
const globalLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 600 });

app.use("/api/auth/login", strictAuthLimiter);
app.use("/api/auth/forgot-password", strictAuthLimiter);
app.use("/api/auth/send-otp", authLimiter);
app.use("/api/auth/resend-otp", authLimiter);
app.use("/api/auth/verify-otp", authLimiter);
app.use("/api/auth/verify-reset-code", authLimiter);
app.use("/api/auth/reset-password", strictAuthLimiter);
app.use("/api/admin", adminLimiter);
app.use("/api", globalLimiter);

if (isProduction) {
  const outDir = path.join(__dirname, "../../out");
  app.use(express.static(outDir, { index: false }));
}

app.use("/api/auth", authRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/cart", cartRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

if (isProduction) {
  const outDir = path.join(__dirname, "../../out");
  app.get("*", (req, res) => {
    res.sendFile(path.join(outDir, "index.html"));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
}

app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "Origin not allowed by CORS" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: isProduction ? "An internal error occurred" : (err.message || "An internal error occurred") });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (env: ${process.env.NODE_ENV || "unset"})`);
});

setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const carts = await prisma.cart.findMany({
      where: { updatedAt: { lt: cutoff } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    for (const cart of carts) {
      if (!cart.user.email || !Array.isArray(cart.items) || cart.items.length === 0) continue;
      sendAbandonedCartEmail(cart.user.email, cart.user.name || "Customer", cart.items).catch(() => {});
    }
    if (carts.length > 0) console.log(`Abandoned cart reminders sent: ${carts.length}`);
  } catch {}
}, 60 * 60 * 1000);

function shutdown() {
  console.log("\nShutting down...");
  server.close(() => {
    prisma.$disconnect().then(() => process.exit(0)).catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
