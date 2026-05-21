const { Op } = require("sequelize");
const { StudentCourse } = require("../../models");

function unresolvedCategoryWhere(userIdOrIds) {
  return {
    user_id: Array.isArray(userIdOrIds) ? { [Op.in]: userIdOrIds } : userIdOrIds,
    source: "TRANSCRIPT_JSON",
    [Op.or]: [{ course_category: null }, { course_category: "" }]
  };
}

function approvedManualWhere(userIdOrIds) {
  return {
    user_id: Array.isArray(userIdOrIds) ? { [Op.in]: userIdOrIds } : userIdOrIds,
    source: "MANUAL",
    approval_status: "APPROVED",
    [Op.and]: [
      { course_category: { [Op.ne]: null } },
      { course_category: { [Op.ne]: "" } }
    ]
  };
}

function resolvedKey(row) {
  return `${row.user_id}:${row.course_code}`;
}

async function listUnresolvedRows(userId) {
  const [candidates, approvedManualRows] = await Promise.all([
    StudentCourse.findAll({
      where: unresolvedCategoryWhere(userId),
      order: [["academic_year_semester", "ASC"], ["course_code", "ASC"]]
    }),
    StudentCourse.findAll({
      where: approvedManualWhere(userId),
      attributes: ["user_id", "course_code"]
    })
  ]);

  const resolvedKeys = new Set(approvedManualRows.map(resolvedKey));
  return candidates.filter((row) => !resolvedKeys.has(resolvedKey(row)));
}

async function countUnresolvedRowsByUser(userIds) {
  if (userIds.length === 0) return new Map();

  const [candidates, approvedManualRows] = await Promise.all([
    StudentCourse.findAll({
      where: unresolvedCategoryWhere(userIds),
      attributes: ["user_id", "course_code"]
    }),
    StudentCourse.findAll({
      where: approvedManualWhere(userIds),
      attributes: ["user_id", "course_code"]
    })
  ]);

  const resolvedKeys = new Set(approvedManualRows.map(resolvedKey));
  const counts = new Map();
  for (const row of candidates) {
    if (resolvedKeys.has(resolvedKey(row))) continue;
    counts.set(row.user_id, (counts.get(row.user_id) || 0) + 1);
  }
  return counts;
}

module.exports = {
  countUnresolvedRowsByUser,
  listUnresolvedRows
};
