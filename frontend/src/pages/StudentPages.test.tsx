import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditRunPage, StudentCoursesPage, StudentDashboard, StudentImportPage } from "./StudentPages";
import type { StudentCourse } from "../types/api";

const studentProfile = {
  studentName: "Demo Student",
  studentNumber: "DEMO001",
  major: "金融學系",
  doubleMajor: "統計學系",
  averageScore: "94.55",
  cumulativeGpa: "4.18",
  rankings: [
    { label: "系排名", value: "4 / 75", percent: "5.33 %" },
    { label: "班排名", value: "5 / 75", percent: "5.33 %" }
  ],
  semesterSummaries: [
    {
      academicYear: "113",
      semester: "2",
      academicYearSemester: "1132",
      averageScore: "98.41",
      totalCredits: "26",
      gpa: "4.28",
      departmentRanking: "3 / 55",
      departmentRankPercent: "5.45 %",
      classRanking: "3 / 55",
      classRankPercent: "5.45 %"
    }
  ]
};

const studentCourses: StudentCourse[] = [
  {
    id: 1,
    user_id: 1,
    course_code: "304835001",
    course_name: "統計機器學習",
    credits: "3",
    department: null,
    course_category: null,
    academic_year: 113,
    semester: "2",
    academic_year_semester: "1132",
    required_or_elective: "選",
    score: "100.00",
    remark: "",
    status: "PASSED",
    source: "TRANSCRIPT_JSON",
    recognition_type: "ORIGINAL",
    approval_status: "NOT_REQUIRED",
    substitution_for_course_code: null,
    substitution_for_course_name: null,
    approval_source: null,
    approval_note: null
  }
];

vi.mock("../state/AppState", () => ({
  useAppState: () => ({
    currentUser: { id: 1, name: "學生使用者", student_number: "DEMO001", admission_year: 111, email: "demo@nccu.edu.tw", role: "student" },
    studentProfile,
    setStudentProfile: vi.fn(),
    setLastAuditResult: vi.fn()
  })
}));

vi.mock("../api/hooks", () => ({
  useAuditHistory: () => ({ data: { rows: [] }, isLoading: false, error: null }),
  useImportTranscript: () => ({ mutate: vi.fn(), isPending: false, error: null, data: null }),
  useLatestAuditResult: () => ({ data: null, isLoading: false, error: null }),
  useRunAudit: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useStudentCourses: () => ({ data: studentCourses, isLoading: false, error: null })
}));

afterEach(() => {
  cleanup();
});

describe("student pages", () => {
  it("shows GPA and both department and class rankings on the dashboard", () => {
    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    expect(screen.getByText("94.55 / GPA 4.18")).toBeInTheDocument();
    expect(screen.getByText("系排名 4 / 75（前 5.33 %）")).toBeInTheDocument();
    expect(screen.getByText("班排名 5 / 75（前 5.33 %）")).toBeInTheDocument();
  });

  it("explains how to download the iNCCU transcript JSON", () => {
    render(<MemoryRouter><StudentImportPage /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "前往 iNCCU 下載 JSON" })).toHaveAttribute("href", "https://i.nccu.edu.tw/Login.aspx?ReturnUrl=%2f");
    expect(screen.getByText("進入「我的全人」")).toBeInTheDocument();
    expect(screen.getByText("點選「資料格式化匯出」")).toBeInTheDocument();
    expect(screen.getByText("勾選「課業學習」後點選「下載」")).toBeInTheDocument();
  });

  it("shows audit option help text through accessible info controls", () => {
    render(<MemoryRouter><AuditRunPage /></MemoryRouter>);

    expect(screen.getByLabelText("學年度說明")).toHaveAttribute("title", expect.stringContaining("111 入學就選 111"));
    expect(screen.getByLabelText("修課中預估說明")).toHaveAttribute("title", expect.stringContaining("如果都通過"));
    expect(screen.getByLabelText("儲存審核紀錄說明")).toHaveAttribute("title", expect.stringContaining("歷史紀錄"));
  });

  it("shows course scores and semester grade summaries", () => {
    render(<MemoryRouter><StudentCoursesPage /></MemoryRouter>);

    expect(screen.getByText("學期成績摘要")).toBeInTheDocument();
    expect(screen.getByText("113-2")).toBeInTheDocument();
    expect(screen.getByText("GPA 4.28")).toBeInTheDocument();
    expect(screen.getByText("系排名 3 / 55")).toBeInTheDocument();
    expect(screen.getByText("班排名 3 / 55")).toBeInTheDocument();
    expect(screen.getByText("成績/等第")).toBeInTheDocument();
    expect(screen.getByText("100.00 / A+")).toBeInTheDocument();
  });
});
