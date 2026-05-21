const { normalizeCourseCode } = require("../../utils/normalizeCourse");
const {
  GENERAL_TOTAL_REQUIRED_CREDITS,
  OTHER_ELECTIVE_REQUIRED_CREDITS,
  PHYSICAL_REQUIRED_CREDITS,
  REQUIRED_TOTAL_CREDITS
} = require("./auditPolicy");
const { toNumber } = require("./auditShared");
const { allAcceptedRequiredCodes, checkRequiredGroup } = require("./requiredEvaluator");
const { analyzeGeneralCourses, classifyGeneralCourse } = require("./generalEducationEvaluator");
const { analyzePhysicalAndDefense, checkPhysicalEducationGroup } = require("./physicalEducationEvaluator");
const { checkOtherElectiveGroup } = require("./electiveEvaluator");

function uniquePassedCourses(studentCourses, includeInProgress = false) {
  const allowed = includeInProgress ? new Set(["PASSED", "IN_PROGRESS"]) : new Set(["PASSED"]);
  const byCode = new Map();

  for (const course of studentCourses) {
    if (!allowed.has(course.status)) continue;
    const code = normalizeCourseCode(course.course_code);
    if (!code) continue;

    const current = byCode.get(code);
    const candidateCredits = toNumber(course.credits);
    const currentCredits = current ? toNumber(current.credits) : -1;
    const candidateApproved = course.approval_status === "APPROVED";
    const currentApproved = current?.approval_status === "APPROVED";
    const approvedOverride = candidateApproved && !currentApproved;
    const higherCreditOverride = !currentApproved && candidateCredits > currentCredits;
    if (!current || approvedOverride || higherCreditOverride) {
      byCode.set(code, course);
    }
  }

  return byCode;
}

function buildAuditResult({ curriculum, requirementGroups, requirementRules, studentCourses, generalCourses = [], transcriptImport = null, includeInProgress = false, mode = "OFFICIAL" }) {
  const courseMap = uniquePassedCourses(studentCourses, includeInProgress);
  const passedCourses = [...courseMap.values()];
  const generalAnalysis = analyzeGeneralCourses(passedCourses, generalCourses);
  const physicalAndDefenseAnalysis = analyzePhysicalAndDefense(passedCourses);

  const calculatedTotalCredits = passedCourses.reduce((sum, course) => sum + toNumber(course.credits), 0);
  const officialTotalCredits = transcriptImport ? toNumber(transcriptImport.total_credits_reported) : 0;
  const totalRequiredCredits = toNumber(curriculum.total_required_credits);
  const groups = [];
  const warnings = ["本系統只檢核應數本系規則，不處理輔系或雙主修認定。"];
  if (includeInProgress) {
    warnings.push("此結果包含尚未取得成績的課程，只能作為預估，不代表正式畢業資格。");
  }

  const rulesByGroup = new Map();
  for (const rule of requirementRules) {
    if (!rulesByGroup.has(rule.requirement_group_id)) rulesByGroup.set(rule.requirement_group_id, []);
    rulesByGroup.get(rule.requirement_group_id).push(rule);
  }

  const sortedGroups = [...requirementGroups].sort((a, b) => a.display_order - b.display_order);
  const requiredGroup = sortedGroups.find((group) => group.group_code === "REQUIRED");
  const requiredRules = requiredGroup ? rulesByGroup.get(requiredGroup.id) || [] : [];
  const requiredResult = requiredGroup
    ? checkRequiredGroup(requiredGroup, requiredRules, courseMap)
    : null;
  const requiredCodes = allAcceptedRequiredCodes(requiredRules);
  const usedRequiredCodes = requiredResult?.usedCourseCodes || new Set();
  for (const code of usedRequiredCodes) requiredCodes.add(code);
  if (requiredResult) {
    requiredResult.warnings.forEach((warning) => warnings.push(warning));
    delete requiredResult.usedCourseCodes;
    delete requiredResult.warnings;
  }

  const physicalEducationGroup = sortedGroups.find((group) => group.group_code === "PE");
  const physicalEducationResult = physicalEducationGroup
    ? checkPhysicalEducationGroup(physicalEducationGroup, physicalAndDefenseAnalysis)
    : null;

  const electiveGroup = sortedGroups.find((group) => group.group_code === "ELECTIVE" || group.group_code === "MAJOR_ELECT");
  const electiveResult = electiveGroup
    ? checkOtherElectiveGroup(electiveGroup, passedCourses, requiredCodes, generalAnalysis, physicalAndDefenseAnalysis)
    : null;

  const categoryEarnedCredits = [
    requiredResult?.earnedCredits || 0,
    physicalEducationResult?.earnedCredits || 0,
    generalAnalysis.earnedCredits || 0,
    electiveResult?.earnedCredits || 0
  ].reduce((sum, value) => sum + value, 0);
  const totalEarnedCredits = Math.min(categoryEarnedCredits, totalRequiredCredits);

  for (const group of sortedGroups) {
    if (group.group_code === "TOTAL") {
      groups.push({
        groupCode: group.group_code,
        groupName: group.group_name,
        status: totalEarnedCredits >= totalRequiredCredits ? "COMPLETE" : "INCOMPLETE",
        earnedCredits: totalEarnedCredits,
        requiredCredits: totalRequiredCredits,
        missingCredits: Math.max(totalRequiredCredits - totalEarnedCredits, 0),
        missingCourses: []
      });
      continue;
    }

    if (group.group_code === "REQUIRED") {
      groups.push(requiredResult);
      continue;
    }

    if (group.group_code === "ELECTIVE" || group.group_code === "MAJOR_ELECT") {
      groups.push(electiveResult);
      continue;
    }

    if (group.group_code === "GENERAL") {
      groups.push(generalAnalysis);
      continue;
    }

    if (group.group_code === "PE") {
      groups.push(physicalEducationResult);
      continue;
    }

    groups.push({
      groupCode: group.group_code,
      groupName: group.group_name,
      status: "UNSUPPORTED",
      earnedCredits: 0,
      requiredCredits: toNumber(group.min_credits),
      missingCredits: toNumber(group.min_credits),
      missingCourses: [],
      warning: "此 requirement group 尚未實作 evaluator，不能視為完成。"
    });
  }

  const progressPercentage = totalRequiredCredits === 0
    ? 0
    : Math.min(100, Number(((totalEarnedCredits / totalRequiredCredits) * 100).toFixed(2)));
  const graduationEligible = groups.every((group) => group.status === "COMPLETE")
    && totalEarnedCredits >= totalRequiredCredits;

  if (officialTotalCredits > 0 && officialTotalCredits !== calculatedTotalCredits) {
    warnings.push(`Transcript 官方總學分為 ${officialTotalCredits}，學生已通過課程原始加總為 ${calculatedTotalCredits}；畢業採計仍依 51+4+28+45 分類上限計算。`);
  }
  if (calculatedTotalCredits > categoryEarnedCredits) {
    warnings.push(`依系必修、體育必修、通識與其他選修採計上限，${Number((calculatedTotalCredits - categoryEarnedCredits).toFixed(1))} 學分不得採計為畢業學分。`);
  }

  return {
    academicYear: String(curriculum.AcademicYear?.year_code || ""),
    programType: curriculum.program_type,
    department: curriculum.department,
    mode,
    isProjected: includeInProgress,
    progressPercentage,
    graduationEligible,
    totalCredits: {
      earned: totalEarnedCredits,
      required: totalRequiredCredits,
      missing: Math.max(totalRequiredCredits - totalEarnedCredits, 0),
      source: "CATEGORY_SUM_51_4_28_45",
      officialTranscriptCredits: officialTotalCredits || null,
      calculatedFromPassedCourses: calculatedTotalCredits,
      categoryEarnedCredits,
      excludedByRules: Math.max(calculatedTotalCredits - categoryEarnedCredits, 0),
      structure: {
        required: REQUIRED_TOTAL_CREDITS,
        physicalEducation: PHYSICAL_REQUIRED_CREDITS,
        generalEducation: GENERAL_TOTAL_REQUIRED_CREDITS,
        elective: OTHER_ELECTIVE_REQUIRED_CREDITS
      }
    },
    groups,
    warnings
  };
}

function runAudit({ curriculum, requirementGroups, requirementRules, studentCourses, generalCourses = [], transcriptImport = null, options = {} }) {
  const result = buildAuditResult({
    curriculum,
    requirementGroups,
    requirementRules,
    studentCourses,
    generalCourses,
    transcriptImport,
    includeInProgress: false,
    mode: "OFFICIAL"
  });

  if (options.includeInProgress === true) {
    result.projectedResult = buildAuditResult({
      curriculum,
      requirementGroups,
      requirementRules,
      studentCourses,
      generalCourses,
      transcriptImport,
      includeInProgress: true,
      mode: "PROJECTED"
    });
    result.warnings.push("已另外回傳 projectedResult；正式 graduationEligible 仍只依已通過課程計算。");
  }

  return result;
}

module.exports = {
  runAudit,
  uniquePassedCourses,
  checkRequiredGroup,
  classifyGeneralCourse,
  analyzeGeneralCourses,
  analyzePhysicalAndDefense,
  checkOtherElectiveGroup
};
