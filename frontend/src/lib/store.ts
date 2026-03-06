import { create } from "zustand";
import type {
  CompanyProfile,
  DashboardOverview,
  PendingAction,
  ChatMessage,
  Disruption,
  GlobeData,
} from "./types";

interface WardenState {
  // Company
  company: CompanyProfile | null;
  setCompany: (c: CompanyProfile) => void;

  // Dashboard
  dashboard: DashboardOverview | null;
  setDashboard: (d: DashboardOverview) => void;

  // Globe
  globeData: GlobeData | null;
  setGlobeData: (g: GlobeData) => void;

  // Actions
  pendingActions: PendingAction[];
  setPendingActions: (a: PendingAction[]) => void;
  addAction: (a: PendingAction) => void;
  updatePendingAction: (id: string, updated: PendingAction) => void;
  updateActionStatus: (id: string, status: PendingAction["status"]) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  isThinking: boolean;
  setIsThinking: (v: boolean) => void;
  sessionId: string;

  // Disruptions
  activeDisruptions: Disruption[];
  setActiveDisruptions: (d: Disruption[]) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  // Agent active indicator
  agentActive: boolean;
  setAgentActive: (v: boolean) => void;

  // Onboarding
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
}

export const useWardenStore = create<WardenState>((set, get) => ({
  // Company
  company: null,
  setCompany: (company) => set({ company }),

  // Dashboard
  dashboard: null,
  setDashboard: (dashboard) => set({ dashboard }),

  // Globe
  globeData: null,
  setGlobeData: (globeData) => set({ globeData }),

  // Actions
  pendingActions: [],
  setPendingActions: (pendingActions) => set({ pendingActions }),
  addAction: (action) =>
    set((s) => ({ pendingActions: [...s.pendingActions, action] })),
  updatePendingAction: (id, updated) =>
    set((s) => ({
      pendingActions: s.pendingActions.map((a) =>
        a.action_id === id || a.id === id ? updated : a
      ),
    })),
  updateActionStatus: (id, status) =>
    set((s) => ({
      pendingActions: s.pendingActions.map((a) =>
        a.action_id === id || a.id === id ? { ...a, status } : a
      ),
    })),

  // Chat
  messages: [],
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  updateLastAssistantMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const lastIdx = msgs.findLastIndex((m) => m.role === "assistant");
      if (lastIdx >= 0) {
        msgs[lastIdx] = { ...msgs[lastIdx], content: msgs[lastIdx].content + content };
      }
      return { messages: msgs };
    }),
  isThinking: false,
  setIsThinking: (isThinking) => set({ isThinking }),
  sessionId: "default",

  // Disruptions
  activeDisruptions: [],
  setActiveDisruptions: (activeDisruptions) => set({ activeDisruptions }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  // Agent active
  agentActive: true,
  setAgentActive: (agentActive) => set({ agentActive }),

  // Onboarding
  onboarded: typeof window !== "undefined" ? localStorage.getItem("warden_onboarded") === "true" : false,
  setOnboarded: (onboarded) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("warden_onboarded", String(onboarded));
    }
    set({ onboarded });
  },
}));
