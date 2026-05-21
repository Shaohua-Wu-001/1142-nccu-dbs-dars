const { normalizeCourseCode } = require("../../utils/normalizeCourse");
const {
  GENERAL_BUCKETS,
  GENERAL_TOTAL_CREDIT_CAP,
  GENERAL_TOTAL_REQUIRED_CREDITS
} = require("./auditPolicy");
const { toNumber } = require("./auditShared");

const CORE_ELIGIBLE_BUCKETS = new Set(["HUMANITIES", "SOCIAL", "NATURAL"]);
const MAX_GENERAL_ASSIGNMENT_BRANCHES = 200000;

function buildGeneralCourseMap(generalCourses) {
  const map = new Map();
  for (const course of generalCourses) {
    map.set(normalizeCourseCode(course.course_code), course);
  }
  return map;
}

function bucketsFromText(text) {
  const buckets = [];
  if (/中文|中國語文/.test(text)) buckets.push("CHINESE");
  if (/外文|外國語文|大學英文|選修英文|英文|ETP/i.test(text)) buckets.push("FOREIGN");
  if (/人文/.test(text)) buckets.push("HUMANITIES");
  if (/社會/.test(text)) buckets.push("SOCIAL");
  if (/自然/.test(text)) buckets.push("NATURAL");
  if (/資訊/.test(text)) buckets.push("INFO");
  if (/書院/.test(text)) buckets.push("COLLEGE");
  return [...new Set(buckets)];
}

function classifyGeneralCourse(studentCourse, generalCourseMap) {
  const code = normalizeCourseCode(studentCourse.course_code);
  const catalogCourse = generalCourseMap.get(code);
  const remark = String(studentCourse.remark || "");
  const manualCategory = String(studentCourse.course_category || "");
  // For manual courses: prefer course_category over remark for classification
  const sourceCategory = String(catalogCourse?.category || manualCategory || remark || "");
  const categoryBuckets = bucketsFromText(sourceCategory);
  const buckets = [...new Set(categoryBuckets)];

  if (!catalogCourse && categoryBuckets.length === 0) {
    return null;
  }

  return {
    code,
    course: studentCourse,
    courseName: studentCourse.course_name,
    credits: toNumber(studentCourse.credits),
    category: sourceCategory || "通識",
    buckets,
    isCore: catalogCourse?.is_core === true || catalogCourse?.is_core === 1 || catalogCourse?.is_core === "1" || /核心/.test(sourceCategory)
  };
}

function chooseCrossBucket(availableBuckets, bucketState) {
  const eligible = availableBuckets.filter((bucket) => GENERAL_BUCKETS[bucket]);
  const belowMinimum = eligible
    .filter((bucket) => bucketState[bucket].counted < GENERAL_BUCKETS[bucket].min)
    .sort((a, b) => {
      const missingA = GENERAL_BUCKETS[a].min - bucketState[a].counted;
      const missingB = GENERAL_BUCKETS[b].min - bucketState[b].counted;
      return missingB - missingA;
    });
  if (belowMinimum.length > 0) return belowMinimum[0];

  const belowMaximum = eligible
    .filter((bucket) => bucketState[bucket].counted < GENERAL_BUCKETS[bucket].max)
    .sort((a, b) => {
      const roomA = GENERAL_BUCKETS[a].max - bucketState[a].counted;
      const roomB = GENERAL_BUCKETS[b].max - bucketState[b].counted;
      return roomB - roomA;
    });
  return belowMaximum[0] || null;
}

function createGeneralBucketState() {
  return Object.fromEntries(
    Object.entries(GENERAL_BUCKETS).map(([code]) => [code, {
      code,
      label: GENERAL_BUCKETS[code].label,
      minCredits: GENERAL_BUCKETS[code].min,
      maxCredits: GENERAL_BUCKETS[code].max,
      rawCredits: 0,
      counted: 0,
      excessCredits: 0,
      courses: []
    }])
  );
}

function evaluateGeneralAssignment(candidates, assignment) {
  const bucketState = createGeneralBucketState();
  const countedCourses = [];
  const uncountedCourses = [];
  const coreCourses = [];

  candidates.forEach((item, index) => {
    const bucket = assignment[index];
    if (!bucket || !bucketState[bucket]) {
      uncountedCourses.push({
        courseCode: item.code,
        courseName: item.courseName,
        credits: item.credits,
        category: item.category,
        reason: "無法對應到本系統支援的通識領域"
      });
      return;
    }

    const state = bucketState[bucket];
    const maxCredits = GENERAL_BUCKETS[bucket].max;
    const availableCredits = Math.max(maxCredits - state.counted, 0);
    const countedCredits = Math.min(item.credits, availableCredits);
    const excessCredits = Math.max(item.credits - countedCredits, 0);

    state.rawCredits += item.credits;
    state.counted += countedCredits;
    state.excessCredits += excessCredits;
    const coursePayload = {
      courseCode: item.code,
      courseName: item.courseName,
      credits: item.credits,
      countedCredits,
      excessCredits,
      category: item.category,
      assignedBucket: bucket,
      isCore: item.isCore
    };
    state.courses.push(coursePayload);

    if (countedCredits > 0) countedCourses.push(coursePayload);
    if (excessCredits > 0) {
      uncountedCourses.push({
        ...coursePayload,
        reason: `${GENERAL_BUCKETS[bucket].label}超修學分不得採計為畢業學分`
      });
    }

    if (item.isCore && countedCredits > 0 && CORE_ELIGIBLE_BUCKETS.has(bucket)) {
      coreCourses.push({
        courseCode: item.code,
        courseName: item.courseName,
        assignedBucket: bucket,
        bucketName: GENERAL_BUCKETS[bucket].label
      });
    }
  });

  const rawCredits = candidates.reduce((sum, item) => sum + item.credits, 0);
  const bucketCappedCredits = Object.values(bucketState).reduce((sum, state) => sum + state.counted, 0);
  const countedCredits = Math.min(bucketCappedCredits, GENERAL_TOTAL_CREDIT_CAP);
  const totalCapExcessCredits = Math.max(bucketCappedCredits - GENERAL_TOTAL_CREDIT_CAP, 0);
  const missingCredits = Math.max(GENERAL_TOTAL_REQUIRED_CREDITS - countedCredits, 0);

  const bucketRequirements = Object.values(bucketState).map((state) => {
    const complete = state.counted >= state.minCredits;
    return {
      bucketCode: state.code,
      bucketName: state.label,
      status: complete ? "COMPLETE" : "INCOMPLETE",
      rawCredits: state.rawCredits,
      earnedCredits: state.counted,
      minCredits: state.minCredits,
      maxCredits: state.maxCredits,
      missingCredits: Math.max(state.minCredits - state.counted, 0),
      excessCredits: state.excessCredits,
      courses: state.courses
    };
  });

  const incompleteBuckets = bucketRequirements.filter((bucket) => bucket.status !== "COMPLETE");
  const coreDomains = new Set(coreCourses.map((course) => course.assignedBucket));
  const coreCourseCodes = new Set(coreCourses.map((course) => course.courseCode));
  const coreDomainNames = [...coreDomains].map((bucket) => GENERAL_BUCKETS[bucket].label);
  const coreComplete = coreDomains.size >= 2 && coreCourseCodes.size >= 2;

  return {
    groupCode: "GENERAL",
    groupName: "通識",
    status: missingCredits === 0 && incompleteBuckets.length === 0 && coreComplete ? "COMPLETE" : "INCOMPLETE",
    rawCredits,
    earnedCredits: countedCredits,
    requiredCredits: GENERAL_TOTAL_REQUIRED_CREDITS,
    creditCap: GENERAL_TOTAL_CREDIT_CAP,
    missingCredits,
    excessCredits: Math.max(rawCredits - countedCredits, 0),
    totalCapExcessCredits,
    earnedCourses: candidates.length,
    requiredCourses: null,
    missingCourses: [],
    courses: countedCourses,
    uncountedCourses,
    requirements: bucketRequirements,
    coreRequirement: {
      status: coreComplete ? "COMPLETE" : "INCOMPLETE",
      requiredDistinctDomains: 2,
      earnedDistinctDomains: coreDomains.size,
      earnedDistinctCourses: coreCourseCodes.size,
      earnedDomains: coreDomainNames,
      courses: coreCourses,
      missingDistinctDomains: Math.max(2 - coreDomains.size, 0),
      description: "人文學、社會科學、自然科學領域中，至少修讀 2 門不同領域核心課程。"
    },
    notes: [
      "資訊通識一般為 2-3 學分；應用數學系沒有資訊通識最低限制，但仍可採計最多 3 學分並須補足通識總 28 學分。",
      "通識總採計上限為 28 學分；各領域超修與總通識超修不得採計為畢業學分。"
    ]
  };
}

function scoreGeneralAssignment(result) {
  const bucketMissingCredits = result.requirements.reduce((sum, bucket) => sum + bucket.missingCredits, 0);
  const incompleteBuckets = result.requirements.filter((bucket) => bucket.status !== "COMPLETE").length;
  const coreMissingDomains = result.coreRequirement.missingDistinctDomains;
  const coreMissingCourses = Math.max(2 - result.coreRequirement.earnedDistinctCourses, 0);
  return {
    complete: result.status === "COMPLETE" ? 1 : 0,
    bucketMissingCredits,
    incompleteBuckets,
    coreMissingDomains,
    coreMissingCourses,
    earnedCredits: result.earnedCredits,
    excessCredits: result.excessCredits
  };
}

function isBetterGeneralAssignment(candidate, current) {
  if (!current) return true;
  const a = scoreGeneralAssignment(candidate);
  const b = scoreGeneralAssignment(current);
  if (a.complete !== b.complete) return a.complete > b.complete;
  if (a.bucketMissingCredits !== b.bucketMissingCredits) return a.bucketMissingCredits < b.bucketMissingCredits;
  if (a.incompleteBuckets !== b.incompleteBuckets) return a.incompleteBuckets < b.incompleteBuckets;
  if (a.coreMissingDomains !== b.coreMissingDomains) return a.coreMissingDomains < b.coreMissingDomains;
  if (a.coreMissingCourses !== b.coreMissingCourses) return a.coreMissingCourses < b.coreMissingCourses;
  if (a.earnedCredits !== b.earnedCredits) return a.earnedCredits > b.earnedCredits;
  return a.excessCredits < b.excessCredits;
}

function countGeneralAssignmentBranches(candidates) {
  return candidates.reduce((product, item) => product * Math.max(item.buckets.length, 1), 1);
}

function greedyGeneralAssignment(candidates) {
  const bucketState = createGeneralBucketState();
  return candidates.map((item) => {
    const bucket = item.buckets.length === 1
      ? item.buckets[0]
      : chooseCrossBucket(item.buckets, bucketState);
    if (bucket && bucketState[bucket]) {
      const state = bucketState[bucket];
      const countedCredits = Math.min(item.credits, Math.max(GENERAL_BUCKETS[bucket].max - state.counted, 0));
      state.counted += countedCredits;
    }
    return bucket || null;
  });
}

function optimizeGeneralAssignment(candidates) {
  if (candidates.length === 0) return evaluateGeneralAssignment([], []);

  const branchCount = countGeneralAssignmentBranches(candidates);
  if (branchCount > MAX_GENERAL_ASSIGNMENT_BRANCHES) {
    const fallback = evaluateGeneralAssignment(candidates, greedyGeneralAssignment(candidates));
    fallback.notes.push(`跨領域通識組合數 ${branchCount} 過高，系統使用啟發式配置。`);
    return fallback;
  }

  let best = null;
  const assignment = [];

  function search(index) {
    if (index === candidates.length) {
      const result = evaluateGeneralAssignment(candidates, assignment);
      if (isBetterGeneralAssignment(result, best)) best = result;
      return;
    }

    const buckets = candidates[index].buckets.length > 0 ? candidates[index].buckets : [null];
    for (const bucket of buckets) {
      assignment[index] = bucket;
      search(index + 1);
    }
  }

  search(0);
  return best;
}

function analyzeGeneralCourses(studentCourses, generalCourses) {
  const generalCourseMap = buildGeneralCourseMap(generalCourses);
  const candidates = studentCourses
    .map((course) => classifyGeneralCourse(course, generalCourseMap))
    .filter(Boolean);

  return optimizeGeneralAssignment(candidates);
}

module.exports = {
  analyzeGeneralCourses,
  classifyGeneralCourse
};
