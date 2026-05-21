const express = require("express");
const {
  createManualCourse,
  updateManualCourse,
  deleteManualCourse
} = require("../controllers/adminManualCourses.controller");
const { listStudents } = require("../controllers/adminStudents.controller");
const { requireAdmin, requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/students", asyncHandler(listStudents));
router.post("/manual-courses", asyncHandler(createManualCourse));
router.patch("/manual-courses/:id", asyncHandler(updateManualCourse));
router.delete("/manual-courses/:id", asyncHandler(deleteManualCourse));

module.exports = router;
