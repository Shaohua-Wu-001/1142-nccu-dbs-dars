import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  AdminRegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  AuthResponse,
  AuditHistoryRow,
  AuditResult,
  AuditRunRequest,
  Course,
  LoginRequest,
  ManualCoursePayload,
  PaginatedRows,
  RegisterRequest,
  StudentCourse,
  TranscriptImportResult
} from "../types/api";

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => apiClient.post<AuthResponse>("/api/auth/login", payload)
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => apiClient.post<AuthResponse>("/api/auth/register", payload)
  });
}

export function useRegisterAdmin() {
  return useMutation({
    mutationFn: (payload: AdminRegisterRequest) => apiClient.post<AuthResponse>("/api/auth/register-admin", payload)
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<{ user: import("../types/api").DemoUser }>("/api/auth/me"),
    staleTime: 0
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => apiClient.patch<{ user: import("../types/api").DemoUser }>("/api/auth/profile", payload)
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => apiClient.patch<{ message: string }>("/api/auth/password", payload)
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => apiClient.post<{ message: string }>("/api/auth/forgot-password", payload)
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => apiClient.post<{ message: string }>("/api/auth/reset-password", payload)
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => apiClient.get<{ status: string }>("/api/health", signal),
    retry: 1
  });
}

export function useStudentCourses(userId: number) {
  return useQuery({
    queryKey: ["student-courses", userId],
    queryFn: ({ signal }) => apiClient.get<StudentCourse[]>(`/api/student-courses?userId=${userId}`, signal),
    enabled: Number.isFinite(userId)
  });
}

export function useUnresolvedCourses(userId: number) {
  return useQuery({
    queryKey: ["unresolved-courses", userId],
    queryFn: ({ signal }) => apiClient.get<{ count: number; rows: StudentCourse[]; note: string }>(
      `/api/student-courses/unresolved?userId=${userId}`,
      signal
    ),
    enabled: Number.isFinite(userId)
  });
}

export function useAuditHistory(userId: number, options: { visibleToStudent?: boolean } = {}) {
  const search = new URLSearchParams({ userId: String(userId), limit: "20" });
  if (options.visibleToStudent) search.set("visibleToStudent", "true");

  return useQuery({
    queryKey: ["audit-history", userId, options.visibleToStudent ? "student" : "all"],
    queryFn: ({ signal }) => apiClient.get<PaginatedRows<AuditHistoryRow>>(
      `/api/audit/history?${search.toString()}`,
      signal
    ),
    enabled: Number.isFinite(userId)
  });
}

export function useAuditHistoryDetail(id: number | null) {
  return useQuery({
    queryKey: ["audit-history-detail", id],
    queryFn: ({ signal }) => apiClient.get<AuditHistoryRow>(`/api/audit/history/${id}`, signal),
    enabled: Boolean(id)
  });
}

export function useLatestAuditResult(userId: number) {
  return useQuery({
    queryKey: ["audit-latest", userId],
    queryFn: ({ signal }) => apiClient.get<AuditHistoryRow>(
      `/api/audit/latest?userId=${userId}`,
      signal
    ),
    enabled: Number.isFinite(userId),
    retry: (failureCount, error) => (error as { status?: number }).status === 404 ? false : failureCount < 3
  });
}

export function useUpdateAuditHistoryName(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, auditName }: { id: number; auditName: string }) =>
      apiClient.patch<AuditHistoryRow>(`/api/audit/history/${id}`, { auditName }),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: ["audit-history", userId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-history", userId, "student"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-history", userId, "all"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-history-detail", row.id] });
    }
  });
}

export function useDeleteAuditHistory(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/audit/history/${id}`),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: ["audit-history", userId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-history", userId, "student"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-history", userId, "all"] });
      void queryClient.removeQueries({ queryKey: ["audit-history-detail", id] });
    }
  });
}

export function useCourses(params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return useQuery({
    queryKey: ["courses", params],
    queryFn: ({ signal }) => apiClient.get<PaginatedRows<Course>>(`/api/courses?${search.toString()}`, signal)
  });
}

export function useRequirements(year: string) {
  return useQuery({
    queryKey: ["requirements", year],
    queryFn: ({ signal }) => apiClient.get<{ curriculum: unknown; groups: Array<Record<string, unknown>> }>(
      `/api/curriculums/${year}/requirements`,
      signal
    )
  });
}

export function useImportTranscript(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { transcript: unknown; sourceFilename: string }) => apiClient.post<TranscriptImportResult>(
      "/api/transcripts/import",
      { userId, ...payload }
    ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["unresolved-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    }
  });
}

export function useRunAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AuditRunRequest) => apiClient.post<AuditResult>("/api/audit/run", payload),
    onSuccess: (_result, variables) => {
      if (variables.saveResult) {
        void queryClient.invalidateQueries({ queryKey: ["audit-history", variables.userId] });
        void queryClient.invalidateQueries({ queryKey: ["audit-history", variables.userId, "student"] });
        void queryClient.invalidateQueries({ queryKey: ["audit-history", variables.userId, "all"] });
        void queryClient.invalidateQueries({ queryKey: ["audit-latest", variables.userId] });
      }
    }
  });
}

export function useCreateManualCourse(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualCoursePayload) => apiClient.post<{ saved: boolean; created: boolean; row: StudentCourse }>(
      "/api/admin/manual-courses",
      payload
    ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["unresolved-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    }
  });
}

export function useUpdateManualCourse(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ManualCoursePayload> }) =>
      apiClient.patch<StudentCourse>(`/api/admin/manual-courses/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["unresolved-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    }
  });
}

export function useDeleteManualCourse(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/admin/manual-courses/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["unresolved-courses", userId] });
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    }
  });
}

export interface AdminStudentRow {
  userId: number;
  studentNumber: string | null;
  studentName: string | null;
  email: string | null;
  admissionYear: number | null;
  latestUploadAt: string | null;
  hasTranscript: boolean;
  unresolvedCount: number;
}

export function useAdminStudents() {
  return useQuery({
    queryKey: ["admin-students"],
    queryFn: () => apiClient.get<{ rows: AdminStudentRow[] }>("/api/admin/students")
  });
}
