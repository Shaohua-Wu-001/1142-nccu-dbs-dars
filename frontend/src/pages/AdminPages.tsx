import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { clsx } from "clsx";
import { ArrowRight, BookOpen, BookOpenCheck, ChevronDown, ClipboardCheck, Database, Dumbbell, FileWarning, GraduationCap, History, ListChecks, Route, Sparkles, UserCog, Users } from "lucide-react";
import { useAdminStudents, useAuditHistory, useAuditHistoryDetail, useCourses, useCreateManualCourse, useDeleteManualCourse, useRequirements, useRunAudit, useStudentCourses, useUnresolvedCourses, useUpdateManualCourse } from "../api/hooks";
import { AuditResultView } from "../components/AuditResultView";
import { MetricTile } from "../components/MetricTile";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import { buildManualCourseLink, getAdminDashboardStats } from "../lib/adminWorkflow";
import { formatCredits } from "../lib/status";
import { useAppState } from "../state/AppState";
import type { AuditHistoryRow, ManualCoursePayload, StudentCourse } from "../types/api";

function TargetUserControl() {
  const { targetUserId } = useAppState();
  const { data } = useAdminStudents();
  const student = data?.rows.find((r) => r.userId === targetUserId);
  return (
    <Link
      to="/admin/students"
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-navy-800 transition hover:border-navy-300 hover:bg-white"
    >
      <Users className="h-4 w-4 text-slate-400" />
      {student
        ? <span>{student.studentName} <span className="font-mono font-normal text-slate-500">{student.studentNumber}</span></span>
        : <span className="text-slate-500">選擇學生</span>}
    </Link>
  );
}

function AdminFlowCard({ icon, title, description, to, tone = "navy" }: { icon: ReactNode; title: string; description: string; to: string; tone?: "navy" | "amber" | "emerald" }) {
  const toneClass = {
    navy: "bg-navy-50 text-navy-800 border-navy-100",
    amber: "bg-[#fffaf1] text-[#9f7c31] border-[#C5A059]/25",
    emerald: "bg-navy-50 text-navy-800 border-navy-100"
  }[tone];

  return (
    <Link className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md" to={to}>
      <div className={`mb-4 inline-flex rounded-lg border p-3 ${toneClass}`}>
        {icon}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-navy-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-navy-700" />
      </div>
    </Link>
  );
}

function manualCourseSearchParams(course: StudentCourse) {
  const [, query = ""] = buildManualCourseLink(course).split("?");
  return new URLSearchParams(query);
}

export function AdminDashboard() {
  const { targetUserId } = useAppState();
  const { data: studentsData } = useAdminStudents();
  const student = studentsData?.rows.find((r) => r.userId === targetUserId);
  const studentCourses = useStudentCourses(targetUserId);
  const unresolved = useUnresolvedCourses(targetUserId);
  const history = useAuditHistory(targetUserId);
  const stats = useMemo(() => getAdminDashboardStats({
    studentCourses: studentCourses.data || [],
    unresolvedCount: unresolved.data?.count ?? unresolved.data?.rows.length ?? 0,
    auditHistory: history.data?.rows || []
  }), [history.data?.rows, studentCourses.data, unresolved.data?.count, unresolved.data?.rows]);

  return (
    <div>
      <PageHeader title="管理員總覽" description="管理員可檢視指定學生資料，處理待確認課程與人工調整。" actions={<TargetUserControl />} />
      <section className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-blue-950/5">
        <div className="border-b border-slate-100 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C5A059]">目前管理對象</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-navy-950">
                {student ? <>{student.studentName} <span className="ml-2 font-mono text-xl font-semibold text-slate-500">{student.studentNumber}</span></> : "尚未選擇學生"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">先確認 transcript 無法分類的課程，再用人工調整補上認列方式，最後回到審核紀錄檢查結果。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-right">
              <p className="text-xs font-bold tracking-[0.16em] text-slate-400">最新審核完成率</p>
              <p className="mt-1 text-2xl font-black text-navy-950">{stats.latestProgress === null ? "尚無" : `${formatCredits(stats.latestProgress)}%`}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="修課資料" value={stats.totalCourses} detail={studentCourses.isLoading ? "載入中" : "已匯入/人工資料總數"} icon={<Database className="h-5 w-5" />} />
          <MetricTile label="待確認課程" value={stats.unresolvedCourses} detail="缺少課程分類或需要人工判斷" icon={<FileWarning className="h-5 w-5" />} />
          <MetricTile label="人工調整" value={stats.manualAdjustments} detail="MANUAL student_course rows" icon={<UserCog className="h-5 w-5" />} />
          <MetricTile label="審核紀錄" value={stats.auditRuns} detail="已儲存 audit runs" icon={<History className="h-5 w-5" />} />
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminFlowCard icon={<ListChecks className="h-5 w-5" />} title="1. 檢查待確認課程" description="找出 transcript 匯入後尚未能分類或需要系辦判斷的課程。" to="/admin/students" tone="amber" />
        <AdminFlowCard icon={<UserCog className="h-5 w-5" />} title="2. 建立人工調整" description="新增抵免、核准替代或人工認列，讓下一次審核能採計。" to="/admin/manual-courses" />
        <AdminFlowCard icon={<ClipboardCheck className="h-5 w-5" />} title="3. 查看審核紀錄" description="載入指定學生最新或歷史審核結果，確認缺漏項目是否改善。" to="/admin/audit-history" tone="emerald" />
      </div>
    </div>
  );
}

export function AdminUnresolvedPage() {
  const { targetUserId } = useAppState();
  const unresolved = useUnresolvedCourses(targetUserId);
  return (
    <div>
      <PageHeader title="待人工確認課程" description="這些 transcript rows 未對應到課程分類，應由管理員確認。" actions={<TargetUserControl />} />
      {unresolved.data?.note ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {unresolved.data.note}
        </div>
      ) : null}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <MetricTile label="待確認數" value={unresolved.data?.count ?? unresolved.data?.rows.length ?? 0} detail={`目前檢視 userId ${targetUserId}`} icon={<FileWarning className="h-5 w-5" />} />
        <AdminFlowCard icon={<UserCog className="h-5 w-5" />} title="人工調整入口" description="若課程可採計，點表格右側可直接帶入課號、課名、學分。" to="/admin/manual-courses" />
        <AdminFlowCard icon={<Route className="h-5 w-5" />} title="處理原則" description="先判斷是否可採計，再選人工認列或核准替代，不直接修改 transcript 原始資料。" to="/admin/requirements" tone="emerald" />
      </div>
      {unresolved.isLoading ? <LoadingState /> : null}
      {unresolved.error ? <ErrorState message={unresolved.error.message} /> : null}
      {unresolved.data?.rows.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-3 py-2">學年期</th><th className="px-3 py-2">課號</th><th className="px-3 py-2">課名</th><th className="px-3 py-2">學分</th><th className="px-3 py-2">狀態</th><th className="px-3 py-2">備註</th><th className="px-3 py-2">處理</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unresolved.data.rows.map((course) => (
                <tr key={course.id}>
                  <td className="px-3 py-2">{course.academic_year_semester}</td>
                  <td className="px-3 py-2 font-semibold text-navy-800">{course.course_code}</td>
                  <td className="px-3 py-2">{course.course_name}</td>
                  <td className="px-3 py-2">{formatCredits(course.credits)}</td>
                  <td className="px-3 py-2"><StatusBadge value={course.status} /></td>
                  <td className="px-3 py-2">{course.remark || "—"}</td>
                  <td className="px-3 py-2">
                    <Link className="inline-flex items-center gap-1 rounded-md bg-navy-800 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-900" to={buildManualCourseLink(course)}>
                      帶入調整
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !unresolved.isLoading ? <EmptyState title="目前沒有待確認課程" /> : null}
    </div>
  );
}

export function AdminManualCoursesPage() {
  const { targetUserId } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showGuide, setShowGuide] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [editingManualId, setEditingManualId] = useState<number | null>(null);
  const runAudit = useRunAudit();
  const { data: studentsData } = useAdminStudents();
  const targetStudent = studentsData?.rows.find((r) => r.userId === targetUserId);
  const auditYear = String(targetStudent?.admissionYear ?? "114");
  const [categoryValue, setCategoryValue] = useState(() => {
    const cat = searchParams.get("courseCategory") || "選修";
    return cat.endsWith("-核心") ? cat.slice(0, -3) : cat;
  });
  const [isCore, setIsCore] = useState(() => (searchParams.get("courseCategory") || "").endsWith("-核心"));
  const [recognitionType, setRecognitionType] = useState(searchParams.get("recognitionType") || "MANUAL_CREDIT");
  const [mode, setMode] = useState<"general" | "substitution" | "elective">(() => {
    const rt = searchParams.get("recognitionType");
    const cat = searchParams.get("courseCategory") || "";
    if (rt === "APPROVED_SUBSTITUTION") return "substitution";
    if (cat.startsWith("通識-")) return "general";
    return "elective";
  });

  const isCoreEligible = new Set(["通識-人文", "通識-社會", "通識-自然"]).has(categoryValue);

  function handleModeChange(newMode: "general" | "substitution" | "elective") {
    setMode(newMode);
    setIsCore(false);
    if (newMode === "general") {
      if (!categoryValue.startsWith("通識-")) setCategoryValue("通識-人文");
      setRecognitionType("MANUAL_CREDIT");
    } else if (newMode === "substitution") {
      setCategoryValue("系必修");
      setRecognitionType("APPROVED_SUBSTITUTION");
    } else {
      if (categoryValue.startsWith("通識-")) setCategoryValue("選修");
      setRecognitionType("MANUAL_CREDIT");
    }
  }

  useEffect(() => {
    const cat = searchParams.get("courseCategory") || "選修";
    const hasCore = cat.endsWith("-核心");
    const baseCat = hasCore ? cat.slice(0, -3) : cat;
    setCategoryValue(baseCat);
    setIsCore(hasCore);
    const rt = searchParams.get("recognitionType") || "MANUAL_CREDIT";
    setRecognitionType(rt);
    if (rt === "APPROVED_SUBSTITUTION") setMode("substitution");
    else if (baseCat.startsWith("通識-")) setMode("general");
    else setMode("elective");
  }, [searchParams]);
  const createManual = useCreateManualCourse(targetUserId);
  const updateManual = useUpdateManualCourse(targetUserId);
  const deleteManual = useDeleteManualCourse(targetUserId);
  const courses = useStudentCourses(targetUserId);
  const unresolved = useUnresolvedCourses(targetUserId);
  const manualRows = useMemo(() => (courses.data || []).filter((course) => course.source === "MANUAL"), [courses.data]);
  const formKey = `${targetUserId}:${searchParams.toString()}`;

  const examples = [
    {
      title: "情境 A：外文免修 / 通識抵免",
      description: "適用於學生已通過免修檢定，需手動補足畢業學分，但不對應特定必修課。",
      data: {
        courseCode: "MANUAL-WAIVER-FOREIGN",
        courseName: "外國語文免修抵免",
        credits: "3",
        courseCategory: "通識-外文",
        recognitionType: "MANUAL_CREDIT",
        remark: "通過免修考試",
        approvalNote: "依教務處 111-1 核准函辦理"
      }
    },
    {
      title: "情境 B：以「高微」替代「微積分」",
      description: "適用於學生修讀進階課程來抵免基礎必修課，需指定被替代的原始必修課號。",
      data: {
        courseCode: "701002001",
        courseName: "高等微積分（上）",
        credits: "4",
        courseCategory: "系必修",
        recognitionType: "APPROVED_SUBSTITUTION",
        substitutionForCourseCode: "701001001",
        remark: "核准替代必修",
        approvalNote: "系務會議通過進階抵免基礎"
      }
    }
  ];

  function applyExample(data: any) {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => params.set(key, String(value)));
    setSearchParams(params);
    setShowGuide(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMsg("");
    const form = new FormData(event.currentTarget);
    const academicYear = Number(form.get("academicYear") || 111);
    const semester = String(form.get("semester") || "1");
    const payload: ManualCoursePayload = {
      userId: targetUserId,
      courseCode: String(form.get("courseCode") || ""),
      courseName: String(form.get("courseName") || ""),
      credits: Number(form.get("credits") || 0),
      department: String(form.get("department") || "應用數學系"),
      courseCategory: mode === "general" && isCore ? `${categoryValue}-核心` : categoryValue,
      academicYear,
      semester,
      academicYearSemester: `${academicYear}${semester}`,
      score: String(form.get("score") || "MANUAL"),
      remark: String(form.get("remark") || ""),
      recognitionType: recognitionType as ManualCoursePayload["recognitionType"],
      approvalStatus: String(form.get("approvalStatus") || "APPROVED") as ManualCoursePayload["approvalStatus"],
      substitutionForCourseCode: String(form.get("substitutionForCourseCode") || ""),
      approvalSource: String(form.get("approvalSource") || "系辦人工調整"),
      approvalNote: String(form.get("approvalNote") || "")
    };
    createManual.mutate(payload, {
      onSuccess: async () => {
        const wasHandlingUnresolved = Boolean(searchParams.get("courseCode"));
        const currentSourceId = Number(searchParams.get("sourceCourseId"));
        const refreshedUnresolved = await unresolved.refetch();
        const remainingRows = refreshedUnresolved.data?.rows ?? [];
        const nextCourse = wasHandlingUnresolved
          ? remainingRows.find((course) => course.id !== currentSourceId) ?? remainingRows[0] ?? null
          : null;

        if (nextCourse) {
          setSuccessMsg(`人工調整已儲存，已帶入下一筆待確認課程：${nextCourse.course_name}`);
          setSearchParams(manualCourseSearchParams(nextCourse));
        } else {
          setSuccessMsg(wasHandlingUnresolved
            ? "人工調整已儲存，此學生的待確認課程已全部處理完。"
            : "人工調整已成功儲存！");
          setSearchParams(new URLSearchParams());
        }
        runAudit.mutate({ userId: targetUserId, academicYear: auditYear, includeInProgress: false, saveResult: true, auditSource: "ADMIN" });
      }
    });
  }

  function submitManualEdit(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Partial<ManualCoursePayload> = {
      courseCategory: String(form.get("courseCategory") || ""),
      credits: Number(form.get("credits") || 0),
      score: String(form.get("score") || "MANUAL"),
      approvalStatus: String(form.get("approvalStatus") || "APPROVED") as ManualCoursePayload["approvalStatus"],
      recognitionType: String(form.get("recognitionType") || "MANUAL_CREDIT") as ManualCoursePayload["recognitionType"],
      approvalNote: String(form.get("approvalNote") || "")
    };
    updateManual.mutate({ id, payload }, {
      onSuccess: () => {
        setEditingManualId(null);
        setSuccessMsg("人工調整已更新，系統會自動重新執行並儲存審核。");
        runAudit.mutate({ userId: targetUserId, academicYear: auditYear, includeInProgress: false, saveResult: true, auditSource: "ADMIN" });
      }
    });
  }

  const ic = "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none";
  const sc = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none";

  return (
    <div className="space-y-6">
      <PageHeader title="人工調整" description="建立手動修課資料，用於處理抵免、替代必修或特殊認列。" actions={<TargetUserControl />} />
      
      <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full items-center justify-between font-bold text-navy-900"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            不知道該怎麼填？查看填寫指南與範例
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform ${showGuide ? "rotate-180" : ""}`} />
        </button>
        
        {showGuide && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {examples.map((ex, i) => (
              <div key={i} className="flex flex-col justify-between rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-blue-900">{ex.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{ex.description}</p>
                </div>
                <button 
                  onClick={() => applyExample(ex.data)}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  套用此範本
                </button>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/40 p-4 lg:col-span-2">
              <h4 className="text-sm font-bold text-navy-800">重要欄位說明</h4>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                <li><span className="font-bold text-blue-700">人工認列 (MANUAL_CREDIT)：</span>最常見，用於補足學分。系統會直接把這門課算進指定的類別（如通識、選修）。</li>
                <li><span className="font-bold text-blue-700">核准替代 (APPROVED_SUBSTITUTION)：</span>用於取代特定必修。一定要填寫<span className="underline">替代必修課號</span>。</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <form className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" key={formKey} onSubmit={submit}>
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h3 className="font-bold text-navy-900">新增調整資料</h3>
            {searchParams.toString() ? (
              <button 
                type="button"
                className="text-xs font-bold text-red-600 hover:text-red-700" 
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                清除已填資料
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-x-6 gap-y-5 p-6 lg:grid-cols-3">

          {/* ── 調整類型卡片 ── */}
          <div className="lg:col-span-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">調整類型</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: "general" as const,      label: "通識課程認列",  sub: "認列至指定通識領域（人文、社科、自然、外文等）" },
                { id: "substitution" as const, label: "系必修核准替代", sub: "以修讀的課程取代特定系必修課程" },
                { id: "elective" as const,     label: "選修 / 其他",   sub: "補足選修學分、體育必修等其他情況" }
              ]).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeChange(m.id)}
                  className={clsx(
                    "flex flex-col items-start rounded-2xl border px-5 py-4 text-left transition",
                    mode === m.id
                      ? "border-navy-900 bg-navy-900 shadow-md"
                      : "border-slate-200 bg-slate-50 hover:border-navy-300 hover:bg-white"
                  )}
                >
                  <span className={clsx("text-sm font-black", mode === m.id ? "text-white" : "text-navy-900")}>{m.label}</span>
                  <span className={clsx("mt-1.5 text-xs leading-relaxed", mode === m.id ? "text-white/65" : "text-slate-400")}>{m.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 課號 / 課名 / 學分 ── */}
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">課號<span className="ml-0.5 text-red-500">*</span>
            <input className={ic} name="courseCode" defaultValue={searchParams.get("courseCode") || ""} placeholder="例如 MANUAL-001" required />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">課名<span className="ml-0.5 text-red-500">*</span>
            <input className={ic} name="courseName" defaultValue={searchParams.get("courseName") || ""} placeholder="例如 外文抵免" required />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">學分<span className="ml-0.5 text-red-500">*</span>
            <input className={ic} name="credits" defaultValue={searchParams.get("credits") || ""} placeholder="3" type="number" step="0.5" required />
          </label>

          {/* ── 依類型顯示對應欄位 ── */}
          <div className="lg:col-span-3">
            {mode === "general" && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">通識領域</p>
                  <select
                    className={sc}
                    value={categoryValue}
                    onChange={(e) => { setCategoryValue(e.target.value); setIsCore(false); }}
                  >
                    <option value="通識-人文">人文學通識</option>
                    <option value="通識-社會">社會科學通識</option>
                    <option value="通識-自然">自然科學通識</option>
                    <option value="通識-外文">外國語文通識</option>
                    <option value="通識-中文">中國語文通識</option>
                    <option value="通識-資訊">資訊通識</option>
                    <option value="通識-書院">書院通識</option>
                  </select>
                  {isCoreEligible && (
                    <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={isCore} onChange={(e) => setIsCore(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-navy-900" />
                      核心通識
                    </label>
                  )}
                </div>
                <div className="hidden rounded-2xl bg-blue-50 p-4 text-xs leading-relaxed text-blue-800 lg:block">
                  <p className="font-bold">通識採計說明</p>
                  <p className="mt-1">總計上限 28 學分。各領域超修不列計；應數系資訊通識無最低門檻。</p>
                  <p className="mt-2 font-bold">核心通識</p>
                  <p className="mt-1">人文、社科、自然三領域中至少 2 門、不同領域各 1 門方可達標。</p>
                </div>
              </div>
            )}

            {mode === "substitution" && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    被替代的必修課號<span className="ml-0.5 text-red-500">*</span>
                    <input
                      className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm font-bold text-navy-950 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none"
                      name="substitutionForCourseCode"
                      defaultValue={searchParams.get("substitutionForCourseCode") || ""}
                      placeholder="填入被取代那門必修的課號，例如 701001001"
                      required
                    />
                  </label>
                </div>
                <div className="hidden rounded-2xl bg-blue-50 p-4 text-xs leading-relaxed text-blue-800 lg:block">
                  <p className="font-bold">核准替代說明</p>
                  <p className="mt-1">此課程將在審核時標記取代指定必修課。被替代課號如有誤，必修仍會顯示未完成。</p>
                </div>
              </div>
            )}

            {mode === "elective" && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">課程類別</p>
                <select className={`mt-1 max-w-xs ${sc}`} value={categoryValue} onChange={(e) => setCategoryValue(e.target.value)}>
                  <option value="選修">選修</option>
                  <option value="體育必修">體育必修</option>
                  <option value="系必修">系必修</option>
                </select>
              </div>
            )}
          </div>

          {/* ── 學年度 / 學期 / 成績 ── */}
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">學年度
            <input className={ic} name="academicYear" defaultValue={searchParams.get("academicYear") || "111"} />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">學期
            <select className={`mt-1 ${sc}`} name="semester" defaultValue={searchParams.get("semester") || "1"}>
              <option value="1">1（上學期）</option>
              <option value="2">2（下學期）</option>
              <option value="S">S（暑修）</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">成績
            <span className="ml-1 text-[10px] font-normal normal-case text-slate-400">（從成績單自動帶入）</span>
            <input className={ic} name="score" defaultValue={searchParams.get("score") || "MANUAL"} />
          </label>

          {/* ── 備註 + 送出 ── */}
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 lg:col-span-2">審核說明/備註
            <input className={ic} name="approvalNote" defaultValue={searchParams.get("approvalNote") || ""} placeholder="例如：依系務會議通過..." />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <p className="text-xs text-slate-400"><span className="text-red-500">*</span> 為必填欄位</p>
            <button className="w-full rounded-xl bg-navy-900 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-navy-950 active:translate-y-0 disabled:opacity-60" disabled={createManual.isPending || runAudit.isPending}>
              {createManual.isPending ? "正在儲存調整..." : runAudit.isPending ? "正在重新審核..." : "新增調整"}
            </button>
          </div>
        </div>
      </form>
      {createManual.error ? <div className="mt-4"><ErrorState message={createManual.error.message} /></div> : null}
      {updateManual.error ? <div className="mt-4"><ErrorState message={updateManual.error.message} /></div> : null}

      {successMsg && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
          <div className="px-5 py-4">
            <p className="font-bold text-emerald-800">人工調整已儲存</p>
            <p className="mt-1 text-sm text-emerald-700">{successMsg} 系統會自動重新執行並儲存審核。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-emerald-100 bg-white/60 px-5 py-3">
            {runAudit.isPending && (
              <span className="text-sm font-bold text-emerald-700">審核執行中...</span>
            )}
            {runAudit.isSuccess && (
              <span className="text-sm font-bold text-emerald-700">審核已儲存，學生現在可以看到最新結果</span>
            )}
            {runAudit.error && (
              <span className="text-sm font-bold text-red-600">{(runAudit.error as Error).message}</span>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-navy-900">既有人工調整</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{manualRows.length} 筆紀錄</span>
        </div>
        {manualRows.length ? (
          <div className="grid gap-3">
            {manualRows.map((row) => (
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 md:flex-row md:items-center md:justify-between" key={row.id}>
                {editingManualId === row.id ? (
                  <form className="grid flex-1 gap-3 md:grid-cols-6" onSubmit={(event) => submitManualEdit(event, row.id)}>
                    <div className="md:col-span-2">
                      <p className="font-black text-navy-900">{row.course_name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">#{row.course_code} • {row.academic_year_semester}</p>
                    </div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      類別
                      <input className={ic} name="courseCategory" defaultValue={row.course_category || ""} />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      學分
                      <input className={ic} name="credits" defaultValue={String(row.credits)} step="0.5" type="number" />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      成績
                      <input className={ic} name="score" defaultValue={row.score || "MANUAL"} />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      狀態
                      <select className={`mt-1 ${sc}`} name="approvalStatus" defaultValue={row.approval_status}>
                        <option value="APPROVED">APPROVED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </label>
                    <input name="recognitionType" type="hidden" value={row.recognition_type} />
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 md:col-span-4">
                      審核說明
                      <input className={ic} name="approvalNote" defaultValue={row.approval_note || ""} />
                    </label>
                    <div className="flex items-end gap-2 md:col-span-2">
                      <button className="rounded-xl bg-navy-900 px-4 py-2 text-xs font-black text-white transition hover:bg-navy-950 disabled:opacity-60" disabled={updateManual.isPending} type="submit">
                        {updateManual.isPending ? "儲存中..." : "儲存修改"}
                      </button>
                      <button className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50" onClick={() => setEditingManualId(null)} type="button">
                        取消
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-navy-900">{row.course_name}</p>
                        <span className="text-xs font-bold text-slate-400">#{row.course_code}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {formatCredits(row.credits)} 學分 • {row.course_category} • {row.academic_year_semester}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge value={row.recognition_type} />
                        <StatusBadge value={row.approval_status} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl border border-navy-100 px-4 py-2 text-xs font-black text-navy-800 transition hover:bg-navy-50"
                        onClick={() => setEditingManualId(row.id)}
                      >
                        編輯
                      </button>
                      <button
                        className="rounded-xl border border-red-100 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-50"
                        onClick={() => { if(confirm("確定要刪除這筆手動紀錄嗎？")) deleteManual.mutate(row.id) }}
                      >
                        刪除紀錄
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : <EmptyState title="目前沒有人工調整資料" />}
      </div>
    </div>
  );
}

export function AdminCoursesPage() {
  const [params, setParams] = useState({ year: "111", limit: "50", keyword: "" });
  const courses = useCourses(params);
  return (
    <div>
      <PageHeader title="課程查詢" description="查詢由 Excel seed 進資料庫的 course catalog。" />
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded-md border border-slate-300 px-3 py-2" value={params.year} onChange={(event) => setParams({ ...params, year: event.target.value })} placeholder="學年度" />
        <input className="rounded-md border border-slate-300 px-3 py-2" value={params.keyword} onChange={(event) => setParams({ ...params, keyword: event.target.value })} placeholder="課號或課名" />
      </div>
      {courses.isLoading ? <LoadingState /> : null}
      {courses.error ? <ErrorState message={courses.error.message} /> : null}
      {courses.data?.rows.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-3 py-2">學期</th><th className="px-3 py-2">課號</th><th className="px-3 py-2">課名</th><th className="px-3 py-2">學分</th><th className="px-3 py-2">系所</th><th className="px-3 py-2">類別</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.data.rows.map((course) => (
                <tr key={course.id}>
                  <td className="px-3 py-2">{course.semester}</td>
                  <td className="px-3 py-2 font-semibold text-navy-800">{course.course_code}</td>
                  <td className="px-3 py-2">{course.course_name}</td>
                  <td className="px-3 py-2">{formatCredits(course.credits)}</td>
                  <td className="px-3 py-2">{course.department || "—"}</td>
                  <td className="px-3 py-2">{course.category || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !courses.isLoading ? <EmptyState title="查無課程" /> : null}
    </div>
  );
}

function displayRuleName(name: string | null, key: string) {
  if (name) return name;
  if (key === "TOTAL_CREDITS_128") return "畢業總學分門檻 (128)";
  if (key === "OTHER_ELECTIVE_CREDITS") return "其他選修總學分要求";
  if (key === "GENERAL_CREDITS") return "通識課程總學分要求";
  return key;
}

type RequirementRuleRow = {
  id: number | string;
  rule_type: string;
  rule_key: string;
  course_name: string | null;
  min_credits: number | string | null;
  credit_cap: number | string | null;
  metadata_json?: {
    acceptedCourseCodes?: string[];
    specialPolicy?: string | null;
  } | null;
};

type RequirementGroupRow = {
  id: number | string;
  group_code: string;
  group_name: string;
  min_credits?: number | string | null;
  min_courses?: number | string | null;
  RequirementRules?: RequirementRuleRow[];
};

function formatCreditsValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return formatCredits(Number(value));
}

function formatGroupThreshold(group: RequirementGroupRow) {
  const parts = [];
  const credits = formatCreditsValue(group.min_credits);
  const courses = group.min_courses === null || group.min_courses === undefined || group.min_courses === "" ? null : String(group.min_courses);
  if (credits !== null) parts.push(`${credits} 學分`);
  if (courses !== null) parts.push(`${courses} 門`);
  return parts.length ? `最低門檻：${parts.join(" / ")}` : "依下方規則檢核";
}

function groupPolicyText(groupCode: string) {
  const policies: Record<string, string[]> = {
    TOTAL: [
      "總畢業學分：128 學分",
      "採計學分由系必修、體育必修、通識課程及其他選修加總。"
    ],
    REQUIRED: [
      "依學生適用學年度，檢核應數系專業必修課程是否完成。",
      "111-112 年度：線性代數為 8 學分。",
      "113 年度起：線性代數改為 6 學分，並新增數學導論 2 學分。",
      "高等微積分、線性代數存在不同課號版本，需納入等價課號認列。"
    ],
    PE: [
      "體育必修：需修滿 4 門",
      "體育課一、二年級共 4 學期必修。"
    ],
    GENERAL: [
      "通識課程：總計 28 學分，超修部分不採計。",
      "語文通識：中國語文 3-6 學分；外國語文 6 學分。",
      "一般通識：人文 3-7、社會 3-7、自然 3-7、資訊 0-3、書院 0-3 學分。",
      "核心通識：須於人文、社會、自然三領域中，至少修讀 2 門不同領域核心通識。",
      "應數系可免修資訊通識，但須以其他一般通識課程補足 28 學分。"
    ],
    ELECTIVE: [
      "其他選修：需修滿 45 學分，國防課程與選修體育課程各最多採計 4 學分。",
      "選修課程用於補足畢業總學分。",
      "需避免通識超修、體育超修或不可採計課程被錯誤算入畢業學分。"
    ]
  };
  return policies[groupCode] || [];
}

function PolicySummaryCard({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
  const cleanTitle = title.replace(/^[一二三四]、/, "");

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white shadow-sm shadow-blue-950/15">
          {icon}
        </span>
        <h3 className="text-base font-black text-navy-950">{cleanTitle}</h3>
      </div>
      <ul className="space-y-2.5 text-sm font-semibold leading-6 text-slate-600">
        {items.map((item, index) => (
          <li className="grid grid-cols-[0.5rem_1fr] gap-3" key={item}>
            <span className={`mt-2 h-2 w-2 rounded-full ${index === 0 ? "bg-blue-500" : "bg-slate-300"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RequirementOverview({ year }: { year: string }) {
  const items = [
    { label: "適用學年度", value: year, detail: "依學生入學年度套用", icon: <BookOpen className="h-4 w-4" /> },
    { label: "畢業總學分", value: "128", detail: "系必修、通識、體育、選修加總", icon: <ClipboardCheck className="h-4 w-4" /> },
    { label: "通識門檻", value: "28", detail: "含語文、一般與核心通識", icon: <ListChecks className="h-4 w-4" /> },
    { label: "其他選修", value: "45", detail: "國防與選修體育各最多 4 學分", icon: <Route className="h-4 w-4" /> }
  ];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4" key={item.label}>
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
              <span className="rounded-lg bg-white p-2 text-navy-700 shadow-sm">{item.icon}</span>
              {item.label}
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-navy-950">{item.value}</p>
              {item.label !== "適用學年度" ? <p className="pb-1 text-sm font-bold text-slate-500">學分</p> : <p className="pb-1 text-sm font-bold text-slate-500">學年度</p>}
            </div>
            <p className="mt-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RulesTable({ rules }: { rules: RequirementRuleRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="min-w-[880px] divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">課程或規則</th>
            <th className="whitespace-nowrap px-4 py-3 text-center">應修學分</th>
            <th className="whitespace-nowrap px-4 py-3 text-center">採計上限</th>
            <th className="whitespace-nowrap px-4 py-3">可採計課號</th>
            <th className="whitespace-nowrap px-4 py-3">特殊採認說明</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {rules.map((rule) => {
            const metadata = rule.metadata_json || null;
            const acceptedCodes = metadata?.acceptedCourseCodes || [];
            return (
              <tr key={String(rule.id)} className="align-top">
                <td className="whitespace-nowrap px-4 py-3.5 font-bold text-navy-900">
                  {displayRuleName(rule.course_name, rule.rule_key)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center font-black text-slate-700">
                  {formatCreditsValue(rule.min_credits) ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center font-black text-amber-700">
                  {rule.credit_cap !== null && rule.credit_cap !== undefined ? `${formatCredits(Number(rule.credit_cap))} 學分` : "—"}
                </td>
                <td className="px-4 py-3.5">
                  {acceptedCodes.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {acceptedCodes.map((code) => (
                        <span key={code} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{code}</span>
                      ))}
                    </div>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-sm font-medium leading-6 text-slate-600">
                  {metadata?.specialPolicy ? metadata.specialPolicy : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminRequirementsPage() {
  const [year, setYear] = useState("111");
  const requirements = useRequirements(year);
  const requiredGroup = ((requirements.data?.groups || []) as RequirementGroupRow[]).find((group) => group.group_code === "REQUIRED");
  const requiredRules = requiredGroup?.RequirementRules || [];
  const yearSelector = (
    <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm shadow-blue-950/5">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">年度</span>
      <select
        className="bg-transparent text-sm font-black text-navy-900 outline-none"
        value={year}
        onChange={(event) => setYear(event.target.value)}
      >
        <option value="111">111 學年度</option>
        <option value="112">112 學年度</option>
        <option value="113">113 學年度</option>
        <option value="114">114 學年度</option>
      </select>
    </label>
  );
  return (
    <div className="space-y-6">
      <PageHeader title="畢業規則查詢" description="查閱各學年度畢業門檻、通識與選修採計原則，以及系必修可採認課號。" actions={yearSelector} />
      
      {requirements.isLoading ? <LoadingState /> : null}
      {requirements.error ? <ErrorState message={requirements.error.message} /> : null}

      <RequirementOverview year={year} />

      <div className="grid gap-4 xl:grid-cols-4">
        <PolicySummaryCard title="必修課程" icon={<BookOpenCheck className="h-5 w-5" />} items={groupPolicyText("REQUIRED")} />
        <PolicySummaryCard title="通識課程與體育" icon={<Dumbbell className="h-5 w-5" />} items={[...groupPolicyText("GENERAL"), ...groupPolicyText("PE")]} />
        <PolicySummaryCard title="選修課程" icon={<BookOpen className="h-5 w-5" />} items={groupPolicyText("ELECTIVE")} />
        <PolicySummaryCard title="畢業總學分" icon={<GraduationCap className="h-5 w-5" />} items={groupPolicyText("TOTAL")} />
      </div>

      {requiredGroup ? (
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-black text-navy-950">系必修可採認課號</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{formatGroupThreshold(requiredGroup)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm">
                {requiredRules.length ? `${requiredRules.length} 項明細` : "無明細"}
              </div>
            </div>
          </div>
          <div className="p-5">
            {requiredRules.length ? (
              <RulesTable rules={requiredRules} />
            ) : (
              <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-500">此學年度目前沒有系必修明細。</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function AdminAuditHistoryPage() {
  const { targetUserId, targetStudentProfile } = useAppState();
  const history = useAuditHistory(targetUserId);
  const [selected, setSelected] = useState<number | null>(null);
  
  const rows = useMemo(() => history.data?.rows || [], [history.data?.rows]);
  const latestRow = useMemo(() => rows.reduce<AuditHistoryRow | null>((current, row) => {
    if (!current) return row;
    return row.id > current.id ? row : current;
  }, null), [rows]);
  
  const selectedRow = rows.find((row) => row.id === selected) || latestRow;
  const historyDetail = useAuditHistoryDetail(selectedRow?.id ?? null);
  const result = historyDetail.data?.result_json || null;

  return (
    <div className="space-y-6">
      <PageHeader title="學生審核紀錄" description="載入歷次審核結果，確認人工調整後是否改善缺漏項目。" actions={<TargetUserControl />} />
      
      {history.isLoading ? <LoadingState /> : null}
      {history.error ? <ErrorState message={history.error.message} /> : null}
      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="紀錄數" value={rows.length} detail={`userId ${targetUserId}`} icon={<History className="h-5 w-5" />} />
        <MetricTile label="目前載入" value={selectedRow ? (selectedRow.audit_name || `#${selectedRow.id}`) : "尚無"} detail={selectedRow ? new Date(selectedRow.created_at).toLocaleString() : undefined} icon={<ClipboardCheck className="h-5 w-5" />} />
        <MetricTile label="完成率" value={selectedRow ? `${formatCredits(selectedRow.progress_percentage)}%` : "—"} detail="該次審核進度" icon={<Sparkles className="h-5 w-5" />} />
        
        <div className="rounded-2xl border border-navy-200 bg-white p-4 shadow-sm shadow-blue-950/5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">選擇歷史紀錄</p>
            <ChevronDown className="h-4 w-4 text-slate-300" />
          </div>
          <select 
            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-100"
            value={selectedRow?.id || ""}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {rows.length === 0 && <option value="">尚無紀錄</option>}
            {[...rows].sort((a, b) => b.id - a.id).map((row) => (
              <option key={row.id} value={row.id}>
                {row.audit_name || `Audit #${row.id}`} ({new Date(row.created_at).toLocaleDateString()} {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - {formatCredits(row.progress_percentage)}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-[400px]">
        {historyDetail.isLoading ? <LoadingState label="正在載入審核明細" /> : null}
        {historyDetail.error ? <ErrorState message={historyDetail.error.message} /> : null}
        {!historyDetail.isLoading && !historyDetail.error ? (
          result ? <AuditResultView result={result} studentProfile={targetStudentProfile} /> : <EmptyState title={selectedRow ? "這筆紀錄沒有審核明細" : "選擇一筆審核紀錄"} />
        ) : null}
      </div>
    </div>
  );
}

function StudentUnresolvedPanel({ userId }: { userId: number }) {
  const unresolved = useUnresolvedCourses(userId);
  if (unresolved.isLoading) return <LoadingState label="載入待確認課程" />;
  if (unresolved.error) return <ErrorState message={unresolved.error.message} />;
  const rows = unresolved.data?.rows ?? [];
  if (rows.length === 0) return (
    <p className="py-4 text-center text-sm font-semibold text-slate-400">此學生無待確認課程</p>
  );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-400">
          <tr>
            <th className="px-4 py-2.5">學年期</th>
            <th className="px-4 py-2.5">課號</th>
            <th className="px-4 py-2.5">課名</th>
            <th className="px-4 py-2.5">學分</th>
            <th className="px-4 py-2.5">狀態</th>
            <th className="px-4 py-2.5">備註</th>
            <th className="px-4 py-2.5 text-right">處理</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((course) => (
            <tr key={course.id}>
              <td className="px-4 py-2.5 text-slate-500">{course.academic_year_semester}</td>
              <td className="px-4 py-2.5 font-mono font-semibold text-navy-800">{course.course_code}</td>
              <td className="px-4 py-2.5">{course.course_name}</td>
              <td className="px-4 py-2.5">{formatCredits(course.credits)}</td>
              <td className="px-4 py-2.5"><StatusBadge value={course.status} /></td>
              <td className="px-4 py-2.5 text-slate-500">{course.remark || "—"}</td>
              <td className="px-4 py-2.5 text-right">
                <Link
                  className="inline-flex items-center gap-1 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-900"
                  to={buildManualCourseLink(course)}
                >
                  帶入調整 <ArrowRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentTranscriptPanel({ userId }: { userId: number }) {
  const courses = useStudentCourses(userId);
  if (courses.isLoading) return <LoadingState label="載入完整成績單" />;
  if (courses.error) return <ErrorState message={courses.error.message} />;

  const rows = (courses.data ?? []).filter((course) => course.source === "TRANSCRIPT_JSON");
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm font-semibold text-slate-400">此學生尚未上傳成績單</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-white text-left text-xs font-semibold uppercase text-slate-400">
          <tr>
            <th className="px-4 py-2.5">學年期</th>
            <th className="px-4 py-2.5">課號</th>
            <th className="px-4 py-2.5">課名</th>
            <th className="px-4 py-2.5">開課單位</th>
            <th className="px-4 py-2.5">分類</th>
            <th className="px-4 py-2.5">學分</th>
            <th className="px-4 py-2.5">成績</th>
            <th className="px-4 py-2.5">狀態</th>
            <th className="px-4 py-2.5 text-right">處理</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((course) => (
            <tr key={course.id}>
              <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{course.academic_year_semester}</td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono font-semibold text-navy-800">{course.course_code}</td>
              <td className="min-w-[12rem] px-4 py-2.5 font-medium text-slate-800">{course.course_name}</td>
              <td className="px-4 py-2.5 text-slate-500">{course.department || "—"}</td>
              <td className="px-4 py-2.5 text-slate-500">{course.course_category || "待確認"}</td>
              <td className="px-4 py-2.5">{formatCredits(course.credits)}</td>
              <td className="px-4 py-2.5 text-slate-600">{course.score || "—"}</td>
              <td className="px-4 py-2.5"><StatusBadge value={course.status} /></td>
              <td className="px-4 py-2.5 text-right">
                <Link
                  className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-800 hover:bg-navy-900 hover:text-white"
                  to={buildManualCourseLink(course)}
                >
                  帶入調整 <ArrowRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminStudentsPage() {
  const { targetUserId, setTargetUserId } = useAppState();
  const { data, isLoading, error } = useAdminStudents();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const rows = data?.rows ?? [];
  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.studentNumber ?? "").toLowerCase().includes(q) ||
      (r.studentName ?? "").toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="學生管理" description="學生帳號與成績單狀態，點擊姓名可查看待確認課程與完整成績單。" />

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm shadow-blue-950/5">
        <div className="border-b border-slate-100 px-6 py-4">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-navy-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="搜尋學號或姓名…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading && <LoadingState label="載入學生名單中" />}
        {error && <ErrorState message={error.message} />}

        {!isLoading && !error && (
          filtered.length === 0
            ? <EmptyState title={search ? "找不到符合的學生" : "目前沒有學生上傳成績單"} />
            : <div className="divide-y divide-slate-100">
                {filtered.map((row) => {
                  const isActive = row.userId === targetUserId;
                  const isExpanded = expandedId === row.userId;
                  return (
                    <div key={row.userId}>
                      {/* 學生列 */}
                      <div className={`flex items-center gap-4 px-6 py-4 ${isActive ? "bg-blue-50/50" : ""}`}>
                        {/* 頭像 */}
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-sm font-black text-white">
                          {(row.studentName ?? "?").slice(0, 1)}
                        </div>
                        {/* 姓名 + 學號 — 點擊展開 */}
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setExpandedId(isExpanded ? null : row.userId)}
                        >
                          <p className="flex items-center gap-2 font-bold text-navy-950 hover:text-navy-700">
                            {row.studentName ?? "—"}
                            {row.unresolvedCount > 0 && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">
                                待確認 {row.unresolvedCount}
                              </span>
                            )}
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-slate-500">
                            {row.studentNumber ?? "—"} · {row.admissionYear ? `${row.admissionYear} 級` : "—"} · {row.email ?? "—"}
                          </p>
                        </button>
                        {/* 操作 */}
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-xs text-slate-400 sm:block">
                            {row.latestUploadAt ? `${new Date(row.latestUploadAt).toLocaleDateString("zh-TW")} 上傳` : "尚未上傳"}
                          </span>
                          {isActive ? (
                            <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-black text-white">
                              目前檢視中
                            </span>
                          ) : (
                            <button
                              onClick={() => setTargetUserId(row.userId)}
                              className="rounded-xl border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-black text-navy-800 transition hover:bg-navy-900 hover:text-white"
                            >
                              切換管理
                            </button>
                          )}
                        </div>
                      </div>
                      {/* 展開：待確認課程與完整成績單 */}
                      {isExpanded && (
                        <div className="space-y-6 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                          <section>
                            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">待確認課程</p>
                            <StudentUnresolvedPanel userId={row.userId} />
                          </section>
                          <section>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">完整成績單</p>
                              <Link
                                className="rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-900"
                                to="/admin/manual-courses"
                                onClick={() => setTargetUserId(row.userId)}
                              >
                                新增空白人工調整
                              </Link>
                            </div>
                            <StudentTranscriptPanel userId={row.userId} />
                          </section>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
        )}
      </div>
    </div>
  );
}
