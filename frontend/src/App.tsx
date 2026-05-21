import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useAppState } from "./state/AppState";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "./pages/AuthPages";
import { ProfilePage } from "./pages/ProfilePage";
import {
  AuditHistoryPage,
  AuditResultPage,
  AuditRunPage,
  StudentCoursesPage,
  StudentDashboard,
  StudentImportPage
} from "./pages/StudentPages";
import {
  AdminAuditHistoryPage,
  AdminCoursesPage,
  AdminDashboard,
  AdminManualCoursesPage,
  AdminRequirementsPage,
  AdminStudentsPage,
  AdminUnresolvedPage
} from "./pages/AdminPages";
import { EmptyState } from "./components/States";

function RequireRole({ role, children }: { role: "student" | "admin"; children: React.ReactNode }) {
  const { role: currentRole } = useAppState();
  if (!currentRole) return <Navigate to="/login" replace />;
  if (currentRole !== role) return <Navigate to={currentRole === "admin" ? "/admin" : "/student"} replace />;
  return <>{children}</>;
}

export function App() {
  const { role } = useAppState();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={role ? (role === "admin" ? "/admin" : "/student") : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/student" element={<RequireRole role="student"><AppShell role="student" /></RequireRole>}>
        <Route index element={<StudentDashboard />} />
        <Route path="import" element={<StudentImportPage />} />
        <Route path="courses" element={<StudentCoursesPage />} />
        <Route path="audit/run" element={<AuditRunPage />} />
        <Route path="audit/result" element={<AuditResultPage />} />
        <Route path="audit/history" element={<AuditHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/admin" element={<RequireRole role="admin"><AppShell role="admin" /></RequireRole>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="unresolved" element={<AdminUnresolvedPage />} />
        <Route path="manual-courses" element={<AdminManualCoursesPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="requirements" element={<AdminRequirementsPage />} />
        <Route path="audit-history" element={<AdminAuditHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<div className="min-h-screen bg-slate-100 p-6"><EmptyState title="找不到頁面" /></div>} />
    </Routes>
  );
}
