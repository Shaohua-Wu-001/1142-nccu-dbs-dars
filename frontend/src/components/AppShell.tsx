import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, CircleUserRound, ClipboardCheck, Database, FileInput, History, Home, ListChecks, LogOut, Mail, Menu, Phone, Settings, ShieldCheck, UserCog, Users, X } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { useHealth } from "../api/hooks";
import { useAppState } from "../state/AppState";
import nccuLogo from "../assets/nccu-logo.png";

const studentLinks = [
  { to: "/student", label: "Dashboard", icon: Home },
  { to: "/student/import", label: "上傳資料", icon: FileInput },
  { to: "/student/audit/run", label: "執行審核", icon: Settings },
  { to: "/student/audit/result", label: "檢核結果", icon: ClipboardCheck },
  { to: "/student/courses", label: "我的修課資料", icon: BookOpen },
  { to: "/student/audit/history", label: "歷史紀錄", icon: History },
  { to: "/student/profile", label: "個人資料", icon: CircleUserRound }
];

const adminLinks = [
  { to: "/admin", label: "管理員總覽", icon: Home },
  { to: "/admin/students", label: "學生管理", icon: Users },
  { to: "/admin/manual-courses", label: "人工調整", icon: UserCog },
  { to: "/admin/courses", label: "課程查詢", icon: Database },
  { to: "/admin/requirements", label: "畢業規則", icon: ShieldCheck },
  { to: "/admin/audit-history", label: "學生審核紀錄", icon: History },
  { to: "/admin/profile", label: "個人資料", icon: CircleUserRound }
];

function NavLinks({ links, role, onClick }: { links: any[], role: string, onClick?: () => void }) {
  return (
    <nav className="relative space-y-2 px-4 py-6">
      {links.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === `/${role}`}
          onClick={onClick}
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
  );
}

export function AppShell({ role }: { role: "student" | "admin" }) {
  const links = role === "student" ? studentLinks : adminLinks;
  const { currentUser, targetUserId, logout, studentProfile } = useAppState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const health = useHealth();
  const navigate = useNavigate();
  const studentName = studentProfile?.studentName || currentUser.name;
  const studentNumber = studentProfile?.studentNumber || currentUser.student_number;
  const avatarLabel = studentName.slice(0, 1) || (role === "admin" ? "管" : "學");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(7,31,63,0.08),transparent_34%)]" />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile / Desktop Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#071f3f] text-white shadow-2xl transition-transform lg:translate-x-0 lg:shadow-blue-950/40",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <img className="absolute bottom-0 right-0 h-48 w-48 object-contain opacity-[0.03] pointer-events-none select-none" src={nccuLogo} alt="" aria-hidden="true" />
        <div className="relative flex h-24 items-center justify-between gap-3 border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <img className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1.5 shadow-lg shadow-black/20" src={nccuLogo} alt="NCCU logo" />
            <div className="min-w-0">
              <p className="whitespace-nowrap font-serif text-sm font-bold leading-tight">政治大學 應數系</p>
              <p className="mt-0.5 inline-flex rounded-full border border-[#C5A059]/40 px-2 py-0.5 text-[9px] font-black tracking-[0.12em] text-[#f4d68c]">畢業審核系統</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden">
            <X className="h-6 w-6 text-blue-100/50" />
          </button>
        </div>
        <NavLinks links={links} role={role} onClick={() => setMobileMenuOpen(false)} />
        <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.08] px-5 py-4">
          <p className="mb-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#C5A059]/50">系辦聯絡資訊</p>
          <div className="space-y-1.5">
            <a
              href="mailto:ms@nccu.edu.tw"
              className="flex items-center gap-2 text-[11px] text-blue-100/45 transition hover:text-blue-100/80"
            >
              <Mail className="h-3 w-3 shrink-0" />
              ms@nccu.edu.tw
            </a>
            <a
              href="tel:+886229393091"
              className="flex items-center gap-2 text-[11px] text-blue-100/45 transition hover:text-blue-100/80"
            >
              <Phone className="h-3 w-3 shrink-0" />
              02-2939-3091 轉 62401
            </a>
          </div>
          <p className="mt-2.5 text-[10px] text-blue-100/25">週一至週五　08:30 – 17:00</p>
        </div>
      </aside>

      <div className="relative lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm shadow-blue-950/5 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl bg-slate-100 p-2 text-navy-900 transition hover:bg-slate-200 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-navy-800">{role === "student" ? "學生端介面" : "管理者介面"}</p>
                <p className="hidden text-xs font-semibold text-slate-500 sm:block">
                  {role === "student" ? `${studentName} / 學號 ${studentNumber}` : `目前管理 userId ${targetUserId}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <span className="relative flex h-2 w-2">
                  {health.data?.status !== "ok" && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  )}
                  <span className={clsx(
                    "relative inline-flex h-2 w-2 rounded-full",
                    health.data?.status === "ok" ? "bg-emerald-400" : "bg-amber-400"
                  )} />
                </span>
                <span className={clsx(
                  "text-xs font-semibold",
                  health.data?.status === "ok" ? "text-slate-400" : "text-amber-600"
                )}>
                  {health.data?.status === "ok" ? "已連線" : "API 離線"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-2 py-1.5">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-navy-900 text-[10px] font-black text-white">
                  {avatarLabel}
                </div>
                <button className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition" onClick={handleLogout} title="登出系統">
                  <LogOut className="h-4 w-4" />
                  <span className="text-xs font-bold">登出</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>

      <div className="fixed bottom-6 right-6 lg:hidden">
        <NavLink to={role === "student" ? "/student/audit/run" : "/admin/manual-courses"} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C5A059] text-navy-950 shadow-xl shadow-blue-950/20 active:scale-95 transition">
          <Settings className="h-5 w-5" />
        </NavLink>
      </div>
    </div>
  );
}
