const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const {
  sequelize,
  AuditResult,
  StudentCourse,
  TranscriptImport,
  User
} = require("../models");
const { importTranscript } = require("../importers/transcriptImport.service");
const { resolveDataFile } = require("../utils/paths");

const DEMO_STUDENT_NUMBER = "DEMO001";
const K6_STUDENT_NUMBER = "K6DEMO001";

async function upsertUser({ studentNumber, name, email, admissionYear, username, password, role = "student" }) {
  const password_hash = password ? await bcrypt.hash(password, 10) : undefined;
  const [user] = await User.findOrCreate({
    where: { student_number: studentNumber },
    defaults: {
      name,
      email,
      username,
      password_hash,
      role,
      admission_year: admissionYear
    }
  });
  await user.update({
    name,
    email,
    username,
    ...(password_hash ? { password_hash } : {}),
    role,
    admission_year: admissionYear
  });
  return user;
}

async function clearUserData(userIds) {
  await AuditResult.destroy({ where: { user_id: userIds } });
  await TranscriptImport.destroy({ where: { user_id: userIds } });
  await StudentCourse.destroy({ where: { user_id: userIds } });
}

async function main() {
  const transcriptPath = process.argv[2] ? path.resolve(process.argv[2]) : resolveDataFile("transcript.json");
  await sequelize.authenticate();

  const demoUser = await upsertUser({
    studentNumber: DEMO_STUDENT_NUMBER,
    name: "示範使用者",
    email: "demo@nccu.edu.tw",
    username: "demo001",
    password: "demo1234",
    admissionYear: 111
  });
  const k6User = await upsertUser({
    studentNumber: K6_STUDENT_NUMBER,
    name: "K6 測試使用者",
    email: "k6-demo@nccu.edu.tw",
    username: "k6demo",
    password: "k6demo1234",
    admissionYear: 111
  });

  await clearUserData([demoUser.id, k6User.id]);

  const transcript = JSON.parse(fs.readFileSync(transcriptPath, "utf8"));
  const result = await importTranscript({
    userId: demoUser.id,
    transcript,
    sourceFilename: path.basename(transcriptPath)
  });

  console.log("Reset demo data:", {
    demoUserId: demoUser.id,
    k6UserId: k6User.id,
    importedTranscript: result
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
