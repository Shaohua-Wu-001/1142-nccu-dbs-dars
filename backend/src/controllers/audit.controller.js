const {
  AuditResult,
} = require("../models");
const { loadAuditContext } = require("../services/audit/auditContext.service");
const { runAudit } = require("../services/audit/auditEngine.service");
const { resolveTargetUserId, requireUserAccess } = require("../middleware/auth.middleware");

async function runAuditController(req, res) {
  const { academicYear, includeInProgress = false, saveResult = true } = req.body;
  const userId = resolveTargetUserId(req, req.body);
  const auditSource = req.user?.role === "admin" ? "ADMIN" : "STUDENT";
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!academicYear) return res.status(400).json({ error: "academicYear is required" });
  if (!requireUserAccess(req, res, userId)) return;

  const {
    curriculum,
    requirementGroups,
    requirementRules,
    studentCourses,
    generalCourses,
    transcriptImport
  } = await loadAuditContext({ userId, academicYear });

  const result = runAudit({
    curriculum,
    requirementGroups,
    requirementRules,
    studentCourses,
    generalCourses,
    transcriptImport,
    options: { includeInProgress }
  });

  if (saveResult === false) {
    return res.status(200).json({
      auditId: null,
      saved: false,
      ...result
    });
  }

  const auditResult = await AuditResult.create({
    user_id: userId,
    curriculum_id: curriculum.id,
    transcript_import_id: transcriptImport ? transcriptImport.id : null,
    total_credits_earned: result.totalCredits.earned,
    total_required_credits: result.totalCredits.required,
    progress_percentage: result.progressPercentage,
    audit_source: auditSource,
    result_json: result
  });

  res.status(201).json({
    auditId: auditResult.id,
    saved: true,
    ...result
  });
}

async function listAuditHistory(req, res) {
  const userId = resolveTargetUserId(req, req.query);
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!requireUserAccess(req, res, userId)) return;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;
  const where = { user_id: userId };
  if (req.user?.role !== "admin" || req.query.visibleToStudent === "true" || req.query.auditSource === "STUDENT") {
    where.audit_source = "STUDENT";
  }
  const { count, rows } = await AuditResult.findAndCountAll({
    where,
    attributes: { exclude: ["result_json"] },
    order: [["created_at", "DESC"]],
    limit,
    offset
  });
  res.json({ count, rows });
}

async function getLatestAuditResult(req, res) {
  const userId = resolveTargetUserId(req, req.query);
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!requireUserAccess(req, res, userId)) return;

  const row = await AuditResult.findOne({
    where: { user_id: userId },
    order: [["created_at", "DESC"], ["id", "DESC"]]
  });
  if (!row) return res.status(404).json({ error: "Audit result not found" });
  res.json(row);
}

async function getAuditHistory(req, res) {
  const row = await AuditResult.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: "Audit result not found" });
  if (!requireUserAccess(req, res, row.user_id)) return;
  if (req.user?.role !== "admin" && row.audit_source !== "STUDENT") {
    return res.status(404).json({ error: "Audit result not found" });
  }
  res.json(row);
}

async function updateAuditHistory(req, res) {
  const row = await AuditResult.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: "Audit result not found" });
  if (!requireUserAccess(req, res, row.user_id)) return;
  if (req.user?.role !== "admin" && row.audit_source !== "STUDENT") {
    return res.status(404).json({ error: "Audit result not found" });
  }

  const auditName = String(req.body.auditName ?? req.body.audit_name ?? "").trim();
  if (auditName.length > 120) {
    return res.status(400).json({ error: "審核紀錄名稱不可超過 120 個字元" });
  }

  await row.update({ audit_name: auditName || null });
  res.json(row);
}

async function deleteAuditHistory(req, res) {
  const row = await AuditResult.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: "Audit result not found" });
  if (!requireUserAccess(req, res, row.user_id)) return;
  if (req.user?.role !== "admin" && row.audit_source !== "STUDENT") {
    return res.status(404).json({ error: "Audit result not found" });
  }

  await row.destroy();
  res.status(204).send();
}

module.exports = {
  runAuditController,
  listAuditHistory,
  getLatestAuditResult,
  getAuditHistory,
  updateAuditHistory,
  deleteAuditHistory
};
