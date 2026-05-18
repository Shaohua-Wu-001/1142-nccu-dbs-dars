const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  student_number: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: false },
  admission_year: { type: DataTypes.INTEGER, allowNull: false },
  username: { type: DataTypes.STRING(50), allowNull: true },
  password_hash: { type: DataTypes.STRING(60), allowNull: true },
  role: { type: DataTypes.ENUM("student", "admin"), allowNull: false, defaultValue: "student" }
}, {
  tableName: "users",
  indexes: [
    { name: "uniq_users_student_number", unique: true, fields: ["student_number"] },
    { name: "uniq_users_email", unique: true, fields: ["email"] },
    { name: "uniq_users_username", unique: true, fields: ["username"] }
  ]
});

module.exports = User;
