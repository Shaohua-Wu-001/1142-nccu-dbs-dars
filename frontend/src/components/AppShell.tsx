import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, ClipboardCheck, Database, FileInput, GraduationCap, History, Home, ListChecks, LogOut, Settings, ShieldCheck, UserCog } from "lucide-react";
import { clsx } from "clsx";
import { useHealth } from "../api/hooks";
import { useAppState } from "../state/AppState";
import nccuLogo from "../assets/nccu-logo.png";

const studentLinks = [
  { to: "/student", label: "Dashboard", icon: Home },
  { to: "/student/import", label: "上傳資料", icon: FileInput },
  { to: "/student/audit/result", label: "檢核結果", icon: ClipboardCheck },
  { to: "/student/courses", label: "我的修課資料", icon: BookOpen },
  { to: "/student/audit/run", label: "執行審核", icon: Settings },
  { to: "/student/audit/history", label: "歷史紀錄", icon: History }
];

const adminLinks = [
  { to: "/admin", label: "管理員總覽", icon: Home },
  { to: "/admin/unresolved", label: "待確認課程", icon: ListChecks },
  { to: "/admin/manual-courses", label: "人工調整", icon: UserCog },
  { to: "/admin/courses", label: "課程查詢", icon: Database },
  { to: "/admin/requirements", label: "畢業規則", icon: ShieldCheck },
  { to: "/admin/audit-history", label: "學生審核紀錄", icon: History }
];

export function AppShell({ role }: { role: "student" | "admin" }) {
  const links = role === "student" ? studentLinks : adminLinks;
  const { currentUser, targetUserId, logout: appLogout, studentProfile } = useAppState();
  const health = useHealth();
  const navigate = useNavigate();
  const studentName = studentProfile?.studentName || currentUser.name;
  const studentNumber = studentProfile?.studentNumber || currentUser.student_number;
  const avatarLabel = studentName.slice(0, 1) || (role === "admin" ? "管" : "學");

  function logout() {
    appLogout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(7,31,63,0.08),transparent_34%)]" />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 overflow-hidden bg-[#071f3f] text-white shadow-2xl shadow-blue-950/40 lg:block">
        <img className="absolute -bottom-20 -right-20 h-72 w-72 object-contain opacity-[0.05]" src={nccuLogo} alt="" aria-hidden="true" />
        <div className="relative flex h-24 items-center gap-3 border-b border-white/10 px-6">
          <img className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-1.5 shadow-lg shadow-black/20" src={nccuLogo} alt="NCCU logo" />
          <div className="min-w-0">
            <p className="whitespace-nowrap font-serif text-base font-bold leading-tight">國立政治大學 應用數學系</p>
            <p className="mt-1 text-xs font-semibold text-blue-100">Department of Mathematical Sciences</p>
            <p className="mt-1 inline-flex rounded-full border border-[#C5A059]/40 px-2 py-0.5 text-[10px] font-black tracking-[0.12em] text-[#f4d68c]">畢業審核系統</p>
          </div>
        </div>
        <nav className="relative space-y-2 px-4 py-6">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}`}
              className={({ isActive }) => clsx(
                "group flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition",
                isActive ? "border-[#C5A059]/45 bg-white/10 text-white shadow-inner shadow-black/10" : "border-transparent text-blue-50/90 hover:border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-80" />
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-5 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <p className="font-bold">有疑問嗎？</p>
          <p className="mt-1 text-xs leading-5 text-blue-100">查看常見問題或聯繫教務處，確認人工抵免與替代課程。</p>
          <div className="mt-3 inline-flex rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white">前往說明中心</div>
        </div>
      </aside>
      <div className="relative lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-5 py-4 shadow-sm shadow-blue-950/5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-navy-800">{role === "student" ? "學生端" : "管理員端"}</p>
              <p className="text-sm font-medium text-slate-500">
                {role === "student" ? `${studentName} / 學號 ${studentNumber} / userId ${currentUser.id}` : `目前檢視 userId ${targetUserId}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={clsx(
                "rounded-xl border px-3 py-2 text-xs font-bold",
                health.data?.status === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
              )}>
                後端{health.data?.status === "ok" ? "連線正常" : "連線待確認"}
              </span>
              <div className="hidden items-center gap-3 rounded-2xl px-2 py-1 md:flex">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#ffe0a6] to-[#79c7ff] text-sm font-black text-navy-900">
                  {avatarLabel}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-900">{role === "student" ? studentName : currentUser.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{role === "student" ? `學號：${studentNumber}` : "管理員"}</p>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50" onClick={logout}>
                <LogOut className="h-4 w-4" />
                登出
              </button>
            </div>
          </div>
        </header>
        <main className="px-5 py-6">
          <Outlet />
        </main>
      </div>
      <div className="fixed bottom-4 right-4 lg:hidden">
        <NavLink to={role === "student" ? "/student/audit/run" : "/admin/manual-courses"} className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-3 text-sm font-bold text-white shadow-lg">
          <Settings className="h-4 w-4" />
          快速操作
        </NavLink>
      </div>
    </div>
  );
}
