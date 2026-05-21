const test = require("node:test");
const assert = require("node:assert/strict");
const { runAudit } = require("../src/services/audit/auditEngine.service");

test("audit engine caps 113 linear algebra credits at 6 for required group", () => {
  const curriculum = {
    total_required_credits: 128,
    program_type: "MAJOR",
    department: "應用數學系",
    AcademicYear: { year_code: 113 }
  };
  const requirementGroups = [
    { id: 1, group_code: "TOTAL", group_name: "總畢業學分", display_order: 1 },
    { id: 2, group_code: "REQUIRED", group_name: "系必修", min_credits: 8, display_order: 2 }
  ];
  const requirementRules = [
    {
      id: 1,
      requirement_group_id: 2,
      rule_type: "ANY_OF",
      rule_key: "線性代數-FIRST",
      course_name: "線性代數（上學期）",
      min_credits: 3,
      credit_cap: 3,
      metadata_json: { acceptedCourseCodes: ["701002001", "701002011"] },
      display_order: 1
    },
    {
      id: 2,
      requirement_group_id: 2,
      rule_type: "ANY_OF",
      rule_key: "線性代數-SECOND",
      course_name: "線性代數（下學期）",
      min_credits: 3,
      credit_cap: 3,
      metadata_json: { acceptedCourseCodes: ["701002002", "701002012"] },
      display_order: 2
    },
    {
      id: 3,
      requirement_group_id: 2,
      rule_type: "COURSE_REQUIRED",
      rule_key: "數學導論-SINGLE",
      course_name: "數學導論",
      course_code: "701025001",
      min_credits: 2,
      metadata_json: { acceptedCourseCodes: ["701025001"] },
      display_order: 3
    }
  ];
  const studentCourses = [
    { course_code: "701002001", course_name: "線性代數", credits: 4, status: "PASSED" },
    { course_code: "701002002", course_name: "線性代數", credits: 4, status: "PASSED" },
    { course_code: "701025001", course_name: "數學導論", credits: 2, status: "PASSED" }
  ];

  const result = runAudit({
    curriculum,
    requirementGroups,
    requirementRules,
    studentCourses
  });

  const required = result.groups.find((group) => group.groupCode === "REQUIRED");
  assert.equal(required.earnedCredits, 8);
  assert.equal(required.status, "COMPLETE");
  assert.ok(result.warnings.some((warning) => warning.includes("系必修採計以 3 學分為上限")));
});

test("audit engine caps required courses by rule credits even without explicit credit cap", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "REQUIRED", group_name: "系必修", min_credits: 3, display_order: 1 }
    ],
    requirementRules: [
      {
        id: 1,
        requirement_group_id: 1,
        rule_type: "COURSE_REQUIRED",
        rule_key: "REQUIRED-A",
        course_name: "必修 A",
        course_code: "701999001",
        min_credits: 3,
        credit_cap: null,
        metadata_json: { acceptedCourseCodes: ["701999001"] },
        display_order: 1
      }
    ],
    studentCourses: [
      { course_code: "701999001", course_name: "必修 A", credits: 99, status: "PASSED" }
    ]
  });

  const required = result.groups.find((group) => group.groupCode === "REQUIRED");
  assert.equal(required.earnedCredits, 3);
  assert.equal(required.status, "COMPLETE");
  assert.ok(result.warnings.some((warning) => warning.includes("系必修採計以 3 學分為上限")));
});

test("audit engine accepts direct required courses by 701 or 751 course code prefix", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "REQUIRED", group_name: "系必修", min_credits: 3, display_order: 1 }
    ],
    requirementRules: [
      {
        id: 1,
        requirement_group_id: 1,
        rule_type: "COURSE_REQUIRED",
        rule_key: "REQUIRED-MATH",
        course_name: "應數課程",
        course_code: "751001001",
        min_credits: 3,
        credit_cap: null,
        metadata_json: { acceptedCourseCodes: ["751001001"] },
        display_order: 1
      }
    ],
    studentCourses: [
      {
        course_code: "751001001",
        course_name: "應數課程",
        credits: 3,
        department: "非應數標籤",
        status: "PASSED",
        source: "TRANSCRIPT_JSON",
        recognition_type: "ORIGINAL",
        approval_status: "NOT_REQUIRED"
      }
    ]
  });

  const required = result.groups.find((group) => group.groupCode === "REQUIRED");
  assert.equal(required.status, "COMPLETE");
  assert.equal(required.earnedCredits, 3);
});

test("audit engine counts approved substitutions for required courses and does not double-count them as electives", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "REQUIRED", group_name: "系必修", min_credits: 3, display_order: 1 },
      { id: 2, group_code: "ELECTIVE", group_name: "其他選修", min_credits: 1, display_order: 2 }
    ],
    requirementRules: [
      {
        id: 1,
        requirement_group_id: 1,
        rule_type: "COURSE_REQUIRED",
        rule_key: "REQUIRED-PROBABILITY",
        course_name: "機率論",
        course_code: "701006001",
        min_credits: 3,
        credit_cap: null,
        metadata_json: { acceptedCourseCodes: ["701006001"] },
        display_order: 1
      }
    ],
    studentCourses: [
      {
        course_code: "304025001",
        course_name: "機率論",
        credits: 3,
        department: "統計學系",
        status: "PASSED",
        source: "MANUAL",
        recognition_type: "APPROVED_SUBSTITUTION",
        approval_status: "APPROVED",
        substitution_for_course_code: "701006001"
      },
      { course_code: "E1", course_name: "普通選修", credits: 1, status: "PASSED" }
    ]
  });

  const required = result.groups.find((group) => group.groupCode === "REQUIRED");
  assert.equal(required.status, "COMPLETE");
  assert.equal(required.earnedCredits, 3);
  assert.equal(required.completedRules[0].matchedCourseCode, "304025001");
  assert.equal(required.completedRules[0].recognitionType, "APPROVED_SUBSTITUTION");

  const elective = result.groups.find((group) => group.groupCode === "ELECTIVE");
  assert.equal(elective.rawCredits, 1);
  assert.equal(elective.earnedCredits, 1);
});

test("audit engine prefers APPROVED substitution over TRANSCRIPT when same course_code and same credits", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "REQUIRED", group_name: "系必修", min_credits: 3, display_order: 1 }
    ],
    requirementRules: [
      {
        id: 1,
        requirement_group_id: 1,
        rule_type: "COURSE_REQUIRED",
        rule_key: "REQUIRED-CS",
        course_name: "計算機程式",
        course_code: "701018001",
        min_credits: 3,
        credit_cap: null,
        metadata_json: { acceptedCourseCodes: ["701018001"] },
        display_order: 1
      }
    ],
    studentCourses: [
      {
        course_code: "302795001",
        course_name: "計算機程式設計",
        credits: 3,
        status: "PASSED",
        source: "TRANSCRIPT_JSON",
        recognition_type: "ORIGINAL",
        approval_status: "NOT_REQUIRED",
        substitution_for_course_code: null
      },
      {
        course_code: "302795001",
        course_name: "計算機程式設計",
        credits: 3,
        status: "PASSED",
        source: "MANUAL",
        recognition_type: "APPROVED_SUBSTITUTION",
        approval_status: "APPROVED",
        substitution_for_course_code: "701018001"
      }
    ]
  });

  const required = result.groups.find((g) => g.groupCode === "REQUIRED");
  assert.equal(required.status, "COMPLETE");
  assert.equal(required.earnedCredits, 3);
  assert.equal(required.completedRules[0].recognitionType, "APPROVED_SUBSTITUTION");
});

test("audit engine prefers approved manual general recognition over larger unresolved transcript credits", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "GENERAL", group_name: "通識", min_credits: 28, display_order: 1 }
    ],
    requirementRules: [],
    studentCourses: [
      {
        course_code: "046001101",
        course_name: "程式設計概論",
        credits: 4,
        course_category: null,
        status: "PASSED",
        source: "TRANSCRIPT_JSON",
        recognition_type: "ORIGINAL",
        approval_status: "NOT_REQUIRED"
      },
      {
        course_code: "046001101",
        course_name: "程式設計概論",
        credits: 3,
        course_category: "通識-資訊",
        status: "PASSED",
        source: "MANUAL",
        recognition_type: "MANUAL_CREDIT",
        approval_status: "APPROVED"
      }
    ],
    generalCourses: []
  });

  const general = result.groups.find((group) => group.groupCode === "GENERAL");
  assert.equal(general.earnedCredits, 3);
  assert.equal(general.courses[0].courseCode, "046001101");
  assert.equal(general.courses[0].category, "通識-資訊");
});

test("audit engine keeps official transcript total as reference but uses category-sum graduation credits", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "TOTAL", group_name: "總畢業學分", display_order: 1 },
      { id: 2, group_code: "ELECTIVE", group_name: "其他選修", min_credits: 45, display_order: 2 }
    ],
    requirementRules: [],
    studentCourses: [
      { course_code: "A", course_name: "A", credits: 151, status: "PASSED" }
    ],
    transcriptImport: { total_credits_reported: 128 }
  });

  assert.equal(result.totalCredits.earned, 45);
  assert.equal(result.totalCredits.officialTranscriptCredits, 128);
  assert.equal(result.totalCredits.calculatedFromPassedCourses, 151);
  assert.equal(result.totalCredits.source, "CATEGORY_SUM_51_4_28_45");
});

test("audit engine keeps in-progress courses out of official result and returns projection separately", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "ELECTIVE", group_name: "其他選修", min_credits: 45, display_order: 1 }
    ],
    requirementRules: [],
    studentCourses: [
      { course_code: "P", course_name: "已過選修", credits: 30, status: "PASSED" },
      { course_code: "I", course_name: "未到選修", credits: 30, status: "IN_PROGRESS" }
    ],
    options: { includeInProgress: true }
  });

  const officialElective = result.groups.find((group) => group.groupCode === "ELECTIVE");
  const projectedElective = result.projectedResult.groups.find((group) => group.groupCode === "ELECTIVE");

  assert.equal(result.mode, "OFFICIAL");
  assert.equal(result.isProjected, false);
  assert.equal(officialElective.earnedCredits, 30);
  assert.equal(officialElective.status, "INCOMPLETE");
  assert.equal(result.projectedResult.mode, "PROJECTED");
  assert.equal(result.projectedResult.isProjected, true);
  assert.equal(projectedElective.earnedCredits, 45);
  assert.equal(projectedElective.status, "COMPLETE");
  assert.equal(result.graduationEligible, false);
});

test("audit engine treats unsupported requirement groups as not eligible", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 1,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "TOTAL", group_name: "總畢業學分", display_order: 1 },
      { id: 2, group_code: "UNKNOWN", group_name: "未知規則", min_credits: 0, display_order: 2 },
      { id: 3, group_code: "ELECTIVE", group_name: "其他選修", min_credits: 1, display_order: 3 }
    ],
    requirementRules: [],
    studentCourses: [
      { course_code: "A", course_name: "選修", credits: 1, status: "PASSED" }
    ]
  });

  const unsupported = result.groups.find((group) => group.groupCode === "UNKNOWN");
  assert.equal(unsupported.status, "UNSUPPORTED");
  assert.equal(result.totalCredits.earned, 1);
  assert.equal(result.graduationEligible, false);
});

test("audit engine optimizes cross-domain general education assignment", () => {
  const generalCourses = [
    { course_code: "X", course_name: "跨領域核心", category: "跨領域(人文、自然)", is_core: true },
    { course_code: "C", course_name: "國文", category: "中文通識", is_core: false },
    { course_code: "F1", course_name: "大學英文（一）", category: "外文通識", is_core: false },
    { course_code: "F2", course_name: "大學英文（二）", category: "外文通識", is_core: false },
    { course_code: "H1", course_name: "人文一", category: "人文通識", is_core: false },
    { course_code: "H2", course_name: "人文二", category: "人文通識", is_core: false },
    { course_code: "S1", course_name: "社會一", category: "社會通識", is_core: true },
    { course_code: "S2", course_name: "社會二", category: "社會通識", is_core: false },
    { course_code: "I", course_name: "資訊", category: "資訊通識", is_core: false }
  ];

  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "GENERAL", group_name: "通識", min_credits: 28, display_order: 1 }
    ],
    requirementRules: [],
    generalCourses,
    studentCourses: [
      { course_code: "X", course_name: "跨領域核心", credits: 3, status: "PASSED" },
      { course_code: "C", course_name: "國文", credits: 3, status: "PASSED" },
      { course_code: "F1", course_name: "大學英文（一）", credits: 3, status: "PASSED" },
      { course_code: "F2", course_name: "大學英文（二）", credits: 3, status: "PASSED" },
      { course_code: "H1", course_name: "人文一", credits: 3, status: "PASSED" },
      { course_code: "H2", course_name: "人文二", credits: 3, status: "PASSED" },
      { course_code: "S1", course_name: "社會一", credits: 3, status: "PASSED" },
      { course_code: "S2", course_name: "社會二", credits: 4, status: "PASSED" },
      { course_code: "I", course_name: "資訊", credits: 3, status: "PASSED" }
    ]
  });

  const general = result.groups.find((group) => group.groupCode === "GENERAL");
  const crossCourse = general.courses.find((course) => course.courseCode === "X");
  const natural = general.requirements.find((bucket) => bucket.bucketCode === "NATURAL");

  assert.equal(general.status, "COMPLETE");
  assert.equal(general.earnedCredits, 28);
  assert.equal(crossCourse.assignedBucket, "NATURAL");
  assert.equal(natural.status, "COMPLETE");
});

test("audit engine does not count one cross-domain core course as two core domains", () => {
  const generalCourses = [
    { course_code: "C", course_name: "國文", category: "中文通識", is_core: false },
    { course_code: "F1", course_name: "大學英文（一）", category: "外文通識", is_core: false },
    { course_code: "F2", course_name: "大學英文（二）", category: "外文通識", is_core: false },
    { course_code: "X", course_name: "跨領域核心", category: "跨領域(人文、社會)", is_core: true },
    { course_code: "H", course_name: "人文", category: "人文通識", is_core: false },
    { course_code: "S", course_name: "社會", category: "社會通識", is_core: false },
    { course_code: "N", course_name: "自然", category: "自然通識", is_core: false },
    { course_code: "I", course_name: "資訊", category: "資訊通識", is_core: false }
  ];

  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "GENERAL", group_name: "通識", min_credits: 28, display_order: 1 }
    ],
    requirementRules: [],
    generalCourses,
    studentCourses: [
      { course_code: "C", course_name: "國文", credits: 3, status: "PASSED" },
      { course_code: "F1", course_name: "大學英文（一）", credits: 3, status: "PASSED" },
      { course_code: "F2", course_name: "大學英文（二）", credits: 3, status: "PASSED" },
      { course_code: "X", course_name: "跨領域核心", credits: 3, status: "PASSED" },
      { course_code: "H", course_name: "人文", credits: 4, status: "PASSED" },
      { course_code: "S", course_name: "社會", credits: 4, status: "PASSED" },
      { course_code: "N", course_name: "自然", credits: 5, status: "PASSED" },
      { course_code: "I", course_name: "資訊", credits: 3, status: "PASSED" }
    ]
  });

  const general = result.groups.find((group) => group.groupCode === "GENERAL");
  assert.equal(general.earnedCredits, 28);
  assert.equal(general.coreRequirement.earnedDistinctCourses, 1);
  assert.equal(general.coreRequirement.status, "INCOMPLETE");
  assert.equal(general.status, "INCOMPLETE");
});

test("audit engine does not classify foreign language by course name alone", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "GENERAL", group_name: "通識", min_credits: 28, display_order: 1 }
    ],
    requirementRules: [],
    generalCourses: [],
    studentCourses: [
      { course_code: "E1", course_name: "大學英文（一）", credits: 3, status: "PASSED" },
      { course_code: "E2", course_name: "選修英文：職場溝通", credits: 3, status: "PASSED", remark: "外文通" }
    ]
  });

  const general = result.groups.find((group) => group.groupCode === "GENERAL");
  const foreign = general.requirements.find((bucket) => bucket.bucketCode === "FOREIGN");

  assert.equal(foreign.rawCredits, 3);
  assert.equal(foreign.earnedCredits, 3);
  assert.deepEqual(foreign.courses.map((course) => course.courseCode), ["E2"]);
});

test("audit engine evaluates general education buckets, caps, and core domains", () => {
  const curriculum = {
    total_required_credits: 128,
    program_type: "MAJOR",
    department: "應用數學系",
    AcademicYear: { year_code: 111 }
  };
  const requirementGroups = [
    { id: 1, group_code: "GENERAL", group_name: "通識", min_credits: 28, display_order: 1 }
  ];
  const generalCourses = [
    { course_code: "C1", course_name: "國文", category: "中文通識", is_core: false },
    { course_code: "F1", course_name: "大學英文（一）", category: "外文通識", is_core: false },
    { course_code: "F2", course_name: "大學英文（二）", category: "外文通識", is_core: false },
    { course_code: "H1", course_name: "哲學", category: "人文通識", is_core: true },
    { course_code: "S1", course_name: "政治", category: "社會通識", is_core: true },
    { course_code: "S2", course_name: "經濟", category: "社會通識", is_core: false },
    { course_code: "N1", course_name: "物理", category: "自然通識", is_core: false },
    { course_code: "I1", course_name: "資訊", category: "資訊通識", is_core: false },
    { course_code: "A1", course_name: "書院", category: "書院通識", is_core: false }
  ];
  const studentCourses = [
    { course_code: "C1", course_name: "國文", credits: 3, status: "PASSED" },
    { course_code: "F1", course_name: "大學英文（一）", credits: 3, status: "PASSED" },
    { course_code: "F2", course_name: "大學英文（二）", credits: 3, status: "PASSED" },
    { course_code: "H1", course_name: "哲學", credits: 3, status: "PASSED" },
    { course_code: "S1", course_name: "政治", credits: 3, status: "PASSED" },
    { course_code: "S2", course_name: "經濟", credits: 5, status: "PASSED" },
    { course_code: "N1", course_name: "物理", credits: 3, status: "PASSED" },
    { course_code: "I1", course_name: "資訊", credits: 3, status: "PASSED" },
    { course_code: "A1", course_name: "書院", credits: 3, status: "PASSED" }
  ];

  const result = runAudit({
    curriculum,
    requirementGroups,
    requirementRules: [],
    studentCourses,
    generalCourses
  });

  const general = result.groups.find((group) => group.groupCode === "GENERAL");
  assert.equal(general.status, "COMPLETE");
  assert.equal(general.rawCredits, 29);
  assert.equal(general.earnedCredits, 28);
  assert.equal(general.excessCredits, 1);
  assert.equal(general.coreRequirement.status, "COMPLETE");
  assert.equal(general.coreRequirement.earnedDistinctDomains, 2);

  const social = general.requirements.find((bucket) => bucket.bucketCode === "SOCIAL");
  assert.equal(social.rawCredits, 8);
  assert.equal(social.earnedCredits, 7);
  assert.equal(social.excessCredits, 1);

  const info = general.requirements.find((bucket) => bucket.bucketCode === "INFO");
  assert.equal(info.minCredits, 0);
  assert.equal(info.status, "COMPLETE");
});

test("audit engine caps graduation credits for excess general education and PE/defense", () => {
  const curriculum = {
    total_required_credits: 128,
    program_type: "MAJOR",
    department: "應用數學系",
    AcademicYear: { year_code: 111 }
  };
  const requirementGroups = [
    { id: 1, group_code: "TOTAL", group_name: "總畢業學分", display_order: 1 },
    { id: 2, group_code: "GENERAL", group_name: "通識", min_credits: 28, display_order: 2 },
    { id: 3, group_code: "PE", group_name: "體育", min_courses: 4, display_order: 3 },
    { id: 4, group_code: "ELECTIVE", group_name: "其他選修", min_credits: 45, display_order: 4 }
  ];
  const generalCourses = Array.from({ length: 10 }, (_, index) => ({
    course_code: `G${index}`,
    course_name: `通識${index}`,
    category: index < 4 ? "人文通識" : index < 7 ? "社會通識" : "自然通識",
    is_core: index === 0 || index === 4
  }));
  const studentCourses = [
    ...generalCourses.map((course) => ({
      course_code: course.course_code,
      course_name: course.course_name,
      credits: 3,
      status: "PASSED"
    })),
    { course_code: "P1", course_name: "體育（一）", credits: 1, status: "PASSED" },
    { course_code: "P2", course_name: "體育（二）", credits: 1, status: "PASSED" },
    { course_code: "P3", course_name: "體育（三）", credits: 1, status: "PASSED" },
    { course_code: "P4", course_name: "體育（四）", credits: 1, status: "PASSED" },
    { course_code: "D1", course_name: "全民國防教育軍事訓練", credits: 2, status: "PASSED" },
    { course_code: "X1", course_name: "其他課程", credits: 100, status: "PASSED" }
  ];

  const result = runAudit({
    curriculum,
    requirementGroups,
    requirementRules: [],
    studentCourses,
    generalCourses
  });

  const general = result.groups.find((group) => group.groupCode === "GENERAL");
  assert.equal(general.earnedCredits, 21);

  const pe = result.groups.find((group) => group.groupCode === "PE");
  assert.equal(pe.status, "COMPLETE");
  assert.equal(pe.earnedCredits, 4);
  assert.equal(pe.electiveCreditCapReference.rawCredits, 2);
  assert.equal(pe.electiveCreditCapReference.countedCredits, 2);
  assert.equal(pe.electiveCreditCapReference.excludedCredits, 0);
  assert.equal(pe.electiveCreditCapReference.defense.rawCredits, 2);
  assert.equal(pe.electiveCreditCapReference.defense.countedCredits, 2);
  assert.equal(pe.electiveCreditCapReference.defense.excludedCredits, 0);
  assert.equal(pe.electiveCreditCapReference.physicalElective.rawCredits, 0);

  const elective = result.groups.find((group) => group.groupCode === "ELECTIVE");
  assert.equal(elective.status, "COMPLETE");
  assert.equal(elective.earnedCredits, 45);

  assert.equal(result.totalCredits.calculatedFromPassedCourses, 136);
  assert.equal(result.totalCredits.categoryEarnedCredits, 70);
  assert.equal(result.totalCredits.excludedByRules, 66);
});

test("audit engine applies separate 4-credit caps for PE electives and national defense", () => {
  const result = runAudit({
    curriculum: {
      total_required_credits: 128,
      program_type: "MAJOR",
      department: "應用數學系",
      AcademicYear: { year_code: 111 }
    },
    requirementGroups: [
      { id: 1, group_code: "PE", group_name: "體育", min_courses: 4, display_order: 1 },
      { id: 2, group_code: "ELECTIVE", group_name: "其他選修", min_credits: 8, display_order: 2 }
    ],
    requirementRules: [],
    studentCourses: [
      { course_code: "P1", course_name: "體育（一）", credits: 1, status: "PASSED" },
      { course_code: "P2", course_name: "體育（二）", credits: 1, status: "PASSED" },
      { course_code: "P3", course_name: "體育（三）", credits: 1, status: "PASSED" },
      { course_code: "P4", course_name: "體育（四）", credits: 1, status: "PASSED" },
      { course_code: "P5", course_name: "體育選修：桌球", credits: 6, status: "PASSED" },
      { course_code: "D1", course_name: "全民國防教育軍事訓練", credits: 6, status: "PASSED" }
    ]
  });

  const pe = result.groups.find((group) => group.groupCode === "PE");
  assert.equal(pe.electiveCreditCapReference.rawCredits, 12);
  assert.equal(pe.electiveCreditCapReference.countedCredits, 8);
  assert.equal(pe.electiveCreditCapReference.excludedCredits, 4);
  assert.equal(pe.electiveCreditCapReference.physicalElective.countedCredits, 4);
  assert.equal(pe.electiveCreditCapReference.physicalElective.excludedCredits, 2);
  assert.equal(pe.electiveCreditCapReference.defense.countedCredits, 4);
  assert.equal(pe.electiveCreditCapReference.defense.excludedCredits, 2);

  const elective = result.groups.find((group) => group.groupCode === "ELECTIVE");
  assert.equal(elective.status, "COMPLETE");
  assert.equal(elective.earnedCredits, 8);
  assert.equal(elective.physicalAndDefenseElectiveCap.countedCredits, 8);
  assert.equal(elective.physicalAndDefenseElectiveCap.excludedCredits, 4);
  assert.equal(elective.uncountedCourses.length, 2);
  assert.ok(elective.uncountedCourses.some((course) => course.reason.includes("體育選修課超過 4 學分")));
  assert.ok(elective.uncountedCourses.some((course) => course.reason.includes("國防課程超過 4 學分")));
});
