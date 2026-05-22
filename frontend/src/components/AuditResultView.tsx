import { AlertTriangle, BookOpenCheck, CheckCircle2, ChevronDown, Clock3, FileWarning, GraduationCap, Layers3, Medal, Trophy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { formatCredits } from "../lib/status";
import type { StudentAcademicProfile } from "../lib/transcriptProfile";
import type { AuditGroup, AuditResult, StudentCourse } from "../types/api";
import { CreditProgressBar } from "./CreditProgressBar";
import { StatusBadge } from "./StatusBadge";

const GENERAL_BUCKET_DISPLAY_NAMES: Record<string, string> = {
  CHINESE: "中國語文通識課程",
  FOREIGN: "外國語文通識課程",
  HUMANITIES: "人文學通識",
  SOCIAL: "社會科學通識",
  NATURAL: "自然科學通識",
  INFO: "資訊通識",
  COLLEGE: "書院通識"
};

function valueOf(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function recordsOf(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item)) : [];
}

function displayGroupName(group: AuditGroup) {
  return group.groupCode === "GENERAL" ? "通識課程" : group.groupName;
}

function displayGeneralBucketName(bucketCode: string, bucketName: string) {
  return GENERAL_BUCKET_DISPLAY_NAMES[bucketCode] || bucketName;
}

function displayCreditRequirement(minCredits: number, maxCredits: number) {
  if (maxCredits > minCredits) return `${formatCredits(minCredits)}-${formatCredits(maxCredits)}`;
  return formatCredits(minCredits);
}

function displayCoreCourse(course: Record<string, unknown>) {
  const bucketName = String(course.bucketName || course.assignedBucket || "核心領域");
  const courseName = String(course.courseName || course.courseCode || "未命名課程");
  return `${bucketName}：${courseName}`;
}

function groupByCode(result: AuditResult, groupCode: string) {
  return result.groups.find((group) => group.groupCode === groupCode);
}

function percentOf(earned: number, required: number) {
  if (!required) return earned > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (earned / required) * 100));
}

function displayPercent(value: number) {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function ThinProgressBar({ percent, tone = "blue" }: { percent: number; tone?: "blue" | "green" | "purple" | "gold" }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  const toneClass = {
    blue: "bg-navy-800",
    green: "bg-navy-700",
    purple: "bg-navy-700",
    gold: "bg-[#C5A059]"
  }[tone];
  return (
    <div className="h-2 rounded-full bg-slate-200">
      <div className={`h-2 rounded-full ${toneClass}`} style={{ width: `${safePercent}%` }} />
    </div>
  );
}

function statusText(isComplete: boolean) {
  return isComplete ? "完成" : "未完成";
}

function StudentProfileItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-blue-950/5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 min-h-[1.5rem] text-base font-bold text-navy-900">{value || ""}</p>
    </div>
  );
}

function formatRankValue(value?: string, percent?: string) {
  if (!value) return undefined;
  return percent ? `${value}（前 ${percent}）` : value;
}

function formatDepartmentRanking(profile: StudentAcademicProfile) {
  return formatRankValue(profile.ranking, profile.rankingPercent);
}

function formatClassRanking(profile: StudentAcademicProfile) {
  return formatRankValue(profile.classRanking, profile.classRankingPercent);
}

function StudentAcademicProfileCard({ profile }: { profile: StudentAcademicProfile }) {
  const rankPills = [
    { label: "系排名", value: formatDepartmentRanking(profile) },
    { label: "班排名", value: formatClassRanking(profile) }
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-navy-900 p-3 text-white shadow-lg shadow-blue-950/20">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-navy-950">學生學籍資訊</h3>
            <p className="text-sm text-slate-500">由匯入的 NCCU transcript JSON 解析</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {rankPills.length ? rankPills.map((item) => (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-navy-900" key={item.label}>
              <Medal className="h-4 w-4 text-[#C5A059]" />
              {item.label}：{item.value}
            </div>
          )) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-navy-900">
              <Medal className="h-4 w-4 text-[#C5A059]" />
              排名：JSON 未提供
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StudentProfileItem label="主修" value={profile.major} />
        <StudentProfileItem label="雙主修" value={profile.doubleMajor} />
        <StudentProfileItem label="輔修" value={profile.minor} />
        <StudentProfileItem label="平均成績" value={profile.averageScore} />
        <StudentProfileItem label="GPA" value={profile.cumulativeGpa} />
      </div>
    </section>
  );
}

function ResultHero({ result, studentProfile }: { result: AuditResult; studentProfile?: StudentAcademicProfile | null }) {
  const eligible = result.graduationEligible;
  const studentName = studentProfile?.studentName ? `${studentProfile.studentName}，` : "";
  const statusColor = eligible ? "text-navy-950" : "text-[#9f7c31]";
  const StatusIcon = eligible ? CheckCircle2 : AlertTriangle;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
      <div className="relative">
        <div className="flex gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${eligible ? "border-navy-100 bg-navy-50 text-navy-800" : "border-[#C5A059]/25 bg-[#fffaf1] text-[#9f7c31]"}`}>
            <StatusIcon className="h-9 w-9" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C5A059]">Graduation Audit</p>
            <h2 className="mt-2 truncate font-serif text-2xl font-bold text-navy-950 md:text-3xl">
              {studentName}畢業檢核結果：<span className={statusColor}>{eligible ? "已完成" : "尚未完成"}</span>
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
              <span className="whitespace-nowrap">目前採計 {formatCredits(result.totalCredits.earned)} / {formatCredits(result.totalCredits.required)} 學分</span>
              <span className="whitespace-nowrap text-[#9f7c31]">尚缺 {formatCredits(result.totalCredits.missing)} 學分</span>
              <span className="whitespace-nowrap text-xs opacity-70">規則：{result.academicYear} 學年度 / {result.department}</span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap"><Clock3 className="h-4 w-4" />模式 {result.mode}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryProgressCard({ title, group, earned, required, icon, tone }: {
  title: string;
  group?: AuditGroup;
  earned: number;
  required: number;
  icon: ReactNode;
  tone: "blue" | "green" | "purple" | "gold";
}) {
  const progress = percentOf(earned, required);
  const isComplete = group ? group.status === "COMPLETE" : progress >= 100;
  const toneClass = {
    blue: "bg-navy-900 text-white",
    green: "bg-navy-800 text-white",
    purple: "bg-navy-700 text-white",
    gold: "bg-[#C5A059] text-navy-950"
  }[tone];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`shrink-0 rounded-2xl p-2.5 shadow-lg shadow-blue-950/10 ${toneClass}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-navy-950">{title}</p>
            <p className="mt-1 whitespace-nowrap text-lg font-black text-navy-950">
              {formatCredits(earned)} / {formatCredits(required)} 
              <span className="ml-1 text-xs font-bold text-slate-400">學分</span>
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isComplete ? "bg-navy-50 text-navy-700" : "bg-slate-100 text-slate-700"}`}>
          {statusText(isComplete)}
        </span>
      </div>
      <div className="mt-4">
        <ThinProgressBar percent={progress} tone={tone} />
        <p className="mt-1 text-right text-[10px] font-black text-navy-800">{displayPercent(progress)}</p>
      </div>
    </section>
  );
}

function GraduationRing({ progress, eligible }: { progress: number; eligible: boolean }) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full shadow-inner" style={{ background: `conic-gradient(#C5A059 ${safeProgress * 3.6}deg, #e2e8f0 0deg)` }}>
      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-lg shadow-blue-950/10">
        <p className="text-2xl font-black text-navy-950">{displayPercent(safeProgress)}</p>
        <p className="mt-1 text-xs font-bold tracking-[0.16em] text-slate-400">總進度</p>
      </div>
    </div>
  );
}

function GraduationProgressPanel({ result }: { result: AuditResult }) {
  const rows = [
    { label: "必修課程", group: groupByCode(result, "REQUIRED"), required: result.totalCredits.structure.required, tone: "blue" as const },
    { label: "通識課程", group: groupByCode(result, "GENERAL"), required: result.totalCredits.structure.generalEducation, tone: "green" as const },
    { label: "選修課程", group: groupByCode(result, "ELECTIVE"), required: result.totalCredits.structure.elective, tone: "purple" as const },
    { label: "體育課程", group: groupByCode(result, "PE"), required: result.totalCredits.structure.physicalEducation, tone: "blue" as const }
  ].filter((row) => row.group || row.required > 0);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-blue-950/5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="font-serif text-xl font-bold text-navy-950">畢業進度</h3>
        <span className="text-sm font-medium text-slate-500">Graduation Progress</span>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <div className="grid gap-5 lg:grid-cols-[170px_1fr] lg:items-center">
          <GraduationRing progress={result.progressPercentage} eligible={result.graduationEligible} />
          <div className="space-y-2.5">
            {rows.map((row) => {
              const earned = Number(row.group?.earnedCredits || 0);
              const required = Number(row.group?.requiredCredits || row.required || 0);
              const percent = required ? percentOf(earned, required) : 0;
              return (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3" key={row.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="whitespace-nowrap font-bold text-navy-950">{row.label}</p>
                    <p className="whitespace-nowrap text-sm font-bold text-slate-600">
                      {formatCredits(earned)} / {formatCredits(required)}
                      <span className="ml-3 text-navy-900">{required ? displayPercent(percent) : "—"}</span>
                    </p>
                  </div>
                  <ThinProgressBar percent={percent} tone={row.tone} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ActionRequiredItem({ 
  title, 
  tag, 
  icon: Icon, 
  tone, 
  children,
  count
}: { 
  title: string; 
  tag: string; 
  icon: any; 
  tone: "red" | "orange" | "amber" | "purple";
  children?: React.ReactNode;
  count?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasContent = !!children;
  
  const toneClasses = {
    red: "border-slate-200 bg-slate-50 text-navy-900 hover:bg-white",
    orange: "border-slate-200 bg-white text-navy-900 hover:bg-slate-50",
    amber: "border-slate-200 bg-slate-50 text-navy-900 hover:bg-white",
    purple: "border-slate-200 bg-slate-50 text-navy-900 hover:bg-white"
  };

  return (
    <div className={`overflow-hidden rounded-2xl border transition-all ${toneClasses[tone]} ${isOpen ? "ring-1 ring-inset ring-current/10" : ""}`}>
      <button 
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        onClick={() => hasContent && setIsOpen(!isOpen)}
        disabled={!hasContent}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 shadow-sm`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold leading-tight">{title}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-60">{tag}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-black shadow-sm">{count}</span>
          )}
          {hasContent && (
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          )}
        </div>
      </button>
      
      {isOpen && children && (
        <div className="border-t border-current/5 bg-white/40 p-3">
          <div className="space-y-1.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionRequiredPanel({ result }: { result: AuditResult }) {
  const missingItems = result.groups.flatMap((group) => (group.missingCourses || []).map((course) => ({
    name: String(course.courseName || group.groupName),
    tag: group.groupName,
    code: Array.isArray(course.acceptedCourseCodes) ? course.acceptedCourseCodes.join("、") : ""
  })));

  const uncountedGroups = result.groups
    .map((group) => ({
      groupName: displayGroupName(group),
      courses: (group.uncountedCourses || []).map((course) => ({
        name: String(course.courseName || "未知課程"),
        credits: String(course.credits || "0"),
        reason: String(course.reason || "不符採計規則")
      }))
    }))
    .filter((group) => group.courses.length > 0);
  const uncountedCount = uncountedGroups.reduce((sum, group) => sum + group.courses.length, 0);

  const hasMissing = missingItems.length > 0;
  const hasUncounted = uncountedCount > 0;
  const hasCreditsMissing = result.totalCredits.missing > 0;
  const hasWarnings = result.warnings.length > 0;

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-blue-950/5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-navy-950">待處理事項</h3>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Action Required</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fffaf1] text-[#9f7c31] shadow-inner">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-3">
        {hasMissing && (
          <ActionRequiredItem 
            title="缺少必修項目" 
            tag="核心學分" 
            icon={BookOpenCheck} 
            tone="red" 
            count={missingItems.length}
          >
            {missingItems.map((item, i) => (
              <div key={i} className="rounded-xl bg-white/60 p-3 text-sm shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <span className="text-[10px] font-black text-slate-400">{item.tag}</span>
                </div>
                {item.code && <p className="mt-1 text-xs font-medium text-slate-500">課號：{item.code}</p>}
              </div>
            ))}
          </ActionRequiredItem>
        )}

        {hasCreditsMissing && (
          <ActionRequiredItem 
            title={`尚缺 ${formatCredits(result.totalCredits.missing)} 學分`} 
            tag="畢業門檻" 
            icon={Trophy} 
            tone="orange"
          >
            <div className="rounded-xl bg-white/60 p-3 text-sm shadow-sm">
              <p className="font-medium text-slate-600">
                目前已採計 <span className="font-black text-navy-950">{formatCredits(result.totalCredits.earned)}</span> 學分，
                距離畢業門檻還差 <span className="font-black text-[#9f7c31]">{formatCredits(result.totalCredits.missing)}</span> 學分。
              </p>
            </div>
          </ActionRequiredItem>
        )}

        {hasUncounted && (
          <ActionRequiredItem 
            title={`全類別共有 ${uncountedCount} 門課程不予採計`} 
            tag="學分核算" 
            icon={FileWarning} 
            tone="amber"
            count={uncountedCount}
          >
            {uncountedGroups.map((group) => (
              <div key={group.groupName} className="rounded-xl bg-white/50 p-2 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <p className="text-xs font-black text-slate-500">{group.groupName}</p>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-black text-navy-700">{group.courses.length} 門</span>
                </div>
                <div className="space-y-1.5">
                  {group.courses.map((course, i) => (
                    <div key={`${group.groupName}-${course.name}-${i}`} className="rounded-lg bg-white/70 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800">{course.name}</p>
                        <span className="text-[10px] font-black text-navy-700">{course.credits} 學分</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-400">原因：{course.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ActionRequiredItem>
        )}

        {hasWarnings && (
          <ActionRequiredItem 
            title="系統提醒事項" 
            tag="重要說明" 
            icon={AlertTriangle} 
            tone="purple"
          >
            {result.warnings.map((warning, i) => (
              <div key={i} className="rounded-xl bg-white/60 p-3 text-sm shadow-sm">
                <p className="font-medium leading-relaxed text-slate-600">{warning}</p>
              </div>
            ))}
          </ActionRequiredItem>
        )}

        {!hasMissing && !hasCreditsMissing && !hasUncounted && !hasWarnings && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-serif text-lg font-bold text-navy-950">完美狀態</p>
            <p className="text-sm font-medium text-slate-400">目前沒有需要處理的事項</p>
          </div>
        )}
      </div>
    </section>
  );
}

function CompactRows({ rows, keys }: { rows: Array<Record<string, unknown>>; keys: string[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500">無資料</p>;
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>{keys.map((key) => <th className="px-3 py-2" key={key}>{key}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={index}>
              {keys.map((key) => <td className="px-3 py-2 text-slate-700" key={key}>{valueOf(row, key)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function courseTitle(course: Record<string, unknown>) {
  return String(course.courseName || course.course_name || course.matchedCourseName || course.courseCode || "未命名課程");
}

function courseCode(course: Record<string, unknown>) {
  return String(course.courseCode || course.course_code || course.matchedCourseCode || "—");
}

function courseCredits(course: Record<string, unknown>) {
  return String(course.countedCredits || course.credits || course.requiredCredits || "0");
}

function CoursePillList({ courses }: { courses: Array<Record<string, unknown>> }) {
  if (!courses.length) return <p className="text-sm font-semibold text-slate-400">目前沒有採計課程</p>;
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course, index) => (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" key={`${courseCode(course)}-${courseTitle(course)}-${index}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-navy-950">{courseTitle(course)}</p>
            <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-black text-navy-700">{formatCredits(courseCredits(course))} 學分</span>
          </div>
          <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{courseCode(course)}</p>
          {course.assignedBucket || course.category ? (
            <p className="mt-1 text-xs font-semibold text-slate-500">{String(course.category || course.assignedBucket)}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RequiredCompletedRules({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) return null;
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {rows.map((row, index) => {
        const targetName = String(row.courseName || "必修課程");
        const sourceName = String(row.matchedCourseName || row.matchedCourseCode || "採用課程");
        const sourceCode = String(row.matchedCourseCode || "—");
        const substitutedCode = String(row.substitutedForCourseCode || "");
        const isSubstitution = row.recognitionType === "APPROVED_SUBSTITUTION";
        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" key={`${targetName}-${sourceCode}-${index}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-navy-950">{targetName}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {isSubstitution ? "抵免課程：" : "採計課程："}{sourceName}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
                  {sourceCode}{isSubstitution && substitutedCode ? ` → ${substitutedCode}` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-black text-navy-700">
                {formatCredits(valueOf(row, "countedCredits"))} 學分
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupPanel({ group }: { group: AuditGroup }) {
  const coreCourses = recordsOf(group.coreRequirement?.courses);
  const earnedDomains = Array.isArray(group.coreRequirement?.earnedDomains) ? group.coreRequirement.earnedDomains : [];
  const groupCourses = recordsOf(group.courses);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-navy-900">{displayGroupName(group)}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {formatCredits(group.earnedCredits)} / {formatCredits(group.requiredCredits)} 學分
            {group.missingCredits > 0 ? `，尚缺 ${formatCredits(group.missingCredits)} 學分` : ""}
          </p>
        </div>
        <StatusBadge value={group.status} />
      </div>
      <CreditProgressBar value={Number(group.earnedCredits || 0)} max={Number(group.requiredCredits || 1)} />
      {group.missingCourses?.length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-red-700">缺少項目</p>
          <CompactRows rows={group.missingCourses} keys={["courseName", "requiredCredits", "acceptedCourseCodes"]} />
        </div>
      ) : null}
      {group.completedRules?.length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">已完成規則</p>
          {group.groupCode === "REQUIRED"
            ? <RequiredCompletedRules rows={group.completedRules} />
            : <CompactRows rows={group.completedRules} keys={["courseName", "matchedCourseCode", "countedCredits", "recognitionType"]} />}
        </div>
      ) : null}
      {groupCourses.length && group.groupCode !== "GENERAL" ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-navy-900">已採計課程</p>
          <CoursePillList courses={groupCourses} />
        </div>
      ) : null}
      {group.requirements?.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {group.requirements.map((item) => (
            <div className="rounded-lg border border-slate-200 p-3" key={item.bucketCode}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-navy-900">{displayGeneralBucketName(item.bucketCode, item.bucketName)}</p>
                <StatusBadge value={item.status} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {formatCredits(item.earnedCredits)} / {displayCreditRequirement(item.minCredits, item.maxCredits)} 學分
              </p>
              {recordsOf(item.courses).length ? (
                <div className="mt-3 space-y-2">
                  {recordsOf(item.courses).map((course, index) => (
                    <div className="rounded-lg bg-slate-50 px-3 py-2" key={`${item.bucketCode}-${courseCode(course)}-${index}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-navy-950">{courseTitle(course)}</p>
                        <span className="shrink-0 text-xs font-black text-navy-700">{formatCredits(courseCredits(course))} 學分</span>
                      </div>
                      <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{courseCode(course)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {group.coreRequirement ? (
        <div className="mt-4 rounded-lg border border-navy-100 bg-navy-50 p-4 text-sm text-navy-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">核心通識課程</p>
            <StatusBadge value={String(group.coreRequirement.status || "INCOMPLETE")} />
          </div>
          <p className="mt-2">
            已完成 {valueOf(group.coreRequirement, "earnedDistinctDomains")} / {valueOf(group.coreRequirement, "requiredDistinctDomains")} 個不同領域
          </p>
          {coreCourses.length ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {coreCourses.map((course, index) => (
                <div className="rounded-md border border-navy-100 bg-white px-3 py-2 font-medium text-navy-900" key={`${String(course.courseCode || course.courseName || index)}-${index}`}>
                  {displayCoreCourse(course)}
                </div>
              ))}
            </div>
          ) : earnedDomains.length ? (
            <p className="mt-2 text-slate-600">已完成領域：{earnedDomains.join("、")}</p>
          ) : null}
        </div>
      ) : null}
      {group.uncountedCourses?.length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-amber-700">本群組未採計課程</p>
          <CompactRows rows={group.uncountedCourses} keys={["courseCode", "courseName", "credits", "reason"]} />
        </div>
      ) : null}
      {group.notes?.length ? (
        <ul className="mt-4 space-y-1 text-sm text-slate-500">
          {group.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

function PendingCoursesPanel({ courses }: { courses: StudentCourse[] }) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
        <p className="font-semibold text-slate-700">沒有待確認課程</p>
        <p className="mt-1 text-sm text-slate-400">所有課程均已完成分類</p>
      </div>
    );
  }
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">這些課程尚未完成分類，需要管理員人工確認</p>
        <p className="mt-1 text-amber-700">請聯繫系辦或等待管理員透過「人工調整」頁面完成認列，審核完成後課程將歸入對應類別。</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400">
              <th className="pb-2 pr-4">課程代碼</th>
              <th className="pb-2 pr-4">課程名稱</th>
              <th className="pb-2 pr-4">學分</th>
              <th className="pb-2 pr-4">學年/學期</th>
              <th className="pb-2">成績</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {courses.map((course) => (
              <tr key={`${course.course_code}-${course.academic_year}-${course.semester}`} className="py-2">
                <td className="py-2 pr-4 font-mono text-xs text-slate-500">{course.course_code}</td>
                <td className="py-2 pr-4 font-medium text-slate-800">{course.course_name}</td>
                <td className="py-2 pr-4 text-slate-600">{course.credits}</td>
                <td className="py-2 pr-4 text-slate-500">{course.academic_year}/{course.semester}</td>
                <td className="py-2 text-slate-600">{course.score ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AuditResultView({ result, studentProfile, unresolvedCourses }: { result: AuditResult; studentProfile?: StudentAcademicProfile | null; unresolvedCourses?: StudentCourse[] }) {
  const [mode, setMode] = useState<"official" | "projected">("official");
  const active = mode === "projected" && result.projectedResult ? result.projectedResult : result;
  const requiredGroup = groupByCode(active, "REQUIRED");
  const generalGroup = groupByCode(active, "GENERAL");
  const electiveGroup = groupByCode(active, "ELECTIVE");
  const totalGroup = groupByCode(active, "TOTAL");
  const tabGroups = active.groups.filter((group) => ["REQUIRED", "GENERAL", "ELECTIVE", "PE", "TOTAL"].includes(group.groupCode));
  const pendingCount = unresolvedCourses?.length ?? 0;
  const defaultTab = tabGroups.find((group) => group.groupCode === "GENERAL") || tabGroups[0] || null;
  const [selectedGroupCode, setSelectedGroupCode] = useState(defaultTab?.groupCode || "");
  const selectedGroup = tabGroups.find((group) => group.groupCode === selectedGroupCode) || defaultTab;

  return (
    <div className="space-y-5">
      {result.projectedResult ? (
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm shadow-blue-950/5">
          <button className={`rounded-xl px-5 py-2 text-sm font-bold transition ${mode === "official" ? "bg-navy-900 text-white shadow-lg shadow-blue-950/20" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setMode("official")}>正式結果</button>
          <button className={`rounded-xl px-5 py-2 text-sm font-bold transition ${mode === "projected" ? "bg-navy-900 text-white shadow-lg shadow-blue-950/20" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setMode("projected")}>預估結果</button>
        </div>
      ) : null}
      <ResultHero result={active} studentProfile={studentProfile} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CategoryProgressCard title="必修課程" group={requiredGroup} earned={Number(requiredGroup?.earnedCredits || 0)} required={Number(requiredGroup?.requiredCredits || active.totalCredits.structure.required)} icon={<BookOpenCheck className="h-6 w-6" />} tone="blue" />
        <CategoryProgressCard title="通識課程" group={generalGroup} earned={Number(generalGroup?.earnedCredits || 0)} required={Number(generalGroup?.requiredCredits || active.totalCredits.structure.generalEducation)} icon={<GraduationCap className="h-6 w-6" />} tone="green" />
        <CategoryProgressCard title="選修課程" group={electiveGroup} earned={Number(electiveGroup?.earnedCredits || 0)} required={Number(electiveGroup?.requiredCredits || active.totalCredits.structure.elective)} icon={<Layers3 className="h-6 w-6" />} tone="purple" />
        <CategoryProgressCard title="畢業總學分" group={totalGroup} earned={Number(active.totalCredits.earned || 0)} required={Number(active.totalCredits.required || 0)} icon={<Trophy className="h-6 w-6" />} tone="gold" />
      </div>
      {studentProfile ? <StudentAcademicProfileCard profile={studentProfile} /> : null}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <GraduationProgressPanel result={active} />
        <ActionRequiredPanel result={active} />
      </div>
      {tabGroups.length || unresolvedCourses ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {tabGroups.map((group) => (
              <button
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${selectedGroupCode === group.groupCode ? "bg-navy-900 text-white shadow-lg shadow-blue-950/20" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-navy-900"}`}
                key={group.groupCode}
                onClick={() => setSelectedGroupCode(group.groupCode)}
              >
                {displayGroupName(group)}
              </button>
            ))}
            {unresolvedCourses ? (
              <button
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition ${selectedGroupCode === "PENDING" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                onClick={() => setSelectedGroupCode("PENDING")}
              >
                待確認
                {pendingCount > 0 ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${selectedGroupCode === "PENDING" ? "bg-white/20 text-white" : "bg-amber-200 text-amber-800"}`}>{pendingCount}</span>
                ) : null}
              </button>
            ) : null}
          </div>
          {selectedGroupCode === "PENDING" && unresolvedCourses ? (
            <PendingCoursesPanel courses={unresolvedCourses} />
          ) : selectedGroup ? (
            <GroupPanel group={selectedGroup} />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
