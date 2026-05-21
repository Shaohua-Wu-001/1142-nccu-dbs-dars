import type { AuditHistoryRow, StudentCourse } from "../types/api";

export type AdminDashboardStats = {
  totalCourses: number;
  manualAdjustments: number;
  unresolvedCourses: number;
  auditRuns: number;
  latestProgress: number | null;
};

export function buildManualCourseLink(course: StudentCourse) {
  const params = new URLSearchParams({
    courseCode: course.course_code,
    courseName: course.course_name,
    credits: String(course.credits),
    academicYear: String(course.academic_year),
    semester: course.semester,
    sourceCourseId: String(course.id),
    score: course.score || "",
    remark: course.remark || ""
  });

  return `/admin/manual-courses?${params.toString()}`;
}

export function getAdminDashboardStats({
  studentCourses,
  unresolvedCount,
  auditHistory
}: {
  studentCourses: StudentCourse[];
  unresolvedCount: number;
  auditHistory: AuditHistoryRow[];
}): AdminDashboardStats {
  const latest = auditHistory.reduce<AuditHistoryRow | null>((current, row) => {
    if (!current) return row;
    return row.id > current.id ? row : current;
  }, null);

  return {
    totalCourses: studentCourses.length,
    manualAdjustments: studentCourses.filter((course) => course.source === "MANUAL").length,
    unresolvedCourses: unresolvedCount,
    auditRuns: auditHistory.length,
    latestProgress: latest ? Number(latest.progress_percentage) : null
  };
}
