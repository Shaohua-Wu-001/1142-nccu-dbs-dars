import { createContext, useContext, useMemo, useState } from "react";
import { clearToken, setToken } from "../api/client";
import type { StudentAcademicProfile } from "../lib/transcriptProfile";
import type { AuditResult, DemoUser, UserRole } from "../types/api";

const DEFAULT_USER: DemoUser = {
  id: 0,
  student_number: "",
  name: "",
  email: "",
  admission_year: 0,
  role: "student"
};

type AppState = {
  role: UserRole | null;
  currentUser: DemoUser;
  targetUserId: number;
  lastAuditResult: AuditResult | null;
  studentProfile: StudentAcademicProfile | null;
  targetStudentProfile: StudentAcademicProfile | null;
  setRole: (role: UserRole | null) => void;
  setCurrentUser: (user: DemoUser) => void;
  setTargetUserId: (userId: number) => void;
  setLastAuditResult: (result: AuditResult | null) => void;
  setStudentProfile: (profile: StudentAcademicProfile | null) => void;
  loginWithToken: (token: string, user: DemoUser) => void;
  logout: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

function readStoredUser(): DemoUser | null {
  const raw = localStorage.getItem("nccu-user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

function readTargetUserId(fallback: number) {
  const value = Number(localStorage.getItem("nccu-target-user-id") || String(fallback));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function profileStorageKey(userId: number) {
  return `nccu-student-profile:${userId}`;
}

function readStudentProfile(userId: number): StudentAcademicProfile | null {
  const raw = localStorage.getItem(profileStorageKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as StudentAcademicProfile : null;
  } catch {
    return null;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const storedUser = readStoredUser();
  const initialRole: UserRole | null = storedUser ? storedUser.role : null;
  const initialUser: DemoUser = storedUser ?? DEFAULT_USER;
  const initialTargetId = storedUser ? readTargetUserId(storedUser.id) : 1;

  const [role, setRoleState] = useState<UserRole | null>(initialRole);
  const [currentUser, setCurrentUserState] = useState<DemoUser>(initialUser);
  const [targetUserId, setTargetUserIdState] = useState(initialTargetId);
  const [lastAuditResult, setLastAuditResult] = useState<AuditResult | null>(null);
  const [studentProfile, setStudentProfileState] = useState<StudentAcademicProfile | null>(
    () => (storedUser ? readStudentProfile(storedUser.id) : null)
  );
  const [targetStudentProfile, setTargetStudentProfileState] = useState<StudentAcademicProfile | null>(
    () => readStudentProfile(initialTargetId)
  );

  const value = useMemo<AppState>(() => ({
    role,
    currentUser,
    targetUserId,
    lastAuditResult,
    studentProfile,
    targetStudentProfile,
    loginWithToken(token, user) {
      setToken(token);
      localStorage.setItem("nccu-user", JSON.stringify(user));
      setRoleState(user.role);
      setCurrentUserState(user);
      if (user.role === "student") {
        setTargetUserIdState(user.id);
        const profile = readStudentProfile(user.id);
        setStudentProfileState(profile);
        setTargetStudentProfileState(profile);
      } else {
        setStudentProfileState(null);
        const targetId = readTargetUserId(user.id);
        setTargetUserIdState(targetId);
        setTargetStudentProfileState(readStudentProfile(targetId));
      }
    },
    logout() {
      clearToken();
      localStorage.removeItem("nccu-user");
      localStorage.removeItem("nccu-target-user-id");
      setRoleState(null);
      setCurrentUserState(DEFAULT_USER);
      setStudentProfileState(null);
      setTargetStudentProfileState(null);
      setLastAuditResult(null);
    },
    setRole(nextRole) {
      setRoleState(nextRole);
    },
    setCurrentUser(user) {
      setCurrentUserState(user);
      localStorage.setItem("nccu-user", JSON.stringify(user));
      if (user.role === "student") {
        setTargetUserIdState(user.id);
        const profile = readStudentProfile(user.id);
        setStudentProfileState(profile);
        setTargetStudentProfileState(profile);
      } else {
        setStudentProfileState(null);
        setTargetStudentProfileState(readStudentProfile(targetUserId));
      }
    },
    setTargetUserId(userId) {
      localStorage.setItem("nccu-target-user-id", String(userId));
      setTargetUserIdState(userId);
      setTargetStudentProfileState(readStudentProfile(userId));
    },
    setLastAuditResult,
    setStudentProfile(profile) {
      if (profile) localStorage.setItem(profileStorageKey(currentUser.id), JSON.stringify(profile));
      else localStorage.removeItem(profileStorageKey(currentUser.id));
      setStudentProfileState(profile);
      if (currentUser.id === targetUserId) setTargetStudentProfileState(profile);
    }
  }), [currentUser, lastAuditResult, role, studentProfile, targetStudentProfile, targetUserId]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
