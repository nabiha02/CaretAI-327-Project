import type { VisitRecord } from "../patient/types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export type ApiVisit = VisitRecord & {
  status: "In Progress" | "Confirmed" | "Reviewed";
  review: VisitRecord["review"] & {
    patientConfirmed?: boolean;
    patientCorrections?: Record<string, string>;
  };
};

export type ApiVisitSummary = Pick<
  ApiVisit,
  "id" | "date" | "mode" | "language" | "status" | "mainConcern" | "summary" | "review"
>;

export type ApiMessage = {
  id: number;
  visit_id: number;
  author: "CARETAI" | "Patient" | "Caregiver" | "Doctor";
  text: string;
  created_at: string;
};

export type ApiReport = {
  id: number;
  visit_id: number;
  report_name: string;
  status: "Draft" | "Pending" | "Shared" | "Available" | "Requested";
  summary: string | null;
  created_at: string;
  updated_at?: string;
};

export type ConversationProgress = { answered: number; total: number };
export type ConversationDetail = {
  visit: ApiVisit;
  messages: ApiMessage[];
  progress: ConversationProgress;
};
export type ConversationStart = {
  main_concern: string;
  mode: "Chat" | "Voice";
  language: "English" | "বাংলা";
  reporter: "Patient" | "Caregiver";
};
export type ConversationStartResult = ConversationDetail & {
  next_question: string;
  draft_report: null;
};
export type ConversationMessageResult = {
  visit: ApiVisit;
  message: ApiMessage;
  assistant_message: ApiMessage;
  progress: ConversationProgress;
  next_question: string | null;
  draft_report: ApiReport | null;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("Cannot reach the local CARETAI API. Start the FastAPI server and try again.");
  }

  if (!response.ok) {
    let message = `CARETAI API request failed (${response.status}).`;
    try {
      const error = await response.json() as { detail?: string };
      if (typeof error.detail === "string") message = error.detail;
    } catch {
      // Keep the status-based message when the server did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function listVisits(): Promise<ApiVisitSummary[]> {
  return apiRequest<ApiVisitSummary[]>("/visits/");
}

export function getVisit(visitId: number): Promise<ApiVisit> {
  return apiRequest<ApiVisit>(`/visits/${visitId}`);
}

export function getConversation(visitId: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${visitId}`);
}

export function startConversation(payload: ConversationStart): Promise<ConversationStartResult> {
  return apiRequest<ConversationStartResult>("/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendConversationMessage(visitId: number, text: string): Promise<ConversationMessageResult> {
  return apiRequest<ConversationMessageResult>(`/conversations/${visitId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function createDraftReport(visitId: number): Promise<{ report: ApiReport; visit: ApiVisit }> {
  return apiRequest<{ report: ApiReport; visit: ApiVisit }>(`/conversations/${visitId}/draft-report`, {
    method: "POST",
  });
}

export function confirmVisit(
  visitId: number,
  reviewedFields: Record<string, string>,
): Promise<{ visit: ApiVisit; report: ApiReport }> {
  return apiRequest<{ visit: ApiVisit; report: ApiReport }>(`/visits/${visitId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ reviewed_fields: reviewedFields }),
  });
}

export function listReports(visitId?: number): Promise<ApiReport[]> {
  const query = visitId === undefined ? "" : `?visit_id=${encodeURIComponent(visitId)}`;
  return apiRequest<ApiReport[]>(`/reports/${query}`);
}
