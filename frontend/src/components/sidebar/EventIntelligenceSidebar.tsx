"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2, Play, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWardenStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import type { ArticleResult, VideoResult } from "@/lib/types";

type IntelTab = "articles" | "videos" | "summary";

const RELATIVE_TIME = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relTime(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const sec = Math.floor((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return RELATIVE_TIME.format(sec, "second");
  if (abs < 3600) return RELATIVE_TIME.format(Math.round(sec / 60), "minute");
  if (abs < 86400) return RELATIVE_TIME.format(Math.round(sec / 3600), "hour");
  return RELATIVE_TIME.format(Math.round(sec / 86400), "day");
}

function sourceColor(name: string) {
  const s = name.toLowerCase();
  if (s.includes("reuters") || s.includes("bloomberg") || s.includes("financial times")) return "text-teal-600";
  if (s.includes("freightwaves") || s.includes("lloyd")) return "text-blue-600";
  return "text-slate-500";
}

function relevanceColor(score: number) {
  if (score > 0.7) return "bg-green-500";
  if (score >= 0.4) return "bg-amber-500";
  return "bg-slate-400";
}

function mcpDot(status: string) {
  if (status === "live" || status === "available") return "bg-teal-500";
  if (status === "fallback") return "bg-amber-500";
  return "bg-slate-400";
}

function extractKeywords(titles: string[]) {
  const stop = new Set(["the", "and", "for", "with", "from", "this", "that", "into", "over", "after", "amid", "during", "under", "event", "shipping"]);
  const counts = new Map<string, number>();
  for (const t of titles) {
    for (const w of t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w))) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);
}

function sevText(s: number) {
  if (s >= 8) return "Critical - immediate action recommended";
  if (s >= 5) return "Elevated - monitor closely";
  return "Low - watch for developments";
}

function VideoCard({ video, onWatch }: { video: VideoResult; onWatch: (v: VideoResult) => void }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="rounded-lg border p-2.5 space-y-2" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
      <div className="relative w-full overflow-hidden rounded-md" style={{ paddingTop: "56.25%" }}>
        {imgErr ? (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-xs text-slate-500">Thumbnail unavailable</div>
        ) : (
          <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 h-full w-full object-cover" onError={() => setImgErr(true)} />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="h-10 w-10 rounded-full bg-black/45 flex items-center justify-center">
            <Play size={16} className="text-white ml-0.5" fill="currentColor" />
          </span>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--w-ob-text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {video.title}
      </p>
      <div className="flex items-center justify-between gap-3 text-[11px]" style={{ color: "var(--w-ob-text-faint)" }}>
        <span className="truncate">{video.channel_name} · {relTime(video.published_at)}</span>
        <button type="button" onClick={() => onWatch(video)} className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">Watch -&gt;</button>
      </div>
    </div>
  );
}

interface EventIntelligenceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventIntelligenceSidebar({ isOpen, onClose }: EventIntelligenceSidebarProps) {
  const {
    selectedEvent,
    eventIntelligence,
    isLoadingIntelligence,
    intelligenceError,
    articleModalContent,
    fetchEventIntelligence,
    openArticleModal,
    closeArticleModal,
  } = useWardenStore(
    useShallow((s) => ({
      selectedEvent: s.selectedEvent,
      eventIntelligence: s.eventIntelligence,
      isLoadingIntelligence: s.isLoadingIntelligence,
      intelligenceError: s.intelligenceError,
      articleModalContent: s.articleModalContent,
      fetchEventIntelligence: s.fetchEventIntelligence,
      openArticleModal: s.openArticleModal,
      closeArticleModal: s.closeArticleModal,
    }))
  );

  const [activeTab, setActiveTab] = useState<IntelTab>("articles");
  const [toast, setToast] = useState<string | null>(null);
  const [articleMeta, setArticleMeta] = useState<{ title: string; source: string; url: string } | null>(null);

  const ev = selectedEvent;
  const intel = eventIntelligence;
  const loading = isLoadingIntelligence;

  const articles = intel?.articles ?? [];
  const videos = (intel?.videos ?? []).slice(0, 3);
  const mcpStatus = intel?.mcp_status ?? { brave_search: "fallback" as const, fetch: "unavailable" as const, youtube: "fallback" as const };

  const summary = useMemo(() => {
    const sources = new Set(articles.map((a) => a.source_name));
    return {
      sourceCount: sources.size,
      keywords: extractKeywords(articles.map((a) => a.title)),
      severityText: sevText(ev?.data.severity ?? 0),
    };
  }, [articles, ev?.data.severity]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && articleModalContent) {
        closeArticleModal();
        setArticleMeta(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [articleModalContent, closeArticleModal]);

  const openArticle = async (article: ArticleResult) => {
    setArticleMeta({ title: article.title, source: article.source_name, url: article.source_url });
    await openArticleModal(article.source_url);
  };

  const onWatchVideo = (video: VideoResult) => {
    if (video.is_mock) {
      setToast("Connect YouTube API for live videos");
      return;
    }
    window.open(video.watch_url, "_blank", "noopener,noreferrer");
  };

  const closeArticle = () => {
    closeArticleModal();
    setArticleMeta(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 z-40 md:hidden"
          />
          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed right-0 top-0 h-screen w-80 z-50 border-l flex flex-col"
            style={{ background: "var(--w-ob-surface)", borderColor: "var(--w-ob-border)" }}
          >
            <div className="px-5 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: "var(--w-ob-border)" }}>
              <div className="min-w-0">
                <h2 className="text-lg font-bold" style={{ color: "var(--w-ob-text)" }}>Event Intelligence</h2>
                <p className="text-xs truncate" style={{ color: "var(--w-ob-text-faint)" }}>{ev?.data.label ?? "No event selected"}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-slate-50"
                style={{ borderColor: "var(--w-ob-border)" }}
                aria-label="Close intelligence sidebar"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {!ev && (
                <p className="text-sm" style={{ color: "var(--w-ob-text-faint)" }}>
                  Select an event and click View Intelligence.
                </p>
              )}

              {ev && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2.5 border border-pink-200 bg-pink-50">
                      <p className="text-[10px] mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Severity</p>
                      <p className="text-lg font-bold text-pink-600">{ev.data.severity}/10</p>
                    </div>
                    <div className="rounded-lg p-2.5 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
                      <p className="text-[10px] mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Confidence</p>
                      <p className="text-lg font-bold text-blue-600">{ev.data.confidence}%</p>
                    </div>
                    <div className="rounded-lg p-2.5 border" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-bg-tint)" }}>
                      <p className="text-[10px] mb-1" style={{ color: "var(--w-ob-text-muted)" }}>Delay</p>
                      <p className="text-lg font-bold text-orange-500">{ev.data.delay}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>
                    <span className="flex items-center gap-1"><span className={cn("h-1.5 w-1.5 rounded-full", mcpDot(mcpStatus.brave_search))} /> News</span>
                    <span className="flex items-center gap-1"><span className={cn("h-1.5 w-1.5 rounded-full", mcpDot(mcpStatus.youtube))} /> Videos</span>
                    <span className="flex items-center gap-1"><span className={cn("h-1.5 w-1.5 rounded-full", mcpDot(mcpStatus.fetch))} /> Deep Fetch</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 rounded-lg p-1" style={{ background: "var(--w-ob-bg-tint)" }}>
                    {([
                      { key: "articles", label: `Articles (${articles.length})` },
                      { key: "videos", label: `Videos (${videos.length})` },
                      { key: "summary", label: "Summary" },
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                          activeTab === tab.key ? "text-teal-700 bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "articles" && (
                    <div className="space-y-3">
                      {loading && [0, 1, 2].map((i) => (
                        <div key={i} className="rounded-lg border p-3 animate-pulse" style={{ borderColor: "var(--w-ob-border)" }}>
                          <div className="h-3 w-1/3 bg-slate-200 rounded mb-2" /><div className="h-4 w-4/5 bg-slate-200 rounded mb-2" />
                          <div className="h-3 w-full bg-slate-200 rounded mb-1" /><div className="h-3 w-5/6 bg-slate-200 rounded" />
                        </div>
                      ))}
                      {!loading && intelligenceError && (
                        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "#fecaca", background: "#fff1f2", color: "#be123c" }}>{intelligenceError}</div>
                      )}
                      {!loading && !intelligenceError && articles.length === 0 && (
                        <p className="text-sm" style={{ color: "var(--w-ob-text-faint)" }}>No articles found for this event</p>
                      )}
                      {!loading && articles.map((article) => (
                        <div key={article.article_id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
                          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide">
                            <span className={cn("font-semibold", sourceColor(article.source_name))}>{article.source_name}</span>
                            <span style={{ color: "var(--w-ob-text-faint)" }}>{relTime(article.published_at)}</span>
                          </div>
                          <p className="text-sm font-medium" style={{ color: "var(--w-ob-text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {article.title}
                          </p>
                          <p className="text-xs" style={{ color: "var(--w-ob-text-faint)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {article.summary}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden flex-1">
                                <div className={cn("h-full rounded-full", relevanceColor(article.relevance_score))} style={{ width: `${Math.min(100, article.relevance_score * 100)}%` }} />
                              </div>
                              <span className="text-[10px]" style={{ color: "var(--w-ob-text-faint)" }}>Relevance</span>
                            </div>
                            <button type="button" onClick={() => openArticle(article)} className="text-xs font-medium text-teal-600 hover:text-teal-700">Read More -&gt;</button>
                          </div>
                          {article.is_mock && <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">CACHED</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "videos" && (
                    <div className="space-y-3">
                      {!loading && videos.length === 0 && <p className="text-sm" style={{ color: "var(--w-ob-text-faint)" }}>No videos found for this event</p>}
                      {videos.map((video) => (
                        <div key={video.video_id} className="space-y-1">
                          <VideoCard video={video} onWatch={onWatchVideo} />
                          {video.is_mock && <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">PREVIEW</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "summary" && (
                    <div className="space-y-3 text-sm">
                      <div className="rounded-lg border p-3" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
                        <p className="font-semibold mb-1" style={{ color: "var(--w-ob-text)" }}>Impact</p>
                        <p style={{ color: "var(--w-ob-text-faint)" }}>{summary.severityText}</p>
                      </div>
                      <div className="rounded-lg border p-3" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
                        <p className="font-semibold mb-2" style={{ color: "var(--w-ob-text)" }}>{summary.sourceCount} sources reporting</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.keywords.length === 0 && <span className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>No dominant keywords yet</span>}
                          {summary.keywords.map((kw) => <span key={kw} className="rounded-full px-2 py-0.5 text-xs bg-teal-50 text-teal-700 border border-teal-100">{kw}</span>)}
                        </div>
                      </div>
                      <div className="rounded-lg border p-3" style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
                        <p className="font-semibold mb-1" style={{ color: "var(--w-ob-text)" }}>Affected Regions</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ev.data.affectedRegions.length === 0 && <span className="text-xs" style={{ color: "var(--w-ob-text-faint)" }}>No regions listed</span>}
                          {ev.data.affectedRegions.map((r) => <span key={r} className="rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-600">{r}</span>)}
                        </div>
                      </div>
                      <div className="space-y-2 text-xs" style={{ color: "var(--w-ob-text-faint)" }}>
                        <p>Updated: {intel?.fetched_at ? relTime(intel.fetched_at) : "Not yet"}</p>
                        <button
                          type="button"
                          onClick={() => fetchEventIntelligence(ev)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100 disabled:opacity-60"
                        >
                          <RefreshCw size={12} className={cn(loading && "animate-spin")} /> Refresh Intelligence
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>

          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-4 right-4 z-[90] rounded-lg px-3 py-2 text-sm shadow-lg" style={{ background: "#0f172a", color: "#f8fafc" }}>
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {articleModalContent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[1px]"
                onClick={(e) => { if (e.target === e.currentTarget) closeArticle(); }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.18 }}
                  className="mx-auto mt-8 w-[min(900px,calc(100%-2rem))] max-h-[calc(100vh-4rem)] rounded-xl border flex flex-col"
                  style={{ borderColor: "var(--w-ob-border)", background: "var(--w-ob-surface)" }}>
                  <div className="px-5 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: "var(--w-ob-border)" }}>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold" style={{ color: "var(--w-ob-text)" }}>{articleMeta?.title ?? "Article"}</h4>
                      <p className="text-xs mt-1" style={{ color: "var(--w-ob-text-faint)" }}>{articleMeta?.source ?? "Source"}</p>
                    </div>
                    <button type="button" onClick={closeArticle} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-slate-50" style={{ borderColor: "var(--w-ob-border)" }} aria-label="Close">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {articleModalContent.is_loading && (
                      <div className="h-full min-h-56 flex flex-col items-center justify-center gap-2" style={{ color: "var(--w-ob-text-faint)" }}>
                        <Loader2 size={20} className="animate-spin" /><p>Fetching full article...</p>
                      </div>
                    )}
                    {!articleModalContent.is_loading && articleModalContent.fetch_success && (
                      <div className="mx-auto max-w-3xl text-[15px] leading-[1.7] whitespace-pre-wrap" style={{ color: "var(--w-ob-text)" }}>{articleModalContent.content}</div>
                    )}
                    {!articleModalContent.is_loading && !articleModalContent.fetch_success && (
                      <div className="mx-auto max-w-3xl space-y-3 text-sm">
                        <p style={{ color: "var(--w-ob-text)" }}>Could not load full article.</p>
                        <a href={articleMeta?.url ?? articleModalContent.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700">Open in browser -&gt;</a>
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--w-ob-border)" }}>
                    <a href={articleMeta?.url ?? articleModalContent.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                      <ExternalLink size={13} /> Open Original -&gt;
                    </a>
                    <button type="button" onClick={closeArticle} className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50" style={{ borderColor: "var(--w-ob-border)", color: "var(--w-ob-text-muted)" }}>Close</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
