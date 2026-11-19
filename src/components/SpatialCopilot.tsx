import { FormEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  TrainFront,
  X,
} from "lucide-react";
import { COPILOT_SAMPLE_PROMPTS, INTENT_LENSES } from "../data/chennaiData";
import type {
  CopilotRecommendation,
  CopilotResponse,
  IntentLensId,
} from "../types/maps";

interface SpatialCopilotProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitQuery: (queryText: string) => void;
  loading: boolean;
  error: string | null;
  result: CopilotResponse | null;
  activeLens: IntentLensId;
  onFocusRecommendation: (rec: CopilotRecommendation, lens: IntentLensId) => void;
}

export function SpatialCopilot({
  query,
  onQueryChange,
  onSubmitQuery,
  loading,
  error,
  result,
  activeLens,
  onFocusRecommendation,
}: SpatialCopilotProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSubmitQuery(query.trim());
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Top Sample Prompt Chips + Floating Search Bar */}
      <div className="px-4 pt-3 pb-3 shrink-0 border-b border-white/8 bg-[#0A101E]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>AI Spatial Copilot</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Chennai Transit · {INTENT_LENSES[activeLens].shortLabel}
          </span>
        </div>

        {/* 3 Clickable Sample Prompt Chips Above the Input */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5"
          aria-label="Sample spatial prompts"
        >
          {COPILOT_SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={loading}
              onClick={() => {
                onQueryChange(sample);
                onSubmitQuery(sample);
              }}
              className="min-h-[36px] px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-[11px] text-slate-200 hover:border-sky-400/45 hover:text-sky-200 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Natural-Language Search Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Ask e.g. Quiet cafe near Guindy metro..."
              aria-label="Ask AI Spatial Search Copilot about Chennai"
              className="w-full min-h-[46px] pl-10 pr-9 py-2.5 rounded-2xl bg-slate-900/90 border border-white/12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20 transition-all"
            />
            {query && !loading && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            aria-label="Search Chennai spatial recommendations"
            className="min-h-[46px] min-w-[46px] px-3.5 rounded-2xl bg-sky-500 text-slate-950 font-semibold text-sm flex items-center justify-center hover:bg-sky-400 active:scale-[0.97] transition-all disabled:opacity-45 disabled:pointer-events-none cursor-pointer shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      {/* Scrollable Results Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3.5">
        {loading && (
          <div className="space-y-3" aria-live="polite" aria-label="Searching Chennai routes">
            <div className="glass-panel rounded-2xl p-4 space-y-2.5 animate-pulse">
              <div className="h-3 w-32 bg-slate-700/70 rounded" />
              <div className="h-4 w-3/4 bg-slate-700/60 rounded" />
              <div className="h-3 w-full bg-slate-800/80 rounded" />
            </div>
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-4 space-y-2.5 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 w-44 bg-slate-700/70 rounded" />
                  <div className="h-4 w-20 bg-slate-700/50 rounded" />
                </div>
                <div className="h-3 w-52 bg-slate-800/80 rounded" />
                <div className="h-3 w-full bg-slate-800/70 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-950/50 border border-rose-400/30 p-4 text-sm text-rose-100"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-100">Unable to complete spatial search</p>
                <p className="text-xs text-rose-200/85 mt-1 leading-relaxed">{error}</p>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => onSubmitQuery(query.trim())}
                    className="mt-3 min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-400/35 text-xs font-semibold text-rose-100 inline-flex items-center gap-1.5 hover:bg-rose-500/30 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Search</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && result && (
          <>
            {/* Spatial Summary Strip */}
            <div className="rounded-2xl bg-sky-500/10 border border-sky-400/25 px-4 py-3">
              <div className="flex items-center justify-between gap-2 text-[11px] text-sky-300 font-medium">
                <span>Spatial Route Strategy</span>
                <span>Lens · {INTENT_LENSES[result.recommendedLens].label}</span>
              </div>
              <p className="mt-1 text-xs text-slate-200 leading-relaxed">{result.summary}</p>
            </div>

            {/* 3 Structured Recommendation Cards */}
            <div className="space-y-3">
              {result.recommendations.map((rec, index) => (
                <article
                  key={rec.id}
                  className="glass-panel rounded-2xl p-4 transition-colors hover:border-sky-400/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="font-mono text-sky-300">0{index + 1}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{rec.area}</span>
                      </p>
                      <h3 className="text-[15px] font-bold text-white mt-0.5 leading-snug">
                        {rec.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-semibold text-sky-300 tabular-nums whitespace-nowrap shrink-0 pt-0.5">
                      {rec.detourTime}
                    </span>
                  </div>

                  {/* Transit Mode & Hyper-local Note (Clean Unboxed Metadata) */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5 text-slate-200 font-medium">
                      <TrainFront className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{rec.transitMode}</span>
                    </span>
                    <span className="text-slate-600" aria-hidden="true">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{rec.contextNote}</span>
                    </span>
                  </div>

                  {/* One-Sentence Fit Reason */}
                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                    {rec.reason}
                  </p>

                  {/* Map Handoff Action */}
                  <div className="mt-3 pt-2.5 border-t border-white/8 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>Anchor: {rec.nearestLandmarkId.replace("-", " ")}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onFocusRecommendation(rec, result.recommendedLens)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/8 hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 text-xs font-semibold text-sky-200 inline-flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>Show on Map</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!loading && !error && !result && (
          <div className="py-6 px-2 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/12 border border-sky-400/25 mx-auto flex items-center justify-center text-sky-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 max-w-xs mx-auto">
              <h3 className="text-base font-bold text-white">
                Hyper-local Chennai Spatial Search
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask for quiet work cafes near Metro stations, express tiffin spots along your route,
                or well-lit late-night transit corridors.
              </p>
            </div>
            <div className="pt-1 space-y-2 text-left">
              <p className="text-[11px] font-medium text-slate-400 px-1">
                One-tap demo queries
              </p>
              {COPILOT_SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    onQueryChange(sample);
                    onSubmitQuery(sample);
                  }}
                  className="w-full min-h-[48px] text-left glass-panel rounded-2xl px-3.5 py-3 text-xs text-slate-200 hover:border-sky-400/40 hover:text-white flex items-center justify-between gap-2.5 transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <span className="leading-snug">{sample}</span>
                  <ArrowUpRight className="w-4 h-4 text-sky-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
