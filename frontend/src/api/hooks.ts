import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
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

export function useAuditHistory(userId: number) {
  return useQuery({
    queryKey: ["audit-history", userId],
    queryFn: ({ signal }) => apiClient.get<PaginatedRows<AuditHistoryRow>>(
      `/api/audit/history?userId=${userId}&limit=20`,
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
    }
  });
}

export function useDeleteManualCourse(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/admin/manual-courses/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-courses", userId] });
    }
  });
}
