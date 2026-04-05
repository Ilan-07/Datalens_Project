import { httpClient } from "@/services/httpClient";

export const ACTIVE_SESSION_STORAGE_KEY = "datalens_active_session";

export function persistActiveSession(sessionId: string) {
  localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, sessionId);
}

export function getPersistedActiveSession() {
  return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
}

export function clearPersistedActiveSession() {
  localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
}

export async function uploadDataset(params: {
  file: File;
  problemStatement: string;
}) {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("problem_statement", params.problemStatement);

  const response = await httpClient.post("/api/upload", formData);

  return response.data;
}

export async function getAnalysisBySession(sessionId: string) {
  const response = await httpClient.get(`/api/analysis/${sessionId}`);

  return response.data;
}

export async function pingAnalysisSession(sessionId: string) {
  await httpClient.head(`/api/analysis/${sessionId}`);
}

export async function generateNarrative(sessionId: string) {
  const response = await httpClient.post(`/api/analysis/${sessionId}/narrative`);

  return response.data;
}

export async function getUserAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const response = await httpClient.get("/api/users/me/analyses");
  return response.data.reports || [];
}

export interface AnalysisHistoryItem {
  id: string;
  filename: string | null;
  rows: number | null;
  columns: number | null;
  health_score: number | null;
  created_at: string | null;
  status: string;
}
