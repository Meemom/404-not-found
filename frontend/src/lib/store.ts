import { create } from "zustand";
import {
  fetchArticleContent as fetchArticleContentAPI,
  fetchEventIntelligence as fetchEventIntelligenceAPI,
} from "./api";
import type {
  ArticleContent,
  CompanyProfile,
  DashboardOverview,
  EventIntelligence,
  EventNode,
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

  // Perception intelligence
  selectedEvent: EventNode | null;
  eventIntelligence: EventIntelligence | null;
  isLoadingIntelligence: boolean;
  intelligenceError: string | null;
  articleModalContent: ArticleContent | null;
  latestIntelligenceEventId: string | null;
  selectEvent: (node: EventNode | null) => void;
  fetchEventIntelligence: (node: EventNode) => Promise<void>;
  clearEventSelection: () => void;
  openArticleModal: (url: string) => Promise<void>;
  closeArticleModal: () => void;

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

  // Perception intelligence
  selectedEvent: null,
  eventIntelligence: null,
  isLoadingIntelligence: false,
  intelligenceError: null,
  articleModalContent: null,
  latestIntelligenceEventId: null,
  selectEvent: (node) =>
    set({
      selectedEvent: node,
      intelligenceError: null,
      articleModalContent: null,
    }),
  fetchEventIntelligence: async (node) => {
    const eventId = node.id;
    set({
      isLoadingIntelligence: true,
      intelligenceError: null,
      eventIntelligence: null,
    });

    try {
      const intelligence = await fetchEventIntelligenceAPI(
        node.id,
        node.data.label,
        node.data.eventType.toLowerCase(),
        node.data.affectedRegions,
        node.data.severity,
      );

      if (get().selectedEvent?.id !== eventId) {
        return;
      }

      set({
        eventIntelligence: intelligence,
        isLoadingIntelligence: false,
        latestIntelligenceEventId: eventId,
      });

      setTimeout(() => {
        if (get().selectedEvent?.id === eventId) {
          set({ latestIntelligenceEventId: null });
        }
      }, 1600);
    } catch (error) {
      if (get().selectedEvent?.id !== eventId) {
        return;
      }

      set({
        isLoadingIntelligence: false,
        intelligenceError:
          error instanceof Error
            ? error.message
            : "Could not fetch intelligence for this event.",
      });
    }
  },
  clearEventSelection: () =>
    set({
      selectedEvent: null,
      eventIntelligence: null,
      isLoadingIntelligence: false,
      intelligenceError: null,
      articleModalContent: null,
      latestIntelligenceEventId: null,
    }),
  openArticleModal: async (url) => {
    set({
      articleModalContent: {
        url,
        content: "",
        word_count: 0,
        fetch_success: false,
        is_loading: true,
      },
    });

    try {
      const article = await fetchArticleContentAPI(url);
      set({
        articleModalContent: {
          ...article,
          url,
          is_loading: false,
        },
      });
    } catch (error) {
      set({
        articleModalContent: {
          url,
          content: "",
          word_count: 0,
          fetch_success: false,
          is_loading: false,
          error: error instanceof Error ? error.message : "Could not load article.",
        },
      });
    }
  },
  closeArticleModal: () => set({ articleModalContent: null }),

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
