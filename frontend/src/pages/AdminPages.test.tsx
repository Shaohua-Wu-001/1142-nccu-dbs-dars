import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "../state/AppState";
import type { StudentAcademicProfile } from "../lib/transcriptProfile";
import type { AuditHistoryRow, AuditResult } from "../types/api";
import { AdminAuditHistoryPage, AdminRequirementsPage } from "./AdminPages";

const useAuditHistoryMock = vi.fn();
const useAuditHistoryDetailMock = vi.fn();
const useRequirementsMock = vi.fn();

vi.mock("../api/hooks", () => ({
  useAdminStudents: () => ({
    data: {
      rows: [
        {
          userId: 1,
          studentNumber: "DEMO001",
          studentName: "Demo Student",
          email: "demo@nccu.edu.tw",
          admissionYear: 111,
          latestUploadAt: null,
          hasTranscript: true,
          unresolvedCount: 0
        }
      ]
    },
    isLoading: false,
    error: null
  }),
  useAuditHistory: () => useAuditHistoryMock(),
  useAuditHistoryDetail: (id: number | null) => useAuditHistoryDetailMock(id),
  useCourses: vi.fn(),
  useCreateManualCourse: vi.fn(),
  useDeleteManualCourse: vi.fn(),
  useRunAudit: vi.fn(),
  useRequirements: (year: string) => useRequirementsMock(year),
  useStudentCourses: vi.fn(),
  useUnresolvedCourses: vi.fn(),
  useUpdateManualCourse: vi.fn()
}));

vi.mock("../components/AuditResultView", () => ({
  AuditResultView: ({ result, studentProfile }: { result: AuditResult; studentProfile?: StudentAcademicProfile | null }) => (
    <div data-testid="audit-result-view">
      {result.graduationEligible ? "符合畢業資格" : "尚未符合畢業資格"}
      {studentProfile?.studentName ? ` / ${studentProfile.studentName}` : ""}
      {studentProfile?.cumulativeGpa ? ` / GPA ${studentProfile.cumulativeGpa}` : ""}
    </div>
  )
}));

const auditRow: AuditHistoryRow = {
  id: 12,
  user_id: 1,
  curriculum_id: 1,
  transcript_import_id: null,
  total_credits_earned: 86,
  total_required_credits: 128,
  progress_percentage: 67.19,
  created_at: "2026-05-14T01:17:15.000Z",
  updated_at: "2026-05-14T01:17:15.000Z"
};

const auditResult = {
  academicYear: "111",
  programType: "BACHELOR",
  department: "應用數學系",
  mode: "OFFICIAL",
  isProjected: false,
  progressPercentage: 67.19,
  graduationEligible: false,
  totalCredits: {
    earned: 86,
    required: 128,
    missing: 42,
    source: "calculated",
    officialTranscriptCredits: 163,
    calculatedFromPassedCourses: 164,
    categoryEarnedCredits: 86,
    excludedByRules: 78,
    structure: {
      required: 51,
      physicalEducation: 4,
      generalEducation: 28,
      elective: 45
    }
  },
  groups: [],
  warnings: []
} satisfies AuditResult;

describe("AdminAuditHistoryPage", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    });
    useAuditHistoryMock.mockReset();
    useAuditHistoryDetailMock.mockReset();
    useRequirementsMock.mockReset();
  });

  it("loads selected audit detail before rendering the result panel", () => {
    localStorage.setItem("nccu-student-profile:1", JSON.stringify({
      studentName: "Demo Student",
      ranking: "4 / 75",
      classRanking: "5 / 75",
      averageScore: "94.55",
      cumulativeGpa: "4.21"
    }));
    useAuditHistoryMock.mockReturnValue({
      data: { count: 1, rows: [auditRow] },
      isLoading: false,
      error: null
    });
    useAuditHistoryDetailMock.mockReturnValue({
      data: { ...auditRow, result_json: auditResult },
      isLoading: false,
      error: null
    });

    render(
      <MemoryRouter>
        <AppStateProvider>
          <AdminAuditHistoryPage />
        </AppStateProvider>
      </MemoryRouter>
    );

    expect(useAuditHistoryDetailMock).toHaveBeenCalledWith(12);
    expect(screen.getByTestId("audit-result-view")).toHaveTextContent("尚未符合畢業資格");
    expect(screen.getByTestId("audit-result-view")).toHaveTextContent("Demo Student");
    expect(screen.getByTestId("audit-result-view")).toHaveTextContent("GPA 4.21");
  });
});

describe("AdminRequirementsPage", () => {
  beforeEach(() => {
    useRequirementsMock.mockReset();
  });

  it("presents graduation rules in administrative language without engineering codes", () => {
    useRequirementsMock.mockReturnValue({
      data: {
        curriculum: { total_required_credits: 128 },
        groups: [
          {
            id: 1,
            group_code: "TOTAL",
            group_name: "總畢業學分",
            min_credits: 128,
            min_courses: null,
            RequirementRules: [
              { id: 11, rule_type: "TOTAL_CREDITS", rule_key: "TOTAL_CREDITS_128", course_name: null, min_credits: 128, credit_cap: null, metadata_json: {} }
            ]
          },
          {
            id: 2,
            group_code: "REQUIRED",
            group_name: "系必修",
            min_credits: 51,
            min_courses: null,
            RequirementRules: [
              {
                id: 21,
                rule_type: "ANY_OF",
                rule_key: "線性代數-FIRST",
                course_name: "線性代數（上學期）",
                min_credits: 3,
                credit_cap: 0,
                metadata_json: {
                  acceptedCourseCodes: ["701011001", "751011001"],
                  specialPolicy: "113-114 線性代數每學期採計上限為 3 學分。"
                }
              }
            ]
          },
          {
            id: 3,
            group_code: "PE",
            group_name: "體育必修",
            min_credits: 0,
            min_courses: 4,
            RequirementRules: []
          }
        ]
      },
      isLoading: false,
      error: null
    });

    render(<AdminRequirementsPage />);

    expect(screen.getAllByText("總畢業學分：128 學分").length).toBeGreaterThan(0);
    expect(screen.getAllByText("體育必修：需修滿 4 門").length).toBeGreaterThan(0);
    expect(screen.getAllByText("通識課程：總計 28 學分，超修部分不採計。").length).toBeGreaterThan(0);
    expect(screen.getAllByText("其他選修：需修滿 45 學分，國防課程與選修體育課程各最多採計 4 學分。").length).toBeGreaterThan(0);
    expect(screen.getByText("系必修可採認課號")).toBeInTheDocument();
    expect(screen.getByText("113-114 線性代數每學期採計上限為 3 學分。")).toBeInTheDocument();
    expect(screen.queryByText("最低門檻：0 學分 / 4 門")).not.toBeInTheDocument();
    expect(screen.queryByText("此類規則由系統依固定政策自動檢核，沒有逐條課程明細。")).not.toBeInTheDocument();
    expect(screen.queryByText("GROUP: REQUIRED")).not.toBeInTheDocument();
    expect(screen.queryByText("ANY_OF")).not.toBeInTheDocument();
  });
});
