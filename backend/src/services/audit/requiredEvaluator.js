const { normalizeCourseCode } = require("../../utils/normalizeCourse");
const { REQUIRED_TOTAL_CREDITS } = require("./auditPolicy");
const { toNumber } = require("./auditShared");

function acceptedCodesForRule(rule) {
  const metadata = rule.metadata_json || {};
  if (Array.isArray(metadata.acceptedCourseCodes)) {
    return metadata.acceptedCourseCodes.map(normalizeCourseCode);
  }
  return rule.course_code ? [normalizeCourseCode(rule.course_code)] : [];
}

function allAcceptedRequiredCodes(rules) {
  const codes = new Set();
  for (const rule of rules) {
    for (const code of acceptedCodesForRule(rule)) codes.add(code);
  }
  return codes;
}

function isAppliedMathCourseCode(courseCode) {
  const code = normalizeCourseCode(courseCode);
  return code.startsWith("701") || code.startsWith("751");
}

function isApprovedSubstitutionForRule(studentCourse, rule, acceptedCodes) {
  if (studentCourse.approval_status !== "APPROVED") return false;
  const substitutionCode = normalizeCourseCode(studentCourse.substitution_for_course_code);
  const substitutionName = String(studentCourse.substitution_for_course_name || "").trim();
  return (substitutionCode && acceptedCodes.includes(substitutionCode))
    || (substitutionName && substitutionName === String(rule.course_name || "").replace(/（.*）$/, ""));
}

function isDirectRequiredCourseAllowed(studentCourse) {
  if (studentCourse.approval_status === "APPROVED") return true;
  return isAppliedMathCourseCode(studentCourse.course_code);
}

function checkRequiredGroup(group, rules, courseMap) {
  const usedCourseCodes = new Set();
  const missingCourses = [];
  const completedRules = [];
  let earnedCredits = 0;
  const requiredCredits = toNumber(group.min_credits) || REQUIRED_TOTAL_CREDITS;
  const warnings = [];

  for (const rule of rules) {
    const acceptedCodes = acceptedCodesForRule(rule);
    const matchedCode = acceptedCodes.find((code) => {
      const course = courseMap.get(code);
      return course && isDirectRequiredCourseAllowed(course);
    });
    const substitutionCourse = matchedCode
      ? null
      : [...courseMap.values()].find((course) => isApprovedSubstitutionForRule(course, rule, acceptedCodes));
    const minCredits = toNumber(rule.min_credits);
    const creditCap = rule.credit_cap === null || rule.credit_cap === undefined ? null : toNumber(rule.credit_cap);

    if (matchedCode || substitutionCourse) {
      const studentCourse = matchedCode ? courseMap.get(matchedCode) : substitutionCourse;
      const matchedCourseCode = matchedCode || normalizeCourseCode(studentCourse.course_code);
      const rawCredits = toNumber(studentCourse.credits);
      const ruleCreditCap = creditCap === null ? minCredits : Math.min(creditCap, minCredits);
      const countedCredits = Math.min(rawCredits, ruleCreditCap);
      earnedCredits += countedCredits;
      usedCourseCodes.add(matchedCourseCode);
      completedRules.push({
        ruleKey: rule.rule_key,
        courseName: rule.course_name,
        matchedCourseCode,
        matchedCourseName: studentCourse.course_name,
        department: studentCourse.department || null,
        recognitionType: studentCourse.recognition_type || "ORIGINAL",
        approvalStatus: studentCourse.approval_status || "NOT_REQUIRED",
        substitutedForCourseCode: studentCourse.substitution_for_course_code || null,
        countedCredits,
        rawCredits
      });
      if (rawCredits > ruleCreditCap) {
        warnings.push(`${rule.course_name} 修課學分 ${rawCredits} 高於規則採計 ${ruleCreditCap}，系必修採計以 ${ruleCreditCap} 學分為上限。`);
      }
    } else {
      missingCourses.push({
        courseName: rule.course_name,
        acceptedCourseCodes: acceptedCodes,
        requiredCredits: minCredits
      });
    }
  }

  const missingCredits = Math.max(requiredCredits - earnedCredits, 0);
  return {
    groupCode: group.group_code,
    groupName: group.group_name,
    status: missingCourses.length === 0 && missingCredits === 0 ? "COMPLETE" : "INCOMPLETE",
    earnedCredits,
    requiredCredits,
    missingCredits,
    missingCourses,
    completedRules,
    usedCourseCodes,
    warnings
  };
}

module.exports = {
  allAcceptedRequiredCodes,
  checkRequiredGroup
};
