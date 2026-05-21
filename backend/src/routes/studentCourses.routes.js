const express = require("express");
const {
  listStudentCourses,
  listUnresolvedStudentCourses,
  createStudentCourse,
  deleteStudentCourse
} = require("../controllers/studentCourses.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(listStudentCourses));
router.get("/unresolved", asyncHandler(listUnresolvedStudentCourses));
router.post("/", asyncHandler(createStudentCourse));
router.delete("/:id", asyncHandler(deleteStudentCourse));

module.exports = router;
