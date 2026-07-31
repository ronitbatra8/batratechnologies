function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits.entries()) {
      entry.times = entry.times.filter((t) => now - t < windowMs);
      if (entry.times.length === 0) hits.delete(ip);
    }
  }, 10 * 60 * 1000);
  timer.unref();

  return (req, res, next) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const entry = hits.get(ip) || { times: [] };
    entry.times = entry.times.filter((t) => now - t < windowMs);
    if (entry.times.length >= max) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    entry.times.push(now);
    hits.set(ip, entry);
    next();
  };
}

module.exports = { createRateLimiter };
