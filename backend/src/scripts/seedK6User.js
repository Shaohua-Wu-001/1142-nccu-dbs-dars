const bcrypt = require("bcryptjs");
const { sequelize, User } = require("../models");

async function main() {
  await sequelize.authenticate();
  const password_hash = await bcrypt.hash("k6demo1234", 10);
  const [user] = await User.findOrCreate({
    where: { student_number: "K6DEMO001" },
    defaults: {
      name: "K6 測試使用者",
      email: "k6-demo@nccu.edu.tw",
      username: "k6demo",
      password_hash,
      role: "student",
      admission_year: 111
    }
  });
  await user.update({
    name: "K6 測試使用者",
    email: "k6-demo@nccu.edu.tw",
    username: "k6demo",
    password_hash,
    role: "student",
    admission_year: 111
  });
  console.log("K6 user:", {
    id: user.id,
    student_number: user.student_number,
    username: user.username,
    role: user.role
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
