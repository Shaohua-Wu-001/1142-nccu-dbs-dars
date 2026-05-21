import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { ApiError } from "../api/client";
import { getDefaultRouteForRole } from "../lib/navigation";
import { useAppState } from "../state/AppState";
import { useLogin, useRegister, useRegisterAdmin, useForgotPassword, useResetPassword } from "../api/hooks";
import type { DemoUser, UserRole } from "../types/api";
import nccuLogo from "../assets/nccu-logo.png";
import nccuMainGate from "../assets/nccu-gate-new.jpg";

function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-slate-900 lg:flex">
      {/* ── 左側：照片 + 品牌資訊 ─────────────────────── */}
      <section className="relative flex flex-col overflow-hidden bg-[#071f3f] px-8 py-8 text-white min-h-[52vh] lg:sticky lg:top-0 lg:h-screen lg:w-[56%] lg:px-14 lg:py-10">
        <div className="absolute inset-0 scale-[1.01] bg-cover bg-left" style={{ backgroundImage: `url(${nccuMainGate})` }} />
        <div className="absolute inset-0 bg-[#071f3f]/15 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(7,31,63,0.62)_0%,rgba(7,31,63,0.30)_50%,rgba(7,31,63,0.05)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#C5A059]" />

        <div className="relative z-10 flex h-full flex-col">
          {/* Header */}
          <header className="flex items-center gap-3">
            <img className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1.5 shadow-xl shadow-black/25" src={nccuLogo} alt="NCCU" />
            <div>
              <p className="font-serif text-base font-bold leading-snug">國立政治大學 應用數學系</p>
              <p className="text-[10px] font-semibold text-blue-100/65">Department of Mathematical Sciences, NCCU</p>
            </div>
          </header>

          {/* 主標題 */}
          <div className="flex flex-1 items-end pb-6 lg:items-center lg:pb-0">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-[#C5A059]/50 bg-black/20 px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4d68c] backdrop-blur-sm">
                Graduation Audit Platform
              </p>
              <h1
                className="font-serif text-5xl font-bold leading-[1.05] text-white lg:text-[4.5rem]"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85), 0 6px 32px rgba(0,0,0,0.55)" }}
              >
                畢業<br className="hidden lg:block" />審核系統
              </h1>
              <p className="mt-4 text-sm font-semibold text-blue-100/65 lg:text-[15px]">
                應用數學系畢業學分即時審核平台
              </p>
              <div className="mt-8 hidden space-y-3 lg:block">
                {["一鍵上傳修課紀錄", "自動比對畢業規則", "即時顯示缺修科目"].map((text) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm font-semibold text-blue-100/75">
                    <BookOpenCheck className="h-4 w-4 shrink-0 text-[#C5A059]" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="hidden border-t border-white/10 pt-4 lg:block">
            <p className="text-[10px] font-semibold text-blue-100/35">© 2025 國立政治大學 應用數學系</p>
          </footer>
        </div>
      </section>

      {/* ── 右側：登入表單 ────────────────────────────── */}
      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-14 lg:w-[44%]" id="auth-panel">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <img className="h-8 w-8 shrink-0 rounded-full border border-slate-100 bg-white object-contain p-1 shadow-sm" src={nccuLogo} alt="NCCU" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C5A059]">Secure Access · NCCU DARS</p>
            </div>
            <h2 className="font-serif text-[2.2rem] font-bold leading-tight text-navy-950">{title}</h2>
          </div>
          {children}
          <p className="mt-8 text-center text-[11px] font-semibold text-slate-400">
            國立政治大學 應用數學系 ·{" "}
            <a href="https://ms.nccu.edu.tw/" target="_blank" rel="noreferrer" className="hover:text-slate-600 hover:underline">
              ms.nccu.edu.tw
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

/* ── 共用元件（原始保留） ─────────────────────────── */
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

const fieldInput = "h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none placeholder:text-slate-400";

function RoleSelector({ role, setRole }: { role: UserRole; setRole: (role: UserRole) => void }) {
  const options: Array<{ value: UserRole; label: string; icon: React.ReactNode }> = [
    { value: "student", label: "學生",  icon: <UserRound   className="h-4 w-4" /> },
    { value: "admin",   label: "管理員", icon: <ShieldCheck className="h-4 w-4" /> },
  ];
  return (
    <div>
      <p className="mb-2 text-sm font-black text-slate-700">身份</p>
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
        {options.map((option) => (
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
              role === option.value ? "bg-white text-navy-950 shadow-sm" : "text-slate-500 hover:text-navy-900"
            }`}
            key={option.value}
            onClick={() => setRole(option.value)}
            type="button"
          >
            {option.icon}{option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {msg}
    </div>
  );
}

function PrimaryBtn({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      disabled={pending}
      type="submit"
      className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 px-4 py-4 text-base font-black text-white shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-navy-950 active:translate-y-0 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
      {!pending && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
    </button>
  );
}

function PasswordField({ label, name, placeholder, autoComplete, icon, required: req = false }: {
  label: string; name: string; placeholder: string;
  autoComplete?: string; icon?: React.ReactNode; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <FieldShell label={label} icon={icon ?? <Lock className="h-5 w-5" />}>
      <input
        className={fieldInput}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={req}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "隱藏密碼" : "顯示密碼"}
        className="shrink-0 p-1 text-slate-400 transition hover:text-navy-700"
        onClick={() => setShow(s => !s)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </FieldShell>
  );
}

/* ══════════════════════════════════════════════════════
   LOGIN PAGE  —  真實 JWT 登入
══════════════════════════════════════════════════════ */
export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAppState();
  const loginMutation = useLogin();
  const [role, setRole] = useState<UserRole>("student");
  const [errorMsg, setErrorMsg] = useState("");
  const [isCredentialsError, setIsCredentialsError] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setIsCredentialsError(false);
    const form = new FormData(e.currentTarget);
    try {
      const { token, user } = await loginMutation.mutateAsync({
        account:  String(form.get("account")  || ""),
        password: String(form.get("password") || ""),
      });
      if (user.role !== role) {
        setErrorMsg(`此帳號不是${role === "admin" ? "管理員" : "學生"}帳號，請選擇正確的身份`);
        return;
      }
      loginWithToken(token, user);
      navigate(getDefaultRouteForRole(user.role));
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setErrorMsg("帳號或密碼錯誤，請確認後再試。");
        setIsCredentialsError(true);
      } else {
        setErrorMsg(err instanceof Error ? err.message : "登入失敗，請稍後再試");
      }
    }
  }

  return (
    <AuthFrame title="登入系統">
      <form className="space-y-5" onSubmit={submit}>
        <RoleSelector role={role} setRole={setRole} />
        <FieldShell label="帳號" icon={<Mail className="h-5 w-5" />}>
          <input className={fieldInput} name="account" placeholder="使用者名稱或 Email" autoComplete="username" />
        </FieldShell>
        <PasswordField label="密碼" name="password" placeholder="••••••••" autoComplete="current-password" />
        {errorMsg && (
          <div className="space-y-2">
            <ErrMsg msg={errorMsg} />
            {isCredentialsError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">
                  忘記密碼了嗎？{" "}
                  <Link className="font-black underline decoration-amber-400 underline-offset-2 hover:text-amber-900" to="/forgot-password">
                    點此重設密碼
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
        <PrimaryBtn pending={loginMutation.isPending} label="登入" pendingLabel="登入中…" />
        <p className="text-center text-sm text-slate-500">
          <Link className="font-black text-navy-800 hover:text-navy-950" to="/forgot-password">忘記密碼？</Link>
        </p>
      </form>
      <p className="mt-6 text-center text-sm font-semibold text-slate-500">
        尚未有帳號？ <Link className="font-black text-navy-800 hover:text-navy-950" to="/register">前往註冊</Link>
      </p>
    </AuthFrame>
  );
}

/* ══════════════════════════════════════════════════════
   REGISTER PAGE  —  學生 / 管理員（含密鑰）真實 API
══════════════════════════════════════════════════════ */
export function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAppState();
  const registerMutation      = useRegister();
  const registerAdminMutation = useRegisterAdmin();
  const [role, setRole]       = useState<UserRole>("student");
  const [errorMsg, setErrorMsg] = useState("");
  const isPending = registerMutation.isPending || registerAdminMutation.isPending;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    const form     = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm  = String(form.get("confirmPassword") || "");
    if (password !== confirm) { setErrorMsg("兩次輸入的密碼不一致"); return; }
    try {
      let token: string; let user: DemoUser;
      if (role === "admin") {
        const r = await registerAdminMutation.mutateAsync({
          username:     String(form.get("username")    || ""),
          name:         String(form.get("name")        || ""),
          email:        String(form.get("email")       || ""),
          password,
          admin_secret: String(form.get("adminSecret") || ""),
        });
        token = r.token; user = r.user;
      } else {
        const r = await registerMutation.mutateAsync({
          student_number: String(form.get("studentNumber")  || ""),
          username:       String(form.get("username")       || ""),
          name:           String(form.get("name")           || ""),
          email:          String(form.get("email")          || ""),
          password,
          admission_year: Number(form.get("admissionYear")  || 0),
        });
        token = r.token; user = r.user;
      }
      loginWithToken(token, user);
      navigate(getDefaultRouteForRole(user.role));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "註冊失敗，請稍後再試");
    }
  }

  return (
    <AuthFrame title="建立帳號">
      <form className="space-y-4" onSubmit={submit}>
        <RoleSelector role={role} setRole={setRole} />

        {role === "student" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label="學號" icon={<UserRound className="h-5 w-5" />}>
              <input className={fieldInput} name="studentNumber" placeholder="111XXXXXX" required />
            </FieldShell>
            <FieldShell label="入學年度" icon={<BookOpenCheck className="h-5 w-5" />}>
              <input className={fieldInput} name="admissionYear" type="number" placeholder="111" required />
            </FieldShell>
          </div>
        )}

        <FieldShell label="使用者名稱" icon={<UserRound className="h-5 w-5" />}>
          <input className={fieldInput} name="username"
            placeholder={role === "student" ? "例：john123" : "例：admin01"}
            autoComplete="username" pattern="[a-zA-Z0-9]+" required />
        </FieldShell>
        <FieldShell label="姓名" icon={<UserRound className="h-5 w-5" />}>
          <input className={fieldInput} name="name" placeholder="王小明" required />
        </FieldShell>
        <FieldShell label="Email" icon={<Mail className="h-5 w-5" />}>
          <input className={fieldInput} name="email" type="email" placeholder="your@email.com" required />
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField label="密碼" name="password" placeholder="至少 6 字元" required />
          <PasswordField label="確認密碼" name="confirmPassword" placeholder="再輸入一次" required />
        </div>

        {role === "admin" && (
          <PasswordField
            label="管理員密鑰"
            name="adminSecret"
            placeholder="請輸入管理員密鑰"
            icon={<ShieldCheck className="h-5 w-5" />}
            required
          />
        )}

        {errorMsg && <ErrMsg msg={errorMsg} />}
        <PrimaryBtn pending={isPending} label="建立帳號" pendingLabel="建立中…" />
      </form>
      <p className="mt-6 text-center text-sm font-semibold text-slate-500">
        已有帳號？ <Link className="font-black text-navy-800 hover:text-navy-950" to="/login">回到登入</Link>
      </p>
    </AuthFrame>
  );
}

/* ══════════════════════════════════════════════════════
   FORGOT PASSWORD PAGE
══════════════════════════════════════════════════════ */
export function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword();
  const [errorMsg, setErrorMsg] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    try {
      await forgotMutation.mutateAsync({ email: String(new FormData(e.currentTarget).get("email") || "") });
      setSent(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "發送失敗，請稍後再試");
    }
  }

  return (
    <AuthFrame title="忘記密碼">
      {sent ? (
        <div className="space-y-5 py-2 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 ring-2 ring-emerald-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-navy-950">重設連結已寄出</p>
          <p className="text-sm font-semibold text-slate-500">請檢查你的信箱，連結 1 小時後失效。</p>
          <Link className="inline-block font-black text-navy-800 hover:text-navy-950" to="/login">← 回到登入</Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={submit}>
          <p className="text-sm font-semibold text-slate-500">輸入帳號 Email，我們將寄送密碼重設連結。</p>
          <FieldShell label="Email" icon={<Mail className="h-5 w-5" />}>
            <input className={fieldInput} name="email" type="email" placeholder="your@email.com" required />
          </FieldShell>
          {errorMsg && <ErrMsg msg={errorMsg} />}
          <PrimaryBtn pending={forgotMutation.isPending} label="寄送重設連結" pendingLabel="寄送中…" />
          <p className="text-center text-sm font-semibold text-slate-500">
            <Link className="font-black text-navy-800 hover:text-navy-950" to="/login">← 回到登入</Link>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}

/* ══════════════════════════════════════════════════════
   RESET PASSWORD PAGE
══════════════════════════════════════════════════════ */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const resetMutation = useResetPassword();
  const [errorMsg, setErrorMsg] = useState("");
  const token = new URLSearchParams(window.location.search).get("token") || "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    const form     = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm  = String(form.get("confirmPassword") || "");
    if (password !== confirm) { setErrorMsg("兩次密碼不一致"); return; }
    try {
      await resetMutation.mutateAsync({ token, password });
      navigate("/login");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "重設失敗，請重新申請");
    }
  }

  if (!token) return (
    <AuthFrame title="連結無效">
      <p className="text-sm font-semibold text-slate-500">連結已失效，請重新申請忘記密碼。</p>
      <Link className="mt-4 inline-block font-black text-navy-800 hover:text-navy-950" to="/forgot-password">重新申請 →</Link>
    </AuthFrame>
  );

  return (
    <AuthFrame title="設定新密碼">
      <form className="space-y-5" onSubmit={submit}>
        <PasswordField label="新密碼" name="password" placeholder="至少 6 個字元" required />
        <PasswordField label="確認新密碼" name="confirmPassword" placeholder="再輸入一次" required />
        {errorMsg && <ErrMsg msg={errorMsg} />}
        <PrimaryBtn pending={resetMutation.isPending} label="確認重設密碼" pendingLabel="重設中…" />
      </form>
    </AuthFrame>
  );
}
