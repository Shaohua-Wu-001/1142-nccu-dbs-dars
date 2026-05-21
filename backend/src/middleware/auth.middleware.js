const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { JWT_SECRET } = require("../config/secrets");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "student_number", "username", "name", "email", "admission_year", "role"]
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = user.get({ plain: true });
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function canAccessUser(req, userId) {
  const targetUserId = Number(userId);
  if (!Number.isFinite(targetUserId) || targetUserId <= 0) return false;
  return req.user?.role === "admin" || Number(req.user?.id) === targetUserId;
}

function resolveTargetUserId(req, source = {}) {
  const requestedUserId = Number(source.userId ?? source.user_id);
  if (req.user?.role === "admin") return requestedUserId;
  return Number(req.user?.id);
}

function requireUserAccess(req, res, userId) {
  if (!canAccessUser(req, userId)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

module.exports = {
  requireAuth,
  requireAdmin,
  canAccessUser,
  resolveTargetUserId,
  requireUserAccess
};
