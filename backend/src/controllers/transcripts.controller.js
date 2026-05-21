const { User } = require("../models");
const { importTranscript } = require("../importers/transcriptImport.service");
const { resolveTargetUserId, requireUserAccess } = require("../middleware/auth.middleware");

async function importTranscriptController(req, res) {
  const { transcript, sourceFilename } = req.body;
  const userId = resolveTargetUserId(req, req.body);
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!transcript) return res.status(400).json({ error: "transcript is required" });
  if (!requireUserAccess(req, res, userId)) return;

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const result = await importTranscript({
    userId,
    transcript,
    sourceFilename
  });
  res.status(201).json(result);
}

module.exports = {
  importTranscriptController
};
