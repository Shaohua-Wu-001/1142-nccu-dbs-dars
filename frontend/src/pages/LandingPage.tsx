import { Link } from "react-router-dom";
import { ArrowRight, Check, BookOpen, ClipboardCheck, BarChart3, ShieldCheck } from "lucide-react";
import nccuLogo from "../assets/nccu-logo.png";

/* ══════════════════════════════════════════════════════
   DASHBOARD MOCKUP  (decorative, right side)
══════════════════════════════════════════════════════ */
const CATEGORIES = [
  { name: "必修課程", done: 32, total: 36, bar: "from-blue-400 to-blue-500",     dot: "bg-amber-400" },
  { name: "通識課程", done: 16, total: 16, bar: "from-emerald-400 to-emerald-500", dot: "bg-emerald-400" },
  { name: "體育課程", done:  1, total:  2, bar: "from-amber-400 to-amber-500",    dot: "bg-amber-400" },
  { name: "自由選修", done: 28, total: 24, bar: "from-violet-400 to-violet-500",  dot: "bg-emerald-400" },
];

function DashboardMockup() {
  return (
    <div
      className="animate-hero-float relative w-full overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      {/* top shine */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.03] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-white/8 px-3 py-1">
          <ShieldCheck className="h-3 w-3 text-emerald-400/70" />
          <span className="text-[11px] text-white/30">dars.nccu.edu.tw / student / audit / result</span>
        </div>
      </div>

      <div className="p-5">
        {/* user row */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/30">
            王
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">王小明</p>
            <p className="text-xs text-slate-400">應用數學學系・111XXXXXXX</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-400">
            進行中
          </span>
        </div>

        {/* overall progress */}
        <div
          className="mb-5 rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">整體畢業進度</p>
              <p className="mt-0.5 text-3xl font-black text-white">
                78<span className="text-lg font-bold text-slate-400">%</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-white">117</p>
              <p className="text-[11px] text-slate-400">/ 150 學分</p>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 shadow-sm shadow-blue-400/50"
              style={{ width: "78%", transition: "width 1s ease" }}
            />
          </div>
        </div>

        {/* category bars */}
        <div className="mb-5 space-y-3.5">
          {CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
                  {cat.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {cat.done} / {cat.total} 學分
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${cat.bar}`}
                  style={{ width: `${Math.min(100, (cat.done / cat.total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "117", label: "已獲學分" },
            { val: "33",  label: "尚缺學分" },
            { val: "2025", label: "畢業年度" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-3 py-3 text-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-base font-black text-white">{s.val}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060C1E] text-white">

      {/* ── Backgrounds ────────────────────────────── */}

      {/* main deep gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060C1E] via-[#09163A] to-[#0A1A48]" />

      {/* campus photo overlay — drop nccu-campus.jpg into /public to enable */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/nccu-campus.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 60%",
          opacity: 0.07,
          mixBlendMode: "luminosity",
        }}
      />

      {/* grid lines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 90% 90% at 50% 40%, black 30%, transparent 100%)",
        }}
      />

      {/* top radial glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55vh]"
        style={{
          background:
            "radial-gradient(ellipse 110% 80% at 50% 0%, rgba(48,74,130,0.55), transparent 70%)",
        }}
      />

      {/* right glow behind mockup */}
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-[700px] w-[700px] -translate-y-1/2 translate-x-1/4 rounded-full blur-3xl"
        style={{ background: "rgba(59,91,161,0.12)" }}
      />

      {/* bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#060C1E] to-transparent" />

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg shadow-black/30">
            <img className="h-7 w-7 object-contain" src={nccuLogo} alt="NCCU" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-black tracking-tight text-white">NCCU&thinsp;DARS</p>
            <p className="text-[10px] text-slate-500">政治大學畢業審核系統</p>
          </div>
        </div>

        {/* Links */}
        <div className="hidden items-center gap-8 md:flex">
          {["功能介紹", "使用說明", "關於系統"].map((l) => (
            <a key={l} href="#" className="text-sm font-semibold text-slate-400 transition hover:text-white">
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/login"
          className="rounded-xl border border-white/15 bg-white/6 px-5 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/28 hover:bg-white/10"
        >
          登入系統
        </Link>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10 md:px-12 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">

          {/* ── LEFT TEXT ── */}
          <div className="max-w-2xl">

            {/* Tag pill */}
            <div className="animate-fade-up mb-7 inline-flex items-center gap-2.5 rounded-full border border-blue-400/25 bg-blue-500/8 px-4 py-1.5 backdrop-blur-sm">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-sm font-semibold text-blue-300">
                NCCU Degree Audit Reporting System
              </span>
            </div>

            {/* Main title */}
            <h1 className="animate-fade-up-d1 mb-6 leading-none">
              <span className="mb-3 block text-xl font-semibold tracking-tight text-slate-400 md:text-2xl">
                國立政治大學
              </span>
              <span
                className="block bg-clip-text text-[3.4rem] font-black leading-none tracking-tight text-transparent md:text-[4.2rem] xl:text-[5rem]"
                style={{ backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c7d9f5 50%, #7aaef8 100%)" }}
              >
                畢業學分
              </span>
              <span
                className="block bg-clip-text text-[3.4rem] font-black leading-none tracking-tight text-transparent md:text-[4.2rem] xl:text-[5rem]"
                style={{ backgroundImage: "linear-gradient(135deg, #c7d9f5 0%, #7aaef8 50%, #4f86f7 100%)" }}
              >
                檢核系統
              </span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-up-d2 mb-9 max-w-lg text-base leading-7 text-slate-400 md:text-lg md:leading-8">
              自動匯入修課紀錄，快速檢核畢業門檻，讓學生清楚掌握自己的畢業進度。
            </p>

            {/* Buttons */}
            <div className="animate-fade-up-d3 mb-10 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/40"
              >
                開始檢核
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/14 bg-white/5 px-6 py-3.5 text-sm font-bold text-white/85 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/9 hover:text-white"
              >
                查看功能
              </a>
            </div>

            {/* Feature checklist */}
            <div className="animate-fade-up-d4 grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap">
              {[
                "自動計算學分",
                "即時更新進度",
                "支援畢業門檻規則",
                "安全帳號驗證",
              ].map((f) => (
                <span key={f} className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="h-4 w-4 shrink-0 text-blue-400" />
                  {f}
                </span>
              ))}
            </div>

            {/* Feature icon row */}
            <div className="animate-fade-up-d4 mt-10 flex gap-6 border-t border-white/6 pt-8">
              {[
                { icon: <BookOpen className="h-5 w-5" />,      label: "修課紀錄匯入" },
                { icon: <BarChart3 className="h-5 w-5" />,     label: "學分統計分析" },
                { icon: <ClipboardCheck className="h-5 w-5" />, label: "畢業審核報告" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-slate-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    {item.icon}
                  </div>
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT MOCKUP ── */}
          <div className="animate-fade-up-d2 hidden lg:flex lg:justify-end">
            <div className="w-full max-w-[500px]">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
