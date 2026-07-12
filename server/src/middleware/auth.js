import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV !== "test") {
  console.warn("[auth] WARNING: JWT_SECRET is not set. Set it in .env before any real deployment.");
}

export function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, role: admin.role },
    JWT_SECRET || "dev-only-insecure-secret",
    { expiresIn: "15m" } // matches the 15-minute auto-logout requirement
  );
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing admin token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET || "dev-only-insecure-secret");
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired admin session" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
