const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, registerAdmin, login, me, updateProfile, changePassword, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "嘗試次數過多，請 15 分鐘後再試" }
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "寄信次數過多，請 1 小時後再試" }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "註冊次數過多，請 1 小時後再試" }
});

router.post("/register", registerLimiter, asyncHandler(register));
router.post("/register-admin", registerLimiter, asyncHandler(registerAdmin));
router.post("/login", loginLimiter, asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
router.patch("/profile", requireAuth, asyncHandler(updateProfile));
router.patch("/password", requireAuth, asyncHandler(changePassword));
router.post("/forgot-password", forgotLimiter, asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));

module.exports = router;
