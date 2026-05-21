const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");
const { sendPasswordResetEmail } = require("../utils/email");
const { ADMIN_SECRET, JWT_SECRET } = require("../config/secrets");

const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function userResponse(user) {
  return {
    id: user.id,
    student_number: user.student_number,
    username: user.username,
    name: user.name,
    email: user.email,
    admission_year: user.admission_year,
    role: user.role
  };
}

async function register(req, res) {
  const { student_number, username, name, email, password, admission_year } = req.body;

  if (!student_number || !username || !name || !email || !password || !admission_year) {
    return res.status(400).json({ error: "所有欄位皆為必填" });
  }
  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: "使用者名稱只能包含英文字母和數字" });
  }
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: "使用者名稱長度需在 3 到 50 個字元之間" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "密碼至少需要 6 個字元" });
  }

  const existing = await User.findOne({
    where: { [Op.or]: [{ email }, { username }, { student_number }] }
  });
  if (existing) {
    if (existing.email === email) return res.status(409).json({ error: "此 Email 已被註冊" });
    if (existing.username === username) return res.status(409).json({ error: "此使用者名稱已被使用" });
    return res.status(409).json({ error: "此學號已被註冊" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    student_number,
    username,
    name,
    email,
    admission_year: Number(admission_year),
    password_hash,
    role: "student"
  });

  const token = signToken(user);
  res.status(201).json({ token, user: userResponse(user) });
}

async function registerAdmin(req, res) {
  const { username, name, email, password, admin_secret } = req.body;

  if (!username || !name || !email || !password || !admin_secret) {
    return res.status(400).json({ error: "所有欄位皆為必填" });
  }
  if (admin_secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "管理員密鑰錯誤" });
  }
  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: "使用者名稱只能包含英文字母和數字" });
  }
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: "使用者名稱長度需在 3 到 50 個字元之間" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "密碼至少需要 6 個字元" });
  }

  const existing = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
  if (existing) {
    if (existing.email === email) return res.status(409).json({ error: "此 Email 已被註冊" });
    return res.status(409).json({ error: "此使用者名稱已被使用" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, name, email, password_hash, role: "admin" });

  const token = signToken(user);
  res.status(201).json({ token, user: userResponse(user) });
}

async function login(req, res) {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ error: "請輸入帳號和密碼" });
  }

  const isEmail = account.includes("@");
  const where = isEmail ? { email: account } : { username: account };

  const user = await User.findOne({ where });
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: "帳號或密碼錯誤" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "帳號或密碼錯誤" });
  }

  const token = signToken(user);
  res.json({ token, user: userResponse(user) });
}

async function me(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: userResponse(user) });
}

async function updateProfile(req, res) {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "姓名與 Email 為必填" });

  const existing = await User.findOne({ where: { email, id: { [Op.ne]: req.user.id } } });
  if (existing) return res.status(409).json({ error: "此 Email 已被其他帳號使用" });

  const user = await User.findByPk(req.user.id);
  await user.update({ name, email });
  res.json({ user: userResponse(user) });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "請填寫所有欄位" });
  if (newPassword.length < 6) return res.status(400).json({ error: "新密碼至少需要 6 個字元" });

  const user = await User.findByPk(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: "目前密碼錯誤" });

  const password_hash = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash });
  res.json({ message: "密碼已成功更新" });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "請輸入 Email" });

  const user = await User.findOne({ where: { email } });
  if (!user) return res.json({ message: "若此 Email 已註冊，重設連結已寄出" });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await user.update({ reset_token: token, reset_expires: expires });

  try {
    await sendPasswordResetEmail(email, token);
  } catch {
    await user.update({ reset_token: null, reset_expires: null });
    return res.status(500).json({ error: "寄信失敗，請稍後再試" });
  }

  res.json({ message: "若此 Email 已註冊，重設連結已寄出" });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "資料不完整" });
  if (password.length < 6) return res.status(400).json({ error: "密碼至少需要 6 個字元" });

  const user = await User.findOne({
    where: { reset_token: token, reset_expires: { [Op.gt]: new Date() } },
  });
  if (!user) return res.status(400).json({ error: "連結已失效或無效，請重新申請" });

  const password_hash = await bcrypt.hash(password, 10);
  await user.update({ password_hash, reset_token: null, reset_expires: null });

  res.json({ message: "密碼已成功重設，請重新登入" });
}

module.exports = { register, registerAdmin, login, me, updateProfile, changePassword, forgotPassword, resetPassword };
