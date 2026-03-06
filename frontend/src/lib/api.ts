const API_BASE = "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Insights ──
export const getOperationsOverview = () => fetchAPI<any>("/insights/overview");

// ── Company ──
export const getCompanyProfile = () => fetchAPI<any>("/company/profile");
export const updateCompanyProfile = (data: any) =>
  fetchAPI<any>("/company/profile", { method: "POST", body: JSON.stringify(data) });
export const getCompanyMetrics = () => fetchAPI<any>("/company/metrics");
export const getUploadedData = () =>
  fetchAPI<{ suppliers: any[]; sla: any[]; bom: any[] }>("/company/uploaded-data");

function normalizeAction(action: any): any {
  return {
    ...action,
    id: action.id || action.action_id,
    action_id: action.action_id || action.id,
    confidence: action.confidence ?? 85,
  };
}

// ── Actions ──
export const getPendingActions = async () => {
  const data = await fetchAPI<any>("/actions/pending");
  const actions = Array.isArray(data) ? data : (data.actions || []);
  return actions.map(normalizeAction);
};

export const getAllActions = async () => {
  const data = await fetchAPI<any>("/actions/all");
  const actions = Array.isArray(data) ? data : (data.actions || []);
  return actions.map(normalizeAction);
};
export const approveAction = (actionId: string) =>
  fetchAPI<any>(`/actions/${actionId}/approve`, { method: "POST" }).then(normalizeAction);
export const dismissAction = (actionId: string, reason?: string) =>
  fetchAPI<any>(`/actions/${actionId}/dismiss?reason=${encodeURIComponent(reason || "")}`, {
    method: "POST",
  }).then(normalizeAction);

// ── Agent ──
export const triggerMonitor = () => fetchAPI<any>("/agent/monitor");

// ── SSE Chat Stream ──
export interface SSEEvent {
  event: string;
  content?: string;
  agent?: string;
  type?: string;
  action_type?: string;
  action_id?: string;
  preview?: string;
  risk_score?: number;
  revenue_at_risk_eur?: number;
  tool?: string;
  from?: string;
  to?: string;
  task?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export async function streamChat(
  message: string,
  sessionId: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
  onEvent?: (event: SSEEvent) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
    signal,
  });

  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const data: SSEEvent = JSON.parse(trimmed.slice(6));

          // Emit raw event for full lifecycle tracking
          if (onEvent) onEvent(data);

          // Token/response events → onToken callback
          if (
            (data.event === "token" || data.type === "response") &&
            data.content
          ) {
            onToken(data.content);
          } else if (data.event === "done" || data.type === "done") {
            return;
          }
        } catch {
          const text = trimmed.slice(6);
          if (text && text !== "[DONE]") {
            onToken(text);
          }
        }
      }
    }
  }
}

// Upload Documents 
export async function uploadDocument(
    docType: "suppliers" | "sla" | "bom",
    file: File,
    companyId: string
  ): Promise<{ extracted: any[]; count: number }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("company_id", companyId);

    const res = await fetch(`${API_BASE}/upload/${docType}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }

export default API_BASE;
