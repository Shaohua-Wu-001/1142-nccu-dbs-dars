import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, BookOpenCheck, ClipboardCheck, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { UserRole } from "../types/api";
import { getDefaultRouteForRole } from "../lib/navigation";
import { useLogin, useRegister } from "../api/hooks";
import { useAppState } from "../state/AppState";
import nccuLogo from "../assets/nccu-logo.png";

function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eaf1f8] text-slate-900">
      <section className="relative flex min-h-[64vh] overflow-hidden bg-[#071f3f] px-6 py-8 text-white md:px-12 lg:px-20">
        <img className="absolute right-[-8rem] top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 object-contain opacity-[0.08] md:right-[-4rem] md:h-[42rem] md:w-[42rem]" src={nccuLogo} alt="" aria-hidden="true" />
        <div className="absolute inset-0 bg-[#071f3f]/90" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#C5A059]" />
        <div className="relative z-10 flex w-full flex-col">
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <img className="h-14 w-14 shrink-0 rounded-full bg-white object-contain p-1.5 shadow-xl shadow-black/20" src={nccuLogo} alt="NCCU logo" />
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="whitespace-nowrap font-serif text-xl font-bold tracking-normal md:text-2xl">國立政治大學 應用數學系</p>
                  <p className="whitespace-nowrap rounded-full border border-[#C5A059]/40 px-3 py-1 text-xs font-black tracking-[0.16em] text-[#f4d68c]">畢業審核系統</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-blue-100">Department of Mathematical Sciences, NCCU</p>
              </div>
            </div>
            <a className="hidden rounded-xl border border-white/20 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10 md:inline-flex" href="#auth-panel">
              Secure Access
            </a>
          </header>

          <div className="flex flex-1 items-center justify-center py-14 text-center">
            <div className="w-full max-w-7xl">
              <p className="mx-auto mb-5 inline-flex rounded-full border border-[#C5A059]/50 bg-[#C5A059]/10 px-7 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#f4d68c]">
                Graduation Audit Platform
              </p>
              <h1 className="mx-auto whitespace-nowrap font-serif text-[1.35rem] font-bold leading-none tracking-normal sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl">
                以清楚的規則與結果，完成畢業資格檢核
              </h1>
              <p className="mx-auto mt-7 max-w-3xl text-base font-medium leading-8 text-blue-100 md:text-xl">
                整合 transcript JSON 匯入、畢業審核、修課成績與通識必修解釋，讓學生與行政人員使用同一套可追溯的檢核流程。
              </p>
              <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
                <HeroPill icon={<BookOpenCheck className="h-5 w-5" />} label="規則清楚" />
                <HeroPill icon={<ClipboardCheck className="h-5 w-5" />} label="結果可追溯" />
                <HeroPill icon={<ShieldCheck className="h-5 w-5" />} label="行政可管理" />
              </div>
              <a className="mx-auto mt-10 inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-7 py-3 text-sm font-black text-navy-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#d7b670]" href="#auth-panel">
                前往登入
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-12" id="auth-panel">
        <div className="w-full max-w-[540px]">
          <div className="mb-6 flex items-center justify-center gap-4">
            <img className="h-14 w-14 shrink-0 rounded-full border border-slate-200 bg-white object-contain p-1.5 shadow-lg shadow-blue-950/10" src={nccuLogo} alt="NCCU logo" />
            <div>
              <p className="font-serif text-xl font-bold text-navy-950">Mathematical Sciences</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Graduate Audit</p>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-950/10 md:p-10">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C5A059]">Secure Access</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-navy-950">{title}</h2>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-bold text-blue-50 backdrop-blur">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-[#f4d68c]">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

function RoleSelector({ role, setRole }: { role: UserRole; setRole: (role: UserRole) => void }) {
  const options: Array<{ value: UserRole; label: string; icon: React.ReactNode }> = [
    { value: "student", label: "學生", icon: <UserRound className="h-4 w-4" /> },
    { value: "admin", label: "管理員", icon: <ShieldCheck className="h-4 w-4" /> }
  ];
  return (
    <div>
      <p className="mb-2 text-sm font-black text-slate-700">身份</p>
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
        {options.map((option) => (
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${role === option.value ? "bg-white text-navy-950 shadow-sm" : "text-slate-500 hover:text-navy-900"}`}
            key={option.value}
            onClick={() => setRole(option.value)}
            type="button"
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldShell({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-black text-slate-700">
      {label}
      <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-navy-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <span className="mr-3 text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAppState();
  const loginMutation = useLogin();
  const [role, setRole] = useState<UserRole>("student");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");
    const form = new FormData(event.currentTarget);
    const account = String(form.get("account") || "");
    const password = String(form.get("password") || "");

    try {
      const { token, user } = await loginMutation.mutateAsync({ account, password });
      if (user.role !== role) {
        const expected = role === "admin" ? "管理員" : "學生";
        setErrorMsg(`此帳號不是${expected}帳號，請選擇正確的身份`);
        return;
      }
      loginWithToken(token, user);
      navigate(getDefaultRouteForRole(user.role));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "登入失敗，請稍後再試");
    }
  }

  return (
    <AuthFrame title="登入系統">
      <form className="space-y-5" onSubmit={submit}>
        <RoleSelector role={role} setRole={setRole} />
        <FieldShell label="帳號（Email 或使用者名稱）" icon={<Mail className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none placeholder:text-slate-400" name="account" placeholder="demo001 或 demo@nccu.edu.tw" autoComplete="username" />
        </FieldShell>
        <FieldShell label="密碼" icon={<Lock className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none placeholder:text-slate-400" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
        </FieldShell>
        {errorMsg && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{errorMsg}</p>
        )}
        <button
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 px-4 py-4 text-base font-black text-white shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-navy-950 active:translate-y-0 disabled:opacity-60"
          disabled={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? "登入中..." : "登入"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
        <p className="text-xs text-slate-400 text-center">
          Demo 學生：demo001 / demo1234　管理員：admin / admin1234
        </p>
      </form>
      <p className="mt-6 text-center text-sm font-semibold text-slate-500">尚未有帳號？ <Link className="font-black text-navy-800 hover:text-navy-950" to="/register">前往註冊</Link></p>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAppState();
  const registerMutation = useRegister();
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");
    const form = new FormData(event.currentTarget);
    const student_number = String(form.get("studentNumber") || "");
    const username = String(form.get("username") || "");
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirmPassword") || "");
    const admission_year = Number(form.get("admissionYear") || 0);

    if (password !== confirm) {
      setErrorMsg("兩次輸入的密碼不一致");
      return;
    }

    try {
      const { token, user } = await registerMutation.mutateAsync({ student_number, username, name, email, password, admission_year });
      loginWithToken(token, user);
      navigate(getDefaultRouteForRole(user.role));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "註冊失敗，請稍後再試");
    }
  }

  return (
    <AuthFrame title="註冊帳號">
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="學號" icon={<UserRound className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="studentNumber" placeholder="111XXXXXX" required />
          </FieldShell>
          <FieldShell label="入學年度" icon={<BookOpenCheck className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="admissionYear" type="number" placeholder="111" required />
          </FieldShell>
        </div>
        <FieldShell label="使用者名稱（英文與數字）" icon={<UserRound className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="username" placeholder="例：john123" autoComplete="username" pattern="[a-zA-Z0-9]+" title="只能使用英文字母和數字" required />
        </FieldShell>
        <FieldShell label="姓名" icon={<UserRound className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="name" placeholder="王小明" required />
        </FieldShell>
        <FieldShell label="Email" icon={<Mail className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="email" type="email" placeholder="your@email.com" required />
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="密碼" icon={<Lock className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="password" type="password" placeholder="至少 6 個字元" required />
          </FieldShell>
          <FieldShell label="確認密碼" icon={<Lock className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="confirmPassword" type="password" placeholder="再輸入一次" required />
          </FieldShell>
        </div>
        {errorMsg && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{errorMsg}</p>
        )}
        <button
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 px-4 py-4 text-base font-black text-white shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-navy-950 active:translate-y-0 disabled:opacity-60"
          disabled={registerMutation.isPending}
          type="submit"
        >
          {registerMutation.isPending ? "建立中..." : "建立帳號"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </form>
      <p className="mt-6 text-center text-sm font-semibold text-slate-500">已有帳號？ <Link className="font-black text-navy-800 hover:text-navy-950" to="/login">回到登入</Link></p>
    </AuthFrame>
  );
}
