export type UserRole = "student" | "admin";

export type DemoUser = {
  id: number;
  student_number: string;
  username: string | null;
  name: string;
  email: string;
  admission_year: number;
  role: UserRole;
};

export type LoginRequest = {
  account: string;
  password: string;
};

export type RegisterRequest = {
  student_number: string;
  username: string;
  name: string;
  email: string;
  password: string;
  admission_year: number;
};

export type ForgotPasswordRequest = { email: string };
export type ResetPasswordRequest = { token: string; password: string };
export type UpdateProfileRequest = { name: string; email: string };
export type ChangePasswordRequest = { currentPassword: string; newPassword: string };

export type AdminRegisterRequest = {
  username: string;
  name: string;
  email: string;
  password: string;
  admin_secret: string;
};

export type AuthResponse = {
  token: string;
  user: DemoUser;
};

export type Course = {
  id: number;
  academic_year: number;
  semester: string;
  course_code: string;
  course_name: string;
  credits: string | number;
  department: string | null;
  level: string | null;
  category: string | null;
};

export type StudentCourseStatus = "PASSED" | "FAILED" | "WITHDRAWN" | "IN_PROGRESS";
export type StudentCourseSource = "TRANSCRIPT_JSON" | "MANUAL";

export type StudentCourse = {
  id: number;
  user_id: number;
  course_code: string;
  course_name: string;
  course_english_name?: string | null;
  english_name?: string | null;
  courseNameEnglish?: string | null;
  credits: string | number;
  department: string | null;
  course_category: string | null;
  academic_year: number;
  semester: string;
  academic_year_semester: string;
  required_or_elective: string | null;
  score: string | null;
  remark: string | null;
  status: StudentCourseStatus;
  source: StudentCourseSource;
  recognition_type: "ORIGINAL" | "APPROVED_SUBSTITUTION" | "MANUAL_CREDIT";
  approval_status: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
  substitution_for_course_code: string | null;
  substitution_for_course_name: string | null;
  approval_source: string | null;
  approval_note: string | null;
};

export type TranscriptImportResult = {
  importId: number;
  userId: number;
  studentNumber: string | null;
  studentName: string | null;
  coursePlanYear: string | null;
  importedCourses: number;
  passedCourses: number;
  failedCourses: number;
  inProgressCourses: number;
  withdrawnCourses: number;
  unresolvedCourseCount: number;
  unresolvedCourses: Array<Record<string, unknown>>;
};

export type AuditRunRequest = {
  userId: number;
  academicYear: string;
  includeInProgress: boolean;
  saveResult: boolean;
  auditSource?: "STUDENT" | "ADMIN";
};

export type AuditResult = {
  auditId?: number | null;
  saved?: boolean;
  academicYear: string;
  programType: string;
  department: string;
  mode: "OFFICIAL" | "PROJECTED";
  isProjected: boolean;
  progressPercentage: number;
  graduationEligible: boolean;
  totalCredits: {
    earned: number;
    required: number;
    missing: number;
    source: string;
    officialTranscriptCredits: number | null;
    calculatedFromPassedCourses: number;
    categoryEarnedCredits: number;
    excludedByRules: number;
    structure: {
      required: number;
      physicalEducation: number;
      generalEducation: number;
      elective: number;
    };
  };
  groups: AuditGroup[];
  warnings: string[];
  projectedResult?: AuditResult;
};

export type AuditGroup = {
  groupCode: "TOTAL" | "REQUIRED" | "PE" | "GENERAL" | "ELECTIVE" | string;
  groupName: string;
  status: "COMPLETE" | "INCOMPLETE" | "UNSUPPORTED";
  earnedCredits: number;
  requiredCredits: number;
  missingCredits: number;
  missingCourses?: Array<Record<string, unknown>>;
  completedRules?: Array<Record<string, unknown>>;
  courses?: Array<Record<string, unknown>>;
  uncountedCourses?: Array<Record<string, unknown>>;
  requirements?: GeneralRequirement[];
  coreRequirement?: Record<string, unknown>;
  warnings?: string[];
  notes?: string[];
  [key: string]: unknown;
};

export type GeneralRequirement = {
  bucketCode: string;
  bucketName: string;
  status: "COMPLETE" | "INCOMPLETE";
  rawCredits: number;
  earnedCredits: number;
  minCredits: number;
  maxCredits: number;
  missingCredits: number;
  excessCredits: number;
  courses: Array<Record<string, unknown>>;
};

export type AuditHistoryRow = {
  id: number;
  user_id: number;
  curriculum_id: number;
  transcript_import_id: number | null;
  audit_name?: string | null;
  audit_source?: "STUDENT" | "ADMIN";
  total_credits_earned: string | number;
  total_required_credits: string | number;
  progress_percentage: string | number;
  created_at: string;
  updated_at: string;
  result_json?: AuditResult;
};

export type PaginatedRows<T> = {
  count: number;
  rows: T[];
};

export type ManualCoursePayload = {
  userId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  department?: string;
  courseCategory?: string;
  academicYear: number;
  semester: string;
  academicYearSemester?: string;
  score: string;
  remark?: string;
  recognitionType: "MANUAL_CREDIT" | "APPROVED_SUBSTITUTION";
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
  substitutionForCourseCode?: string;
  substitutionForCourseName?: string;
  approvalSource?: string;
  approvalNote?: string;
};
