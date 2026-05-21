import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, User } from "lucide-react";
import { useChangePassword, useMe, useUpdateProfile } from "../api/hooks";
import { useAppState } from "../state/AppState";

function SectionCard({ title, subtitle, icon, children }: {
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm shadow-blue-950/5">
      <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-800">
          {icon}
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-navy-950">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-navy-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <span className="shrink-0 text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

const inputCls = "h-12 w-full bg-transparent text-sm font-bold text-navy-950 outline-none placeholder:text-slate-400";

function PasswordField({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} icon={<Lock className="h-4 w-4" />}>
      <input className={inputCls} name={name} type={show ? "text" : "password"} placeholder={placeholder} required />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "隱藏密碼" : "顯示密碼"}
        className="shrink-0 p-1 text-slate-400 transition hover:text-navy-700"
        onClick={() => setShow(s => !s)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </Field>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{message}</div>
  );
}

export function ProfilePage() {
  const { currentUser, setCurrentUser } = useAppState();
  const { data: meData } = useMe();
  const freshUser = meData?.user ?? currentUser;
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileSuccess(""); setProfileError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    try {
      const { user } = await updateProfileMutation.mutateAsync({ name, email });
      setCurrentUser(user);
      setProfileSuccess("個人資料已更新");
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "更新失敗，請稍後再試");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordSuccess(""); setPasswordError("");
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    if (newPassword !== confirmPassword) { setPasswordError("兩次密碼不一致"); return; }
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      setPasswordSuccess("密碼已成功更新");
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "更新失敗，請稍後再試");
    }
  }

  const avatarLabel = freshUser.name?.slice(0, 1) || "U";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-5 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm shadow-blue-950/5">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffe0a6] to-[#79c7ff] text-2xl font-black text-navy-900 shadow-md">
          {avatarLabel}
        </div>
        <div>
          <p className="font-serif text-xl font-bold text-navy-950">{freshUser.name}</p>
          <p className="text-sm text-slate-500">{freshUser.email}</p>
          <span className="mt-1 inline-flex rounded-full bg-navy-50 px-3 py-0.5 text-xs font-black text-navy-700">
            {freshUser.role === "admin" ? "管理員" : "學生"}
          </span>
        </div>
      </div>

      <SectionCard title="個人資料" subtitle="修改你的姓名與 Email" icon={<User className="h-5 w-5" />}>
        <form key={freshUser.email} className="space-y-4" onSubmit={handleProfileSubmit}>
          <Field label="姓名" icon={<User className="h-4 w-4" />}>
            <input
              className="h-12 w-full bg-transparent text-sm font-bold text-navy-950 outline-none placeholder:text-slate-400"
              name="name"
              defaultValue={freshUser.name}
              placeholder="你的姓名"
              required
            />
          </Field>
          <Field label="Email" icon={<Mail className="h-4 w-4" />}>
            <input
              className="h-12 w-full bg-transparent text-sm font-bold text-navy-950 outline-none placeholder:text-slate-400"
              name="email"
              type="email"
              defaultValue={freshUser.email}
              placeholder="your@email.com"
              required
            />
          </Field>
          {profileSuccess && <SuccessBanner message={profileSuccess} />}
          {profileError && <ErrorBanner message={profileError} />}
          <button
            className="rounded-2xl bg-navy-900 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-navy-950 disabled:opacity-60"
            disabled={updateProfileMutation.isPending}
            type="submit"
          >
            {updateProfileMutation.isPending ? "儲存中..." : "儲存變更"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="修改密碼" subtitle="建議定期更換密碼以確保帳號安全" icon={<KeyRound className="h-5 w-5" />}>
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <PasswordField label="目前密碼" name="currentPassword" placeholder="••••••••" />
          <PasswordField label="新密碼" name="newPassword" placeholder="至少 6 個字元" />
          <PasswordField label="確認新密碼" name="confirmPassword" placeholder="再輸入一次" />
          {passwordSuccess && <SuccessBanner message={passwordSuccess} />}
          {passwordError && <ErrorBanner message={passwordError} />}
          <button
            className="rounded-2xl bg-navy-900 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-navy-950 disabled:opacity-60"
            disabled={changePasswordMutation.isPending}
            type="submit"
          >
            {changePasswordMutation.isPending ? "更新中..." : "更新密碼"}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
