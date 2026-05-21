const bcrypt = require("bcryptjs");
const { sequelize, User } = require("../models");

async function main() {
  await sequelize.authenticate();

  const studentHash = await bcrypt.hash("demo1234", 10);
  const [student] = await User.findOrCreate({
    where: { student_number: "DEMO001" },
    defaults: {
      name: "示範使用者",
      email: "demo@nccu.edu.tw",
      username: "demo001",
      admission_year: 111,
      password_hash: studentHash,
      role: "student"
    }
  });
  await student.update({ password_hash: studentHash, username: "demo001", role: "student" });
  console.log("Demo student:", {
    id: student.id,
    student_number: student.student_number,
    username: student.username,
    role: student.role
  });

  const adminHash = await bcrypt.hash("admin1234", 10);
  const [admin] = await User.findOrCreate({
    where: { student_number: "ADMIN-DEMO" },
    defaults: {
      name: "管理員",
      email: "admin@nccu.edu.tw",
      username: "admin",
      admission_year: 111,
      password_hash: adminHash,
      role: "admin"
    }
  });
  await admin.update({ password_hash: adminHash, username: "admin", role: "admin" });
  console.log("Demo admin:", {
    id: admin.id,
    student_number: admin.student_number,
    username: admin.username,
    role: admin.role
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
