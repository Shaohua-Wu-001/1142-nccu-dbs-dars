import { describe, expect, it } from "vitest";
import { buildManualCourseLink, getAdminDashboardStats } from "./adminWorkflow";
import type { AuditHistoryRow, StudentCourse } from "../types/api";

const baseCourse: StudentCourse = {
  id: 9,
  user_id: 1,
  course_code: "046001101",
  course_name: "程式設計概論",
  credits: 3,
  department: null,
  course_category: null,
  academic_year: 111,
  semester: "1",
  academic_year_semester: "1111",
  required_or_elective: null,
  score: "85",
  remark: "資訊超修學分不得採計為畢業學分",
  status: "PASSED",
  source: "TRANSCRIPT_JSON",
  recognition_type: "ORIGINAL",
  approval_status: "NOT_REQUIRED",
  substitution_for_course_code: null,
  substitution_for_course_name: null,
  approval_source: null,
  approval_note: null
};

describe("admin workflow helpers", () => {
  it("builds a manual-course link that pre-fills unresolved course data", () => {
    expect(buildManualCourseLink(baseCourse)).toBe(
      "/admin/manual-courses?courseCode=046001101&courseName=%E7%A8%8B%E5%BC%8F%E8%A8%AD%E8%A8%88%E6%A6%82%E8%AB%96&credits=3&academicYear=111&semester=1&sourceCourseId=9&score=85&remark=%E8%B3%87%E8%A8%8A%E8%B6%85%E4%BF%AE%E5%AD%B8%E5%88%86%E4%B8%8D%E5%BE%97%E6%8E%A1%E8%A8%88%E7%82%BA%E7%95%A2%E6%A5%AD%E5%AD%B8%E5%88%86"
    );
  });

  it("summarizes admin dashboard counts from loaded data", () => {
    const manualCourse = { ...baseCourse, id: 10, source: "MANUAL" as const };
    const history = [
      { id: 1, progress_percentage: 50 },
      { id: 2, progress_percentage: 67.19 }
    ] as AuditHistoryRow[];

    expect(getAdminDashboardStats({
      studentCourses: [baseCourse, manualCourse],
      unresolvedCount: 1,
      auditHistory: history
    })).toEqual({
      totalCourses: 2,
      manualAdjustments: 1,
      unresolvedCourses: 1,
      auditRuns: 2,
      latestProgress: 67.19
    });
  });
});
