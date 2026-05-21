const express = require("express");
const { importTranscriptController } = require("../controllers/transcripts.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(requireAuth);

router.post("/import", asyncHandler(importTranscriptController));

module.exports = router;
