import { ChangeEvent, type ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Award, BarChart3, BookOpen, ChevronDown, ClipboardCheck, Download, ExternalLink, FileInput, GraduationCap, History, Info, Sparkles } from "lucide-react";
import { useAuditHistory, useAuditHistoryDetail, useImportTranscript, useRunAudit, useStudentCourses } from "../api/hooks";
import { AuditResultView } from "../components/AuditResultView";
import { MetricTile } from "../components/MetricTile";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import { formatCredits } from "../lib/status";
import { extractStudentAcademicProfile, type SemesterAcademicSummary, type StudentRanking } from "../lib/transcriptProfile";
import { useAppState } from "../state/AppState";

function StudentSummaryItem({ label, value, detail, icon, className = "" }: { label: string; value: string; detail?: string; icon?: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-blue-950/5 ${className}`}>
      {icon ? <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-800">{icon}</div> : null}
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-1 whitespace-nowrap text-lg font-black leading-tight text-navy-950 2xl:text-xl">{value}</p>
        {detail ? <p className="mt-1 text-sm font-semibold leading-snug text-slate-500">{detail}</p> : null}
      </div>
    </div>
  );
}

function rankingText(label: string, value?: string, percent?: string) {
  if (!value) return undefined;
  return percent ? `${label} ${value}（前 ${percent}）` : `${label} ${value}`;
}

function semesterLabel(summary: SemesterAcademicSummary) {
  return `${summary.academicYear}-${summary.semester}`;
}

function semesterSortValue(summary: SemesterAcademicSummary) {
  return Number(`${summary.academicYear}${summary.semester}`) || 0;
}

function parseNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rankingParts(value?: string) {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const rank = Number(match[1]);
  const total = Number(match[2]);
  if (!Number.isFinite(rank) || !Number.isFinite(total) || total <= 0) return null;
  return { rank, total };
}

function rankingPerformance(value?: string) {
  const parts = rankingParts(value);
  if (!parts) return null;
  return ((parts.total - parts.rank + 1) / parts.total) * 100;
}

function scaleSeries(values: number[], top = 44, bottom = 164) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return (value: number) => bottom - ((value - min) / range) * (bottom - top);
}

function TrendChartCard({ title, meta, ariaLabel, values, valueLabel, lineColor, markerColor, dashed = false }: {
  title: string;
  meta: string;
  ariaLabel: string;
  values: Array<{ label: string; value: number; display: string }>;
  valueLabel: string;
  lineColor: string;
  markerColor: string;
  dashed?: boolean;
}) {
  if (values.length < 2) return <p className="text-sm font-semibold text-slate-500">{title}至少需要兩個學期才會顯示折線趨勢。</p>;
  const chart = { width: 920, height: 320, left: 76, right: 844, top: 72, bottom: 232 };
  const yOf = scaleSeries(values.map((item) => item.value), chart.top, chart.bottom);
  const xOf = (index: number) => chart.left + (index * (chart.right - chart.left)) / (values.length - 1);
  const points = values.map((item, index) => ({ ...item, x: xOf(index), y: yOf(item.value) }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-sm shadow-blue-950/5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-black text-navy-950">
          <span className="h-3 w-8 rounded-full" style={{ backgroundColor: lineColor }} />
          {title}
        </span>
        <p className="text-[11px] font-bold text-slate-500 sm:text-sm">{meta}</p>
      </div>
      <div className="relative w-full overflow-hidden">
        <svg 
          className="h-auto w-full" 
          viewBox={`0 0 ${chart.width} ${chart.height}`} 
          preserveAspectRatio="xMidYMid meet"
          role="img" 
          aria-label={ariaLabel}
        >
          {[chart.top, (chart.top + chart.bottom) / 2, chart.bottom].map((y) => (
            <line key={y} x1={chart.left} x2={chart.right} y1={y} y2={y} stroke="#e6edf5" strokeWidth="2" />
          ))}
          <polyline fill="none" points={polyline} stroke={lineColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" strokeDasharray={dashed ? "12 10" : undefined} />
          {points.map((point) => (
            <g key={`${title}-${point.label}`}>
              <circle cx={point.x} cy={point.y} fill={markerColor} r="10" />
              <text fill="#0b1d38" fontSize="20" fontWeight="900" textAnchor="middle" x={point.x} y={point.y < chart.top + 22 ? point.y + 36 : point.y - 20}>{point.display}</text>
              <text fill="#64748b" fontSize="18" fontWeight="900" textAnchor="middle" x={point.x} y="295">{point.label}</text>
            </g>
          ))}
          <text fill="#94a3b8" fontSize="14" fontWeight="800" x={chart.left} y="32">{valueLabel}</text>
        </svg>
      </div>
    </div>
  );
}

function letterGrade(score?: string | null) {
  const numeric = parseNumber(score);
  if (numeric === null) return undefined;
  if (numeric >= 90) return "A+";
  if (numeric >= 85) return "A";
  if (numeric >= 80) return "A-";
  if (numeric >= 77) return "B+";
  if (numeric >= 73) return "B";
  if (numeric >= 70) return "B-";
  if (numeric >= 67) return "C+";
  if (numeric >= 63) return "C";
  if (numeric >= 60) return "C-";
  if (numeric >= 50) return "D";
  if (numeric >= 1) return "E";
  return "X";
}

function formatScoreWithLetter(score?: string | null) {
  if (!score) return "—";
  const grade = letterGrade(score);
  return grade ? `${score} / ${grade}` : score;
}

function SemesterTrendChart({ summaries }: { summaries: SemesterAcademicSummary[] }) {
  const data = summaries
    .map((summary) => ({
      summary,
      score: parseNumber(summary.averageScore),
      rankPerformance: rankingPerformance(summary.departmentRanking || summary.classRanking)
    }))
    .filter((item): item is { summary: SemesterAcademicSummary; score: number; rankPerformance: number | null } => item.score !== null)
    .sort((a, b) => semesterSortValue(a.summary) - semesterSortValue(b.summary));
  if (data.length < 2) return <p className="text-sm font-semibold text-slate-500">至少需要兩個學期才會顯示折線趨勢。</p>;

  const scores = data.map((item) => item.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const scoreData = data.map((item) => ({ label: semesterLabel(item.summary), value: item.score, display: item.score.toFixed(1) }));
  
  const rankData = data
    .filter((item): item is typeof item & { rankPerformance: number } => item.rankPerformance !== null)
    .map((item) => ({
      label: semesterLabel(item.summary),
      value: item.rankPerformance,
      display: item.summary.departmentRanking || item.summary.classRanking || item.rankPerformance.toFixed(1)
    }));

  const firstRank = rankData[0];
  const lastRank = rankData[rankData.length - 1];
  const improvement = rankData.length >= 2 ? lastRank.value - firstRank.value : 0;
  const rankTrendText = rankData.length >= 2
    ? `從 ${firstRank.display} 進步到 ${lastRank.display}，表現躍升 ${improvement.toFixed(1)}%`
    : "排名資料不足";

  return (
    <div className="grid gap-4">
      <TrendChartCard title="平均成績趨勢" meta={`最低 ${min.toFixed(2)} / 最高 ${max.toFixed(2)}`} ariaLabel="平均成績折線圖" values={scoreData} valueLabel="Average Score" lineColor="#0a3a75" markerColor="#C5A059" />
      <TrendChartCard title="排名表現趨勢" meta={rankTrendText} ariaLabel="排名表現折線圖" values={rankData} valueLabel="Ranking Performance" lineColor="#C5A059" markerColor="#0a3a75" dashed />
    </div>
  );
}

function InfoTip({ label, text }: { label: string; text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        aria-label={label}
        className="ml-2 grid h-5 w-5 place-items-center rounded-full border border-navy-200 bg-blue-50 text-[11px] font-black text-navy-800"
        title={text}
        type="button"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600 shadow-xl shadow-blue-950/10 group-hover:block">
        {text}
      </span>
    </span>
  );
}

function SemesterSummaryStrip({ summaries }: { summaries?: SemesterAcademicSummary[] }) {
  const [showChart, setShowChart] = useState(true);
  if (!summaries?.length) return null;
  return (
    <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-navy-800">
            <BarChart3 className="h-5 w-5" />
          </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-navy-950">學期成績摘要</h2>
          <p className="text-sm font-medium text-slate-500">由 transcript JSON 的 averageScoreList 解析</p>
        </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-navy-900 transition hover:bg-blue-50"
          onClick={() => setShowChart((value) => !value)}
          type="button"
        >
          {showChart ? "收合趨勢圖" : "查看趨勢圖"}
          <ChevronDown className={`h-4 w-4 transition ${showChart ? "rotate-180" : ""}`} />
        </button>
      </div>
      {showChart ? <div className="mb-4"><SemesterTrendChart summaries={summaries} /></div> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaries.map((summary) => (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={summary.academicYearSemester}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-black text-navy-950">{semesterLabel(summary)}</p>
              <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-black text-slate-500">{summary.totalCredits || "—"} 學分</span>
            </div>
            <p className="mt-3 text-2xl font-black text-navy-950">{summary.averageScore || "—"}</p>
            <p className="text-sm font-bold text-[#9f7c31]">GPA {summary.gpa || "—"}</p>
            <div className="mt-3 space-y-1 text-xs font-bold text-slate-500">
              {summary.departmentRanking ? <p>系排名 {summary.departmentRanking}</p> : null}
              {summary.classRanking ? <p>班排名 {summary.classRanking}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StudentDashboard() {
  const { currentUser, studentProfile } = useAppState();
  const history = useAuditHistory(currentUser.id);
  const studentName = studentProfile?.studentName || currentUser.name;
  const studentNumber = studentProfile?.studentNumber || currentUser.student_number;
  const latestAudit = useMemo(() => (history.data?.rows || []).reduce((current, row) => {
    if (!current) return row;
    return row.id > current.id ? row : current;
  }, null as NonNullable<typeof history.data>["rows"][number] | null), [history.data?.rows]);
  const visibleLatestAudit = studentProfile ? latestAudit : null;
  const fallbackRankings: StudentRanking[] = [];
  if (studentProfile?.ranking) fallbackRankings.push({ label: "系排名", value: studentProfile.ranking, percent: studentProfile.rankingPercent });
  if (studentProfile?.classRanking) fallbackRankings.push({ label: "班排名", value: studentProfile.classRanking, percent: studentProfile.classRankingPercent });
  const rankings = studentProfile?.rankings?.length ? studentProfile.rankings : fallbackRankings;
  const ranking = rankings[0]?.value || "未匯入";
  const rankingDetail = rankings.map((item) => rankingText(item.label, item.value, item.percent)).filter(Boolean).join(" / ") || "等待 JSON 資料";
  const averageWithGpa = studentProfile?.averageScore
    ? `${studentProfile.averageScore}${studentProfile.cumulativeGpa ? ` / GPA ${studentProfile.cumulativeGpa}` : ""}`
    : "未匯入";

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-[#C5A059]/25 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C5A059]">Student Dashboard</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-navy-950">學生端總覽</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">從 transcript 匯入開始，執行畢業審核並查看結果與歷史紀錄。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs font-bold tracking-[0.16em] text-slate-400">最新審核</p>
              <p className="mt-1 text-xl font-black text-navy-950">{visibleLatestAudit ? `${formatCredits(visibleLatestAudit.progress_percentage)}%` : "尚無"}</p>
              <p className="text-xs font-semibold text-slate-500">{visibleLatestAudit ? `Audit #${visibleLatestAudit.id}` : "匯入 JSON 後顯示"}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            <StudentSummaryItem className="xl:col-span-3" label="目前學生" value={studentName} detail={`學號 ${studentNumber}`} icon={<BookOpen className="h-5 w-5" />} />
            <StudentSummaryItem className="xl:col-span-3" label="主修" value={studentProfile?.major || "JSON 匯入後顯示"} detail={studentProfile?.doubleMajor ? `雙主修 ${studentProfile.doubleMajor}` : "學籍資料"} icon={<GraduationCap className="h-5 w-5" />} />
            <StudentSummaryItem className="xl:col-span-3" label="Ranking" value={ranking} detail="系排名與班排名列於下方" icon={<Award className="h-5 w-5" />} />
            <StudentSummaryItem className="xl:col-span-3" label="平均成績" value={averageWithGpa} detail="Transcript total average" icon={<Sparkles className="h-5 w-5" />} />
          </div>
          {rankings.length ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {rankings.map((item) => (
                <span className="rounded-full border border-[#C5A059]/30 bg-[#fffaf1] px-4 py-2 text-sm font-black text-navy-900" key={item.label}>
                  {rankingText(item.label, item.value, item.percent)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-[#C5A059]/40 hover:shadow-xl" to="/student/import">
          <FileInput className="mb-4 h-7 w-7 text-navy-700" />
          <p className="font-bold text-navy-950">上傳資料</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">匯入 NCCU JSON 成績資料</p>
          <ArrowRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-navy-800" />
        </Link>
        <Link className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-[#C5A059]/40 hover:shadow-xl" to="/student/audit/run">
          <ClipboardCheck className="mb-4 h-7 w-7 text-navy-700" />
          <p className="font-bold text-navy-950">執行畢業審核</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">依 51 + 4 + 28 + 45 規則計算</p>
          <ArrowRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-navy-800" />
        </Link>
        <Link className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-[#C5A059]/40 hover:shadow-xl" to="/student/audit/result">
          <BookOpen className="mb-4 h-7 w-7 text-navy-700" />
          <p className="font-bold text-navy-950">查看檢核結果</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">以 dashboard 方式看缺漏與採計項目</p>
          <ArrowRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-navy-800" />
        </Link>
        <Link className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-[#C5A059]/40 hover:shadow-xl" to="/student/audit/history">
          <History className="mb-4 h-7 w-7 text-navy-700" />
          <p className="font-bold text-navy-950">歷史紀錄</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">回看每一次畢業審核結果</p>
          <ArrowRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-navy-800" />
        </Link>
      </div>
    </div>
  );
}

export function StudentImportPage() {
  const { currentUser, setStudentProfile, studentProfile } = useAppState();
  const mutation = useImportTranscript(currentUser.id);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const studentName = studentProfile?.studentName || currentUser.name;

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    try {
      const text = await file.text();
      const transcript = JSON.parse(text);
      setStudentProfile(extractStudentAcademicProfile(transcript));
      mutation.mutate({ transcript, sourceFilename: file.name });
    } catch (_error) {
      setParseError("JSON 格式無法解析，請確認檔案內容。");
    }
  }

  return (
    <div>
      <PageHeader
        title="Transcript JSON 匯入"
        description="前端會先解析本機 JSON，再送到現有後端 transcript import API。"
        actions={(
          <a
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-navy-950"
            href="https://i.nccu.edu.tw/Login.aspx?ReturnUrl=%2f"
            rel="noreferrer"
            target="_blank"
          >
            前往 iNCCU 下載 JSON
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      />
      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-navy-800">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy-950">如何下載 JSON</h2>
            <p className="text-sm font-medium text-slate-500">從 iNCCU 匯出課業學習資料後，再回本頁上傳。</p>
          </div>
        </div>
        <div>
          <div className="grid gap-3 md:grid-cols-5">
          {["登入 iNCCU", "進入「我的全人」", "點選「資料格式化匯出」", "勾選「課業學習」後點選「下載」", "回本頁選擇 JSON 檔"].map((step, index) => (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3" key={step}>
              <span className="mb-2 grid h-7 w-7 place-items-center rounded-full bg-navy-900 text-xs font-black text-white">{index + 1}</span>
              <p className="text-xs font-black leading-5 text-navy-950 xl:text-sm">{step}</p>
            </div>
          ))}
          </div>
        </div>
      </section>
      <div className="rounded-lg border border-dashed border-navy-200 bg-white p-8 text-center">
        <FileInput className="mx-auto h-12 w-12 text-navy-700" />
        <p className="mt-4 font-bold text-navy-900">選擇 transcript.json</p>
        <p className="mt-1 text-sm text-slate-500">目前使用者：{studentName} / userId {currentUser.id}</p>
        <label className="mt-5 inline-flex cursor-pointer rounded-md bg-navy-800 px-4 py-3 text-sm font-bold text-white hover:bg-navy-900">
          選擇檔案
          <input className="hidden" type="file" accept="application/json,.json" onChange={onFileChange} />
        </label>
        {fileName ? <p className="mt-3 text-sm text-slate-500">{fileName}</p> : null}
      </div>
      {parseError ? <div className="mt-4"><ErrorState message={parseError} /></div> : null}
      {mutation.isPending ? <div className="mt-4"><LoadingState label="正在匯入 transcript" /></div> : null}
      {mutation.error ? <div className="mt-4"><ErrorState message={mutation.error.message} /></div> : null}
      {mutation.data ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricTile label="匯入課程" value={mutation.data.importedCourses} />
          <MetricTile label="已通過" value={mutation.data.passedCourses} />
          <MetricTile label="修課中" value={mutation.data.inProgressCourses} />
          <MetricTile label="停修" value={mutation.data.withdrawnCourses} />
          <MetricTile label="待確認" value={mutation.data.unresolvedCourseCount} />
        </div>
      ) : null}
    </div>
  );
}

export function StudentCoursesPage() {
  const { currentUser, studentProfile } = useAppState();
  const [keyword, setKeyword] = useState("");
  const courses = useStudentCourses(currentUser.id);
  const rows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return (courses.data || []).filter((course) => !normalized
      || course.course_code.toLowerCase().includes(normalized)
      || course.course_name.toLowerCase().includes(normalized));
  }, [courses.data, keyword]);

  return (
    <div>
      <PageHeader
        title="我的修課資料"
        description="資料來源包含 transcript 匯入與管理員人工調整。"
        actions={<input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="搜尋課號或課名" value={keyword} onChange={(event) => setKeyword(event.target.value)} />}
      />
      {courses.isLoading ? <LoadingState /> : null}
      {courses.error ? <ErrorState message={courses.error.message} /> : null}
      <SemesterSummaryStrip summaries={studentProfile?.semesterSummaries} />
      {rows.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2">學年期</th>
                  <th className="whitespace-nowrap px-3 py-2">課號</th>
                  <th className="whitespace-nowrap px-3 py-2">課名</th>
                  <th className="whitespace-nowrap px-3 py-2">學分</th>
                  <th className="whitespace-nowrap px-3 py-2">成績/等第</th>
                  <th className="whitespace-nowrap px-3 py-2">狀態</th>
                  <th className="whitespace-nowrap px-3 py-2">來源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((course) => (
                  <tr key={course.id}>
                    <td className="whitespace-nowrap px-3 py-2">{course.academic_year_semester}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-navy-800">{course.course_code}</td>
                    <td className="whitespace-nowrap px-3 py-2">{course.course_name}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatCredits(course.credits)}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-navy-900">{formatScoreWithLetter(course.score)}</td>
                    <td className="whitespace-nowrap px-3 py-2"><StatusBadge value={course.status} /></td>
                    <td className="whitespace-nowrap px-3 py-2"><StatusBadge value={course.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !courses.isLoading ? <EmptyState title="尚無修課資料" description="請先匯入 transcript JSON。" /> : null}
    </div>
  );
}

export function AuditRunPage() {
  const { currentUser, setLastAuditResult } = useAppState();
  const [academicYear, setAcademicYear] = useState("111");
  const [includeInProgress, setIncludeInProgress] = useState(false);
  const [saveResult, setSaveResult] = useState(true);
  const mutation = useRunAudit();
  const navigate = useNavigate();

  function runAudit() {
    mutation.mutate({ userId: currentUser.id, academicYear, includeInProgress, saveResult }, {
      onSuccess(result) {
        setLastAuditResult(result);
        navigate("/student/audit/result");
      }
    });
  }

  return (
    <div>
      <PageHeader title="執行畢業審核" description="正式結果只採計已通過課程；修課中課程只會出現在預估結果。" />
      <div className="max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          <label className="text-sm font-semibold text-slate-700">學年度
            <InfoTip label="學年度說明" text="依你的入學年度或適用畢業規則年度選擇；例如 111 入學就選 111。" />
            <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
              <option value="111">111</option>
              <option value="112">112</option>
              <option value="113">113</option>
              <option value="114">114</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={includeInProgress} onChange={(event) => setIncludeInProgress(event.target.checked)} />
            包含修課中課程作為預估
            <InfoTip label="修課中預估說明" text="勾選後會另外產生預估結果，用來查看修課中課程如果都通過時的畢業進度；正式結果仍只採計已通過課程。" />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={saveResult} onChange={(event) => setSaveResult(event.target.checked)} />
            儲存審核紀錄
            <InfoTip label="儲存審核紀錄說明" text="勾選會將本次審核寫入歷史紀錄；不勾則只顯示本次結果，不保存到歷史紀錄。" />
          </label>
          <button className="rounded-md bg-navy-800 px-4 py-3 text-sm font-bold text-white hover:bg-navy-900" onClick={runAudit} disabled={mutation.isPending}>
            {mutation.isPending ? "審核中..." : "執行審核"}
          </button>
        </div>
      </div>
      {mutation.error ? <div className="mt-4"><ErrorState message={mutation.error.message} /></div> : null}
    </div>
  );
}

export function AuditResultPage() {
  const { lastAuditResult, studentProfile } = useAppState();
  return (
    <div>
      <PageHeader title="畢業審核結果" description="依後端 audit engine 回傳資料呈現，不顯示不存在的 GPA 或登入權限指標。" />
      {lastAuditResult ? <AuditResultView result={lastAuditResult} studentProfile={studentProfile} /> : <EmptyState title="尚未執行審核" description="請先前往執行畢業審核頁。" />}
    </div>
  );
}

export function AuditHistoryPage() {
  const { currentUser, studentProfile } = useAppState();
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const history = useAuditHistory(currentUser.id);
  const detail = useAuditHistoryDetail(selectedAuditId);
  const selectedRow = history.data?.rows.find((row) => row.id === selectedAuditId);
  const selectedResult = selectedRow?.result_json || detail.data?.result_json || null;

  return (
    <div>
      <PageHeader title="我的審核歷史" description="點選任一筆紀錄即可展開當次審核結果。" />
      {history.isLoading ? <LoadingState /> : null}
      {history.error ? <ErrorState message={history.error.message} /> : null}
      {history.data?.rows.length ? (
        <div className="grid gap-3">
          {history.data.rows.map((row) => (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm" key={row.id}>
              <button
                className={`flex w-full flex-col gap-3 p-4 text-left transition md:flex-row md:items-center md:justify-between ${selectedAuditId === row.id ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                onClick={() => setSelectedAuditId((current) => (current === row.id ? null : row.id))}
                type="button"
              >
                <div>
                  <p className="font-bold text-navy-900">Audit #{row.id}</p>
                  <p className="text-sm text-slate-500">{new Date(row.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-6 text-sm font-semibold text-slate-700">
                  <span>採計 {formatCredits(row.total_credits_earned)} / {formatCredits(row.total_required_credits)}</span>
                  <span>{formatCredits(row.progress_percentage)}%</span>
                  <span className="inline-flex items-center gap-1 text-navy-800">
                    {selectedAuditId === row.id ? "收合結果" : "查看結果"}
                    <ChevronDown className={`h-4 w-4 transition ${selectedAuditId === row.id ? "rotate-180" : ""}`} />
                  </span>
                </div>
              </button>
              {selectedAuditId === row.id ? (
                <div className="border-t border-slate-200 p-4">
                  {detail.isLoading && !row.result_json ? <LoadingState label="載入審核結果" /> : null}
                  {detail.error ? <ErrorState message={detail.error.message} /> : null}
                  {selectedResult ? <AuditResultView result={selectedResult} studentProfile={studentProfile} /> : !detail.isLoading ? <EmptyState title="這筆紀錄沒有審核明細" /> : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : !history.isLoading ? <EmptyState title="尚無審核歷史" /> : null}
    </div>
  );
}
