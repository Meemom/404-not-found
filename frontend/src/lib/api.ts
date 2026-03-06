const API_BASE = "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Dashboard ──
export const getDashboardOverview = () => fetchAPI<any>("/dashboard/overview");
export const getGlobeData = () => fetchAPI<any>("/dashboard/globe-data");
export const getCascadeData = () => fetchAPI<any>("/dashboard/cascade-data");

// ── Company ──
export const getCompanyProfile = () => fetchAPI<any>("/company/profile");
export const updateCompanyProfile = (data: any) =>
  fetchAPI<any>("/company/profile", { method: "POST", body: JSON.stringify(data) });
export const getCompanyMetrics = () => fetchAPI<any>("/company/metrics");

// ── Actions ──
export const getPendingActions = () => fetchAPI<any>("/actions/pending");
export const getAllActions = () => fetchAPI<any>("/actions/all");
export const approveAction = (actionId: string) =>
  fetchAPI<any>(`/actions/${actionId}/approve`, { method: "POST" });
export const dismissAction = (actionId: string, reason?: string) =>
  fetchAPI<any>(`/actions/${actionId}/dismiss?reason=${encodeURIComponent(reason || "")}`, {
    method: "POST",
  });

// ── Agent ──
export const triggerMonitor = () => fetchAPI<any>("/agent/monitor");

// ── Memory ──
export const getDisruptionHistory = async (): Promise<any> => {
  const data = await fetchAPI<any>("/memory/disruptions");
  // Normalize: merge active + historical into a single disruptions array
  const active = (data.active || []).map((d: any) => ({
    ...d,
    id: d.disruption_id || d.id,
    status: "active",
    affected_suppliers: d.affected_supplier_ids,
  }));
  const historical = (data.historical || []).map((d: any) => ({
    ...d,
    id: d.disruption_id || d.id,
    status: d.resolved_at ? "resolved" : "monitoring",
    affected_suppliers: d.affected_supplier_ids,
  }));
  const patterns = (data.patterns || []).map((p: any) => ({
    ...p,
    title: p.pattern,
    description: p.recommendation,
    confidence: 85,
    occurrences: parseInt(p.frequency) || 3,
  }));
  return {
    ...data,
    disruptions: [...active, ...historical],
    patterns,
  };
};
export const getDisruptionDetail = (id: string) => fetchAPI<any>(`/memory/disruptions/${id}`);

// ── SSE Chat Stream ──
export async function streamChat(
  message: string,
  sessionId: string,
  onToken: (token: string) => void,
  signal?: AbortSignal
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
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === "response" && data.content) {
            onToken(data.content);
          } else if (data.type === "done") {
            return;
          }
        } catch {
          // If it's plain text, treat as token
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
