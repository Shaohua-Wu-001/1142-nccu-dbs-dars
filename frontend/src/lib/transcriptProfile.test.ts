import { describe, expect, it } from "vitest";
import { extractStudentAcademicProfile } from "./transcriptProfile";

describe("extractStudentAcademicProfile", () => {
  it("extracts major, double major, minor, and cumulative ranking from NCCU transcript JSON", () => {
    const transcript = [
      {
        課業學習: {
          aboutMe: {
            chineseName: "Demo Student",
            studentNumber: "DEMO001",
            registerMajor: "金融學系",
            registerDoubleMajor: "統計學系",
            registerMinor: "應用數學系、會計學系"
          },
          totalAverageScore: {
            rankingDepartment: "4 / 75",
            rankingClass: "5 / 75",
            departmentRankPercentage: "5.33 %",
            classRankPercentage: "6.67 %",
            averageScore: "94.55",
            totalCredits: "163"
          },
          averageScoreList: [
            {
              academicYear: "113",
              semester: "2",
              averageScore: "98.41",
              totalCredits: "26",
              rankingDepartment: "3 / 55",
              departmentRankPercentage: "5.45 %",
              rankingClass: "4 / 55",
              classRankPercentage: "7.27 %"
            }
          ],
          gradeRecordList: [
            {
              AcademicYear: "113",
              GradeRecords: [
                { academicYearSemester: "1132", academicYear: "113", semester: "2", courseName: "統計機器學習", credit: "3.0", score: "95.00" },
                { academicYearSemester: "1132", academicYear: "113", semester: "2", courseName: "演算法", credit: "2.0", score: "88.00" },
                { academicYearSemester: "1132", academicYear: "113", semester: "2", courseName: "修課中", credit: "3.0", score: "成績未到或無成績" }
              ]
            }
          ]
        }
      }
    ];

    expect(extractStudentAcademicProfile(transcript)).toEqual({
      studentName: "Demo Student",
      studentNumber: "DEMO001",
      major: "金融學系",
      doubleMajor: "統計學系",
      minor: "應用數學系、會計學系",
      ranking: "4 / 75",
      rankingPercent: "5.33 %",
      classRanking: "5 / 75",
      classRankingPercent: "6.67 %",
      averageScore: "94.55",
      totalCredits: "163",
      cumulativeGpa: "4.18",
      rankings: [
        { label: "系排名", value: "4 / 75", percent: "5.33 %" },
        { label: "班排名", value: "5 / 75", percent: "6.67 %" }
      ],
      semesterSummaries: [
        {
          academicYear: "113",
          semester: "2",
          academicYearSemester: "1132",
          averageScore: "98.41",
          totalCredits: "26",
          gpa: "4.18",
          departmentRanking: "3 / 55",
          departmentRankPercent: "5.45 %",
          classRanking: "4 / 55",
          classRankPercent: "7.27 %"
        }
      ]
    });
  });

  it("returns null when no academic profile fields are available", () => {
    expect(extractStudentAcademicProfile({ 課業學習: { aboutMe: {} } })).toBeNull();
  });
});
