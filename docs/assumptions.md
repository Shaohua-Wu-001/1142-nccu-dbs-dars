# Assumptions

1. The system only evaluates NCCU Applied Mathematics major requirements.
2. The supported academic years are 111, 112, 113, and 114.
3. The system uses JWT authentication and backend role/owner authorization. Seeded demo users are still provided for local demos and tests.
4. Transcript input is NCCU JSON, not PDF.
5. Required courses come from `backend/data/courses.xlsx`, sheet `required_courses`.
6. Total graduation credits are 128, evaluated as 51 required + 4 PE + 28 general education + 45 other electives.
7. Linear Algebra is 8 credits in academic years 111-112.
8. Linear Algebra is 6 credits in academic years 113-114, with Mathematics Introduction contributing another 2 required credits.
9. Withdrawn courses are not counted.
10. Courses with no score yet are treated as in progress and are not counted by default.
11. Applied Mathematics students are treated as exempt from the information general education minimum, but information general education can still count up to 3 credits toward the 28-credit general education total.
12. Foreign language exemption cases are represented by imported or manually added equivalent foreign-language courses; the system does not yet parse a separate official English-exemption certificate.
13. Required PE needs four distinct PE courses. Course code and course name must both be distinct.
14. PE elective courses and national defense / military training courses can count toward the 45 other elective credits, with separate caps: PE electives up to 4 credits, and national defense / military training up to 4 credits.
15. The result is for project demonstration and planning only; it does not replace official NCCU graduation review.
16. Cross-domain general education courses may be allocated to one eligible domain by the audit engine. The selected allocation is the one that best satisfies minimum domain requirements, core-domain requirements, and the 28-credit total.
17. Course names alone do not grant foreign-language general education status. Foreign-language recognition must come from `general_courses`, transcript remarks, or a manual staff adjustment.
18. Official audit results count only passed courses. In-progress courses are exposed only through a projected result and do not affect official graduation eligibility.
19. Manual student-course rows are preserved across transcript re-imports and are stored separately from transcript JSON rows.
20. Manual rows with `score = MANUAL` are treated as staff-approved passed courses.
