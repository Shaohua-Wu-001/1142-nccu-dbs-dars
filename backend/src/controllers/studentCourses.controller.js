const { StudentCourse, User } = require("../models");
const {
  buildStudentCoursePayload,
  validateStudentCoursePayload
} = require("../services/studentCourses/studentCoursePayload.service");
const { listUnresolvedRows } = require("../services/studentCourses/unresolvedCourses.service");
const { resolveTargetUserId, requireUserAccess } = require("../middleware/auth.middleware");

async function listStudentCourses(req, res) {
  const userId = resolveTargetUserId(req, req.query);
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!requireUserAccess(req, res, userId)) return;

  const rows = await StudentCourse.findAll({
    where: { user_id: userId },
    order: [["academic_year_semester", "ASC"], ["course_code", "ASC"]]
  });
  res.json(rows);
}

async function listUnresolvedStudentCourses(req, res) {
  const userId = resolveTargetUserId(req, req.query);
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!requireUserAccess(req, res, userId)) return;

  const rows = await listUnresolvedRows(userId);

  res.json({
    count: rows.length,
    rows,
    note: "These transcript rows do not have course category data from backend/data/courses.xlsx. Staff should review them before official use."
  });
}

async function createStudentCourse(req, res) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  const userId = resolveTargetUserId(req, req.body);
  if (!requireUserAccess(req, res, userId)) return;
  const payload = buildStudentCoursePayload({ ...req.body, userId });
  const error = validateStudentCoursePayload(payload);
  if (error) return res.status(400).json({ error });

  const user = await User.findByPk(payload.user_id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const row = await StudentCourse.create(payload);
  res.status(201).json(row);
}

async function deleteStudentCourse(req, res) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  const row = await StudentCourse.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: "Student course not found" });
  if (!requireUserAccess(req, res, row.user_id)) return;

  const deleted = await StudentCourse.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ error: "Student course not found" });
  res.status(204).send();
}

module.exports = {
  listStudentCourses,
  listUnresolvedStudentCourses,
  createStudentCourse,
  deleteStudentCourse
};
