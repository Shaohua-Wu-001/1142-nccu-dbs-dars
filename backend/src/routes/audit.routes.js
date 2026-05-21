const express = require("express");
const {
  runAuditController,
  listAuditHistory,
  getLatestAuditResult,
  getAuditHistory,
  updateAuditHistory,
  deleteAuditHistory
} = require("../controllers/audit.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(requireAuth);

router.post("/run", asyncHandler(runAuditController));
router.get("/latest", asyncHandler(getLatestAuditResult));
router.get("/history", asyncHandler(listAuditHistory));
router.get("/history/:id", asyncHandler(getAuditHistory));
router.patch("/history/:id", asyncHandler(updateAuditHistory));
router.delete("/history/:id", asyncHandler(deleteAuditHistory));

module.exports = router;
