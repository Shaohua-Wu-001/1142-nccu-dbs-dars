import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuditResultView } from "./AuditResultView";
import type { AuditResult } from "../types/api";

const baseResult: AuditResult = {
  academicYear: "113",
  programType: "UNDERGRADUATE",
  department: "應用數學系",
  mode: "OFFICIAL",
  isProjected: false,
  progressPercentage: 100,
  graduationEligible: true,
  totalCredits: {
    earned: 128,
    required: 128,
    missing: 0,
    source: "calculated",
    officialTranscriptCredits: null,
    calculatedFromPassedCourses: 128,
    categoryEarnedCredits: 128,
    excludedByRules: 3,
    structure: {
      required: 70,
      physicalEducation: 0,
      generalEducation: 28,
      elective: 30
    }
  },
  warnings: [],
  groups: [
    {
      groupCode: "GENERAL",
      groupName: "通識",
      status: "COMPLETE",
      earnedCredits: 28,
      requiredCredits: 28,
      missingCredits: 0,
      requirements: [
        {
          bucketCode: "HUMANITIES",
          bucketName: "人文學",
          status: "COMPLETE",
          rawCredits: 7,
          earnedCredits: 7,
          minCredits: 3,
          maxCredits: 7,
          missingCredits: 0,
          excessCredits: 0,
          courses: [
            { courseCode: "H1", courseName: "哲學概論", isCore: true }
          ]
        },
        {
          bucketCode: "SOCIAL",
          bucketName: "社會科學",
          status: "COMPLETE",
          rawCredits: 4,
          earnedCredits: 4,
          minCredits: 3,
          maxCredits: 7,
          missingCredits: 0,
          excessCredits: 0,
          courses: [
            { courseCode: "S1", courseName: "政治學", isCore: true }
          ]
        }
      ],
      coreRequirement: {
        status: "COMPLETE",
        requiredDistinctDomains: 2,
        earnedDistinctDomains: 2,
        earnedDistinctCourses: 2,
        earnedDomains: ["人文學", "社會科學"],
        courses: [
          { courseCode: "H1", courseName: "哲學概論", assignedBucket: "HUMANITIES", bucketName: "人文學" },
          { courseCode: "S1", courseName: "政治學", assignedBucket: "SOCIAL", bucketName: "社會科學" }
        ],
        missingDistinctDomains: 0
      }
    }
  ]
};

afterEach(() => {
  cleanup();
});

describe("AuditResultView", () => {
  it("shows general education official names, credit ranges, and completed core courses", () => {
    render(<AuditResultView result={baseResult} />);

    expect(screen.getByText("人文學通識")).toBeInTheDocument();
    expect(screen.getByText("社會科學通識")).toBeInTheDocument();
    expect(screen.getByText("7 / 3-7 學分")).toBeInTheDocument();

    expect(screen.getByText("核心通識課程")).toBeInTheDocument();
    expect(screen.getByText("人文學：哲學概論")).toBeInTheDocument();
    expect(screen.getByText("社會科學：政治學")).toBeInTheDocument();
  });

  it("shows imported student academic profile above warnings", () => {
    render(
      <AuditResultView
        result={baseResult}
        studentProfile={{
          major: "金融學系",
          doubleMajor: "統計學系",
          minor: "應用數學系、會計學系",
          ranking: "4 / 75",
          rankingPercent: "5.33 %",
          classRanking: "5 / 75",
          classRankingPercent: "6.67 %",
          averageScore: "94.55",
          cumulativeGpa: "4.21"
        }}
      />
    );

    expect(screen.getByText("學生學籍資訊")).toBeInTheDocument();
    expect(screen.getAllByText("金融學系").length).toBeGreaterThan(0);
    expect(screen.getByText("統計學系")).toBeInTheDocument();
    expect(screen.getByText("應用數學系、會計學系")).toBeInTheDocument();
    expect(screen.getByText(/系排名：4 \/ 75/)).toBeInTheDocument();
    expect(screen.getByText(/班排名：5 \/ 75/)).toBeInTheDocument();
    expect(screen.getAllByText("平均成績").length).toBeGreaterThan(0);
    expect(screen.getAllByText("94.55").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GPA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4.21").length).toBeGreaterThan(0);
  });

  it("keeps action required compact until the user expands missing courses", () => {
    const incompleteResult: AuditResult = {
      ...baseResult,
      graduationEligible: false,
      progressPercentage: 67.2,
      totalCredits: {
        ...baseResult.totalCredits,
        earned: 86,
        missing: 42,
        excludedByRules: 78
      },
      groups: [
        {
          groupCode: "REQUIRED",
          groupName: "系必修",
          status: "INCOMPLETE",
          earnedCredits: 9,
          requiredCredits: 51,
          missingCredits: 42,
          missingCourses: [
            { courseName: "微積分（上學期）" },
            { courseName: "微積分（下學期）" },
            { courseName: "計算機程式" },
            { courseName: "離散數學" },
            { courseName: "高等微積分（上學期）" }
          ]
        },
        {
          groupCode: "ELECTIVE",
          groupName: "其他選修",
          status: "COMPLETE",
          earnedCredits: 45,
          requiredCredits: 45,
          missingCredits: 0,
          uncountedCourses: [
            { courseName: "人工智慧方法與工具" },
            { courseName: "國際金融" }
          ]
        }
      ]
    };

    render(<AuditResultView result={incompleteResult} />);
    const actionPanel = screen.getByText("待處理事項").closest("section") as HTMLElement;

    expect(screen.getByText("缺少必修項目")).toBeInTheDocument();
    expect(screen.getByText("全類別共有 2 門課程不予採計")).toBeInTheDocument();
    expect(within(actionPanel).queryByText("微積分（上學期）")).not.toBeInTheDocument();
    expect(within(actionPanel).queryByText("人工智慧方法與工具")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /缺少必修項目/ }));

    expect(within(actionPanel).getByText("微積分（上學期）")).toBeInTheDocument();
    expect(within(actionPanel).getByText("微積分（下學期）")).toBeInTheDocument();
    expect(within(actionPanel).getByText("計算機程式")).toBeInTheDocument();
    expect(within(actionPanel).getByText("離散數學")).toBeInTheDocument();
    expect(within(actionPanel).getByText("高等微積分（上學期）")).toBeInTheDocument();
  });

  it("labels uncounted courses as cross-category totals and group-specific details", () => {
    const result: AuditResult = {
      ...baseResult,
      graduationEligible: false,
      groups: [
        {
          groupCode: "GENERAL",
          groupName: "通識",
          status: "COMPLETE",
          earnedCredits: 28,
          requiredCredits: 28,
          missingCredits: 0,
          uncountedCourses: [
            { courseName: "通識超修課程", credits: 2, reason: "通識超修部分不得採計" }
          ]
        },
        {
          groupCode: "ELECTIVE",
          groupName: "其他選修",
          status: "COMPLETE",
          earnedCredits: 45,
          requiredCredits: 45,
          missingCredits: 0,
          uncountedCourses: [
            { courseName: "統計機器學習", credits: 3, reason: "其他選修超過 45 學分，不採計為畢業學分" },
            { courseName: "演算法", credits: 3, reason: "其他選修超過 45 學分，不採計為畢業學分" }
          ]
        }
      ]
    };

    render(<AuditResultView result={result} />);
    const actionPanel = screen.getByText("待處理事項").closest("section") as HTMLElement;

    expect(screen.getByText("全類別共有 3 門課程不予採計")).toBeInTheDocument();
    expect(screen.getByText("本群組未採計課程")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /全類別共有 3 門課程不予採計/ }));

    expect(within(actionPanel).getByText("通識課程")).toBeInTheDocument();
    expect(within(actionPanel).getByText("其他選修")).toBeInTheDocument();
    expect(within(actionPanel).getByText("統計機器學習")).toBeInTheDocument();
  });

  it("shows the source course used for a required-course substitution", () => {
    const result: AuditResult = {
      ...baseResult,
      groups: [
        {
          groupCode: "REQUIRED",
          groupName: "系必修",
          status: "INCOMPLETE",
          earnedCredits: 3,
          requiredCredits: 51,
          missingCredits: 48,
          completedRules: [
            {
              courseName: "微積分（上學期）",
              matchedCourseCode: "000219571",
              matchedCourseName: "經濟學",
              countedCredits: 3,
              recognitionType: "APPROVED_SUBSTITUTION",
              substitutedForCourseCode: "701001001"
            }
          ]
        }
      ]
    };

    render(<AuditResultView result={result} />);
    fireEvent.click(screen.getByRole("button", { name: "系必修" }));

    expect(screen.getByText("微積分（上學期）")).toBeInTheDocument();
    expect(screen.getByText("抵免課程：經濟學")).toBeInTheDocument();
    expect(screen.getByText("000219571 → 701001001")).toBeInTheDocument();
  });
});
