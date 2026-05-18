const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "nccu-ams-dev-secret";
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

module.exports = { register, login, me };
