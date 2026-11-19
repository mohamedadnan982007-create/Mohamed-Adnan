import { FormEvent, useCallback, useState } from "react";
import {
  Compass,
  Map as MapIcon,
  Radio,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { ChennaiVectorMap } from "./components/ChennaiVectorMap";
import { LiveTransitTracker } from "./components/LiveTransitTracker";
import { SpatialCopilot } from "./components/SpatialCopilot";
import { WakeAlertModal } from "./components/WakeAlertModal";
import { INTENT_LENSES } from "./data/chennaiData";
import type {
  AppTab,
  ChennaiLandmark,
  CopilotRecommendation,
  CopilotResponse,
  IntentLensId,
  LandmarkId,
} from "./types/maps";

interface WakeAlertState {
  open: boolean;
  penultimateStopName: string;
  destinationName: string;
  routeLabel: string;
  vibrated: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("map");
  const [desktopSideTab, setDesktopSideTab] = useState<"copilot" | "tracker">("copilot");
  const [activeLens, setActiveLens] = useState<IntentLensId>("commute");
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<LandmarkId | null>(null);

  // Shared AI Spatial Copilot state
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copilotResult, setCopilotResult] = useState<CopilotResponse | null>(null);
  const [focusedRecommendation, setFocusedRecommendation] =
    useState<CopilotRecommendation | null>(null);

  // Live Transit Wake Alert modal state
  const [wakeAlert, setWakeAlert] = useState<WakeAlertState>({
    open: false,
    penultimateStopName: "",
    destinationName: "",
    routeLabel: "",
    vibrated: false,
  });

  const runCopilotSearch = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed) return;

      setCopilotQuery(trimmed);
      setCopilotLoading(true);
      setCopilotError(null);
      setActiveTab("copilot");
      setDesktopSideTab("copilot");

      try {
        const response = await fetch("/api/copilot/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: trimmed,
            activeLens,
          }),
        });

        const data = (await response.json()) as Partial<CopilotResponse> & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error || `Request failed with status ${response.status}`,
          );
        }

        if (!data.recommendations || data.recommendations.length === 0) {
          throw new Error("No Chennai recommendations were returned. Please try refining your query.");
        }

        const typedResult: CopilotResponse = {
          query: data.query ?? trimmed,
          summary:
            data.summary ?? "Top Chennai transit and spatial recommendations along your corridor.",
          recommendedLens: data.recommendedLens ?? activeLens,
          recommendations: data.recommendations,
        };

        setCopilotResult(typedResult);
        setActiveLens(typedResult.recommendedLens);
        setFocusedRecommendation(typedResult.recommendations[0]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Could not reach the spatial copilot service.";
        setCopilotError(message);
      } finally {
        setCopilotLoading(false);
      }
    },
    [activeLens],
  );

  const handleQuickMapSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim() || copilotLoading) return;
    void runCopilotSearch(copilotQuery);
  };

  const handleAskCopilotForLandmark = (landmark: ChennaiLandmark, lens: IntentLensId) => {
    const lensPromptMap: Record<IntentLensId, string> = {
      commute: `Fastest transit connections and transfer tips from ${landmark.name} in Chennai`,
      "quick-bite": `Best quick bite and filter coffee spots near ${landmark.name} under ₹180`,
      "quiet-study": `Quiet cafe or study space with Wi-Fi near ${landmark.name}`,
      "safe-night": `Well-lit safe night route and active transit options around ${landmark.name}`,
    };
    const prompt = lensPromptMap[lens];
    setSelectedLandmarkId(null);
    void runCopilotSearch(prompt);
  };

  const handleFocusRecommendation = (rec: CopilotRecommendation, lens: IntentLensId) => {
    setActiveLens(lens);
    setFocusedRecommendation(rec);
    setSelectedLandmarkId(null);
    setActiveTab("map");
  };

  const handleSelectNavTab = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab === "copilot" || tab === "tracker") {
      setDesktopSideTab(tab);
    }
  };

  return (
    <div className="h-[100dvh] w-full max-w-full overflow-hidden flex flex-col bg-[#080C15] text-slate-100">
      {/* Compact Top App Bar (52px) */}
      <header className="h-[52px] shrink-0 px-4 flex items-center justify-between gap-4 border-b border-white/8 bg-[#090E1B]/90 backdrop-blur-xl z-30">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-sky-500/18 border border-sky-400/40 flex items-center justify-center text-sky-300">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-white whitespace-nowrap">
            A-Maps
          </span>
        </div>

        {/* Desktop Mode Switcher (Hidden on Mobile where Bottom Bar handles nav) */}
        <nav
          aria-label="Desktop workspace modules"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <button
            type="button"
            onClick={() => handleSelectNavTab("copilot")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              desktopSideTab === "copilot"
                ? "text-white border-b-2 border-sky-400"
                : "hover:text-slate-200"
            }`}
          >
            Spatial Copilot
          </button>
          <button
            type="button"
            onClick={() => handleSelectNavTab("tracker")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              desktopSideTab === "tracker"
                ? "text-white border-b-2 border-sky-400"
                : "hover:text-slate-200"
            }`}
          >
            Live Transit
          </button>
        </nav>

        <div className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
          Chennai · {INTENT_LENSES[activeLens].shortLabel}
        </div>
      </header>

      {/* Main Responsive Workspace */}
      <main className="flex-1 min-h-0 w-full flex overflow-hidden relative">
        {/* Map Column: Always visible on desktop (lg:), visible when activeTab === 'map' on mobile */}
        <section
          aria-label="Chennai Intent Lenses Smart Map"
          className={`${
            activeTab === "map" ? "flex" : "hidden lg:flex"
          } flex-1 min-w-0 min-h-0 flex-col relative`}
        >
          {/* Floating AI Spatial Search Bar at the top of the Map View */}
          <div className="px-3 pt-2.5 pb-0.5 shrink-0 bg-[#070B14] z-20">
            <form
              onSubmit={handleQuickMapSearchSubmit}
              className="glass-surface rounded-2xl p-1 flex items-center gap-1.5 shadow-lg"
            >
              <div className="pl-2.5 text-sky-400 shrink-0" aria-hidden="true">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                onFocus={() => {
                  // Keep smooth inline typing on Map without jarring jump
                }}
                placeholder="Ask Chennai Copilot (e.g. quiet cafe near Guindy)..."
                aria-label="Quick AI Spatial Search"
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 py-2 px-1 focus:outline-none"
              />
              <button
                type="submit"
                disabled={copilotLoading || !copilotQuery.trim()}
                aria-label="Run spatial search"
                className="min-h-[38px] min-w-[38px] rounded-xl bg-sky-500/20 border border-sky-400/35 text-sky-200 flex items-center justify-center hover:bg-sky-500/30 disabled:opacity-40 cursor-pointer shrink-0 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="flex-1 min-h-0">
            <ChennaiVectorMap
              activeLens={activeLens}
              onSelectLens={setActiveLens}
              selectedLandmarkId={selectedLandmarkId}
              onSelectLandmark={setSelectedLandmarkId}
              focusedRecommendation={focusedRecommendation}
              onClearRecommendation={() => setFocusedRecommendation(null)}
              onAskCopilotForLandmark={handleAskCopilotForLandmark}
              onOpenLiveTracker={() => handleSelectNavTab("tracker")}
            />
          </div>
        </section>

        {/* Copilot & Live Tracker Panel: Full-screen tab on mobile, docked side rail on desktop */}
        <aside
          aria-label="Copilot and Live Transit Tools"
          className={`${
            activeTab !== "map" ? "flex" : "hidden lg:flex"
          } w-full lg:w-[420px] xl:w-[450px] shrink-0 min-h-0 flex-col lg:border-l border-white/8 bg-[#090E1B]`}
        >
          {/* Mobile renders whichever non-map tab is selected; Desktop renders desktopSideTab */}
          <div
            className={`${activeTab === "copilot" ? "flex" : "hidden"} ${
              desktopSideTab === "copilot" ? "lg:flex" : "lg:hidden"
            } flex-1 min-h-0 flex-col`}
          >
            <SpatialCopilot
              query={copilotQuery}
              onQueryChange={setCopilotQuery}
              onSubmitQuery={(q) => void runCopilotSearch(q)}
              loading={copilotLoading}
              error={copilotError}
              result={copilotResult}
              activeLens={activeLens}
              onFocusRecommendation={handleFocusRecommendation}
            />
          </div>

          <div
            className={`${activeTab === "tracker" ? "flex" : "hidden"} ${
              desktopSideTab === "tracker" ? "lg:flex" : "lg:hidden"
            } flex-1 min-h-0 flex-col`}
          >
            <LiveTransitTracker
              onTriggerWakeAlert={(payload) =>
                setWakeAlert({
                  open: true,
                  ...payload,
                })
              }
            />
          </div>
        </aside>
      </main>

      {/* Mobile One-Handed Bottom Navigation Bar (64px) */}
      <nav
        aria-label="Primary mobile navigation"
        className="lg:hidden h-[64px] shrink-0 glass-nav px-2 grid grid-cols-3 items-center z-30"
      >
        <button
          type="button"
          onClick={() => handleSelectNavTab("map")}
          aria-current={activeTab === "map" ? "page" : undefined}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors cursor-pointer ${
            activeTab === "map" ? "text-sky-300" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">
            Lenses Map
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectNavTab("copilot")}
          aria-current={activeTab === "copilot" ? "page" : undefined}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors cursor-pointer ${
            activeTab === "copilot" ? "text-sky-300" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">
            AI Copilot
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectNavTab("tracker")}
          aria-current={activeTab === "tracker" ? "page" : undefined}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors cursor-pointer ${
            activeTab === "tracker" ? "text-sky-300" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">
            Live Trip
          </span>
        </button>
      </nav>

      {/* Penultimate-Stop Wake Alert Visual + Haptic Modal */}
      <WakeAlertModal
        open={wakeAlert.open}
        penultimateStopName={wakeAlert.penultimateStopName}
        destinationName={wakeAlert.destinationName}
        routeLabel={wakeAlert.routeLabel}
        vibrated={wakeAlert.vibrated}
        onDismiss={() => setWakeAlert((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
