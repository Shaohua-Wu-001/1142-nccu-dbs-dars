const { User, TranscriptImport } = require("../models");
const { countUnresolvedRowsByUser } = require("../services/studentCourses/unresolvedCourses.service");

async function listStudents(req, res) {
  const [students, imports] = await Promise.all([
    User.findAll({
      where: { role: "student" },
      attributes: ["id", "student_number", "name", "email", "admission_year", "created_at"],
      order: [["created_at", "DESC"]]
    }),
    TranscriptImport.findAll({
      attributes: ["user_id", "student_number", "student_name", "created_at"],
      order: [["created_at", "DESC"]]
    })
  ]);

  const latestByUser = new Map();
  for (const imp of imports) {
    if (!latestByUser.has(imp.user_id)) {
      latestByUser.set(imp.user_id, imp);
    }
  }

  const userIds = students.map((student) => student.id);
  if (userIds.length === 0) return res.json({ rows: [] });

  const unresolvedByUser = await countUnresolvedRowsByUser(userIds);

  const rows = students.map((user) => {
    const userId = user.id;
    const imp = latestByUser.get(userId);
    return {
      userId,
      studentNumber: imp?.student_number || user.student_number,
      studentName: imp?.student_name || user.name,
      email: user.email || null,
      admissionYear: user.admission_year || null,
      latestUploadAt: imp?.created_at || null,
      hasTranscript: Boolean(imp),
      unresolvedCount: unresolvedByUser.get(userId) || 0
    };
  });

  res.json({ rows });
}

module.exports = { listStudents };
