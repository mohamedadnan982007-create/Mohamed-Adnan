import { useMemo, useState } from "react";
import {
  Compass,
  Crosshair,
  Minus,
  Navigation,
  Plus,
  Sparkles,
  TrainFront,
  X,
} from "lucide-react";
import {
  CHENNAI_LANDMARKS,
  INTENT_LENSES,
  LENS_ORDER,
  TRANSIT_LINES,
} from "../data/chennaiData";
import type {
  ChennaiLandmark,
  CopilotRecommendation,
  IntentLensId,
  LandmarkId,
} from "../types/maps";

interface ChennaiVectorMapProps {
  activeLens: IntentLensId;
  onSelectLens: (lens: IntentLensId) => void;
  selectedLandmarkId: LandmarkId | null;
  onSelectLandmark: (id: LandmarkId | null) => void;
  focusedRecommendation: CopilotRecommendation | null;
  onClearRecommendation: () => void;
  onAskCopilotForLandmark: (landmark: ChennaiLandmark, lens: IntentLensId) => void;
  onOpenLiveTracker: () => void;
}

export function ChennaiVectorMap({
  activeLens,
  onSelectLens,
  selectedLandmarkId,
  onSelectLandmark,
  focusedRecommendation,
  onClearRecommendation,
  onAskCopilotForLandmark,
  onOpenLiveTracker,
}: ChennaiVectorMapProps) {
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(false);

  const lensConfig = INTENT_LENSES[activeLens];

  const selectedLandmark = useMemo(
    () => CHENNAI_LANDMARKS.find((l) => l.id === selectedLandmarkId) ?? null,
    [selectedLandmarkId],
  );

  const handleZoomIn = () => setZoom((z) => Math.min(1.45, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.9, Number((z - 0.15).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    onSelectLandmark(null);
    onClearRecommendation();
  };

  return (
    <div className="relative flex flex-col w-full h-full min-h-0 overflow-hidden bg-[#070B14]">
      {/* Intent Lens Filter Bar */}
      <div className="relative z-20 px-3 pt-2 pb-2 shrink-0">
        <div
          role="tablist"
          aria-label="Intent Lenses"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
        >
          {LENS_ORDER.map((lensId) => {
            const cfg = INTENT_LENSES[lensId];
            const isActive = activeLens === lensId;
            return (
              <button
                key={lensId}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectLens(lensId)}
                className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.97] ${
                  isActive
                    ? cfg.activePillClass
                    : "bg-slate-900/75 text-slate-300 border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-slate-400 truncate">
          {lensConfig.headline}
        </p>
      </div>

      {/* Interactive Stylized Vector Map Canvas */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {/* Subtle Ambient Lens Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 54% 46%, ${lensConfig.glowHex} 0%, rgba(8, 12, 21, 0) 68%)`,
            opacity: activeLens === "safe-night" ? 0.52 : 0.3,
          }}
        />

        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "50% 48%" }}
        >
          <svg
            viewBox="0 0 400 540"
            className="w-full h-full max-w-full max-h-full select-none"
            role="img"
            aria-label="Interactive vector transit map of Chennai showing landmarks and Metro and Suburban rail corridors"
          >
            <defs>
              <linearGradient id="bayOfBengal" x1="0" y1="0" x2="1" y2="0.4">
                <stop offset="0%" stopColor="#0B192E" />
                <stop offset="100%" stopColor="#07101E" />
              </linearGradient>
              <linearGradient id="landmass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0E1525" />
                <stop offset="100%" stopColor="#0A0F1C" />
              </linearGradient>
              <filter id="routeGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="nightAura" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ocean Base (Bay of Bengal) */}
            <rect x="0" y="0" width="400" height="540" fill="url(#bayOfBengal)" />

            {/* Subtle Ocean Depth Contours */}
            <path
              d="M 358 0 Q 348 140 342 220 Q 326 340 306 540"
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <path
              d="M 380 0 Q 370 140 364 220 Q 348 340 330 540"
              fill="none"
              stroke="rgba(56, 189, 248, 0.05)"
              strokeWidth="1"
            />

            {/* Chennai Landmass Silhouette */}
            <path
              d="M 0 0 L 326 0 Q 324 58 320 96 Q 332 146 330 184 Q 322 232 308 272 Q 294 316 296 368 Q 292 436 280 540 L 0 540 Z"
              fill="url(#landmass)"
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth="1.2"
            />

            {/* Urban Micro Grid */}
            <g stroke="rgba(148, 163, 184, 0.05)" strokeWidth="0.8">
              <line x1="60" y1="0" x2="60" y2="540" />
              <line x1="120" y1="0" x2="120" y2="540" />
              <line x1="180" y1="0" x2="180" y2="540" />
              <line x1="240" y1="0" x2="240" y2="540" />
              <line x1="0" y1="90" x2="318" y2="90" />
              <line x1="0" y1="180" x2="328" y2="180" />
              <line x1="0" y1="270" x2="308" y2="270" />
              <line x1="0" y1="360" x2="294" y2="360" />
              <line x1="0" y1="450" x2="286" y2="450" />
            </g>

            {/* Cooum & Adyar Rivers */}
            <path
              d="M 24 124 Q 112 134 188 128 Q 254 126 324 134"
              fill="none"
              stroke="rgba(56, 189, 248, 0.16)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M 18 332 Q 118 316 196 306 Q 258 298 302 288"
              fill="none"
              stroke="rgba(56, 189, 248, 0.18)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Subtle Secondary Arterial Roads (Inner Ring Rd / GST / Velachery) */}
            <g stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1.3" fill="none">
              <path d="M 86 74 Q 98 180 122 288 L 160 350 L 246 392" />
              <path d="M 184 316 L 236 352 L 274 342" />
              <path d="M 192 214 L 242 184 L 326 174" />
            </g>

            {/* Safe Night Route Extra Warm Streetlight Illumination */}
            {activeLens === "safe-night" && (
              <g filter="url(#nightAura)" opacity="0.58">
                <path
                  d="M 268 94 L 242 184 L 184 316 L 106 490"
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 326 174 L 306 238 L 266 296 L 280 384 L 264 474"
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Bay of Bengal Label */}
            <text
              x="364"
              y="260"
              fill="rgba(148, 163, 184, 0.38)"
              fontSize="9"
              fontWeight="600"
              letterSpacing="2.4"
              transform="rotate(-84 364 260)"
              textAnchor="middle"
            >
              BAY OF BENGAL
            </text>

            {/* Transit Corridors */}
            {TRANSIT_LINES.map((line) => {
              const isHighlighted = lensConfig.highlightedLines.includes(line.id);
              const strokeColor =
                activeLens === "safe-night" && isHighlighted
                  ? "#FACC15"
                  : activeLens === "quiet-study" && line.id === "omr-arterial"
                    ? "#2DD4BF"
                    : line.color;

              return (
                <g key={line.id}>
                  {/* Base Route */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHighlighted ? 3.5 : 1.75}
                    strokeOpacity={isHighlighted ? 0.92 : 0.25}
                    strokeDasharray={line.dashed ? "6 4" : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={isHighlighted ? "url(#routeGlow)" : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Subtle Animated Flow on Highlighted Lines */}
                  {isHighlighted && (
                    <path
                      d={line.pathD}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.4"
                      strokeOpacity="0.48"
                      strokeDasharray="4 24"
                      strokeLinecap="round"
                      className="animate-route-flow"
                    />
                  )}

                  {/* Intermediate Minor Station Nodes */}
                  {line.stations.map((st) => (
                    <g key={`${line.id}-${st.name}`}>
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r={isHighlighted ? 2.6 : 1.8}
                        fill="#0B1120"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 1.5 : 1}
                        opacity={isHighlighted ? 0.95 : 0.35}
                      />
                    </g>
                  ))}
                </g>
              );
            })}

            {/* Primary Chennai Landmark Pins & Smart Contextual Badges */}
            {CHENNAI_LANDMARKS.map((landmark) => {
              const insight = landmark.lenses[activeLens];
              const isSelected = selectedLandmarkId === landmark.id;
              const isAiMatch = focusedRecommendation?.nearestLandmarkId === landmark.id;
              const isProminent = insight.recommended || isSelected || isAiMatch;

              const pinColor = isAiMatch
                ? "#38BDF8"
                : isProminent
                  ? lensConfig.accentHex
                  : "#64748B";

              // Keep contextual badge safely inside the 400px SVG viewBox
              const badgeWidth = Math.min(138, Math.max(92, insight.badge.length * 5.2 + 16));
              const rawBadgeX = landmark.x + landmark.badgeOffsetX;
              const clampedBadgeX = Math.max(8, Math.min(392 - badgeWidth, rawBadgeX));
              const clampedBadgeY = Math.max(12, Math.min(514, landmark.y + landmark.badgeOffsetY));

              const rawLabelX = landmark.x + landmark.labelOffsetX;
              const clampedLabelX = Math.max(12, Math.min(324, rawLabelX));
              const clampedLabelY = Math.max(24, Math.min(528, landmark.y + landmark.labelOffsetY));

              return (
                <g
                  key={landmark.id}
                  onClick={() =>
                    onSelectLandmark(isSelected ? null : landmark.id)
                  }
                  className="cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label={`${landmark.name}: ${insight.badge}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectLandmark(isSelected ? null : landmark.id);
                    }
                  }}
                >
                  {/* Generous invisible hit target for easy touch tapping */}
                  <circle cx={landmark.x} cy={landmark.y} r="22" fill="transparent" />

                  {/* Active Selection / AI Halo */}
                  {(isSelected || isAiMatch) && (
                    <circle
                      cx={landmark.x}
                      cy={landmark.y}
                      r="16"
                      fill={pinColor}
                      fillOpacity="0.2"
                      stroke={pinColor}
                      strokeWidth="1.2"
                      strokeOpacity="0.7"
                    />
                  )}

                  {/* Outer Pin Ring */}
                  <circle
                    cx={landmark.x}
                    cy={landmark.y}
                    r={isSelected || isAiMatch ? 8.5 : isProminent ? 7 : 5.5}
                    fill="#090E1A"
                    stroke={pinColor}
                    strokeWidth={isSelected || isAiMatch ? 3 : 2.4}
                    className="transition-all duration-200"
                  />

                  {/* Inner Core */}
                  <circle
                    cx={landmark.x}
                    cy={landmark.y}
                    r={isSelected || isAiMatch ? 3.2 : 2.4}
                    fill={pinColor}
                  />

                  {/* Landmark Name */}
                  <text
                    x={clampedLabelX}
                    y={clampedLabelY}
                    fill={isProminent ? "#F8FAFC" : "#94A3B8"}
                    fontSize="10.5"
                    fontWeight="700"
                    style={{
                      textShadow: "0 1px 6px rgba(4, 8, 18, 0.95)",
                    }}
                  >
                    {landmark.shortName}
                  </text>

                  {/* Contextual Smart Badge for Highlighted / Selected Landmarks */}
                  {(isProminent || isSelected) && (
                    <g transform={`translate(${clampedBadgeX}, ${clampedBadgeY})`}>
                      <rect
                        width={badgeWidth}
                        height="18"
                        rx="6"
                        fill="rgba(9, 14, 26, 0.9)"
                        stroke={pinColor}
                        strokeOpacity={isSelected || isAiMatch ? 0.85 : 0.45}
                        strokeWidth="0.9"
                      />
                      <text
                        x={badgeWidth / 2}
                        y="12"
                        fill={isAiMatch ? "#E0F2FE" : "#F1F5F9"}
                        fontSize="8.3"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {insight.badge}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Map Controls (Thumb-Friendly Right Rail) */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowLegend((v) => !v)}
            aria-label="Toggle transit line legend"
            aria-expanded={showLegend}
            className={`min-h-[44px] min-w-[44px] rounded-2xl glass-panel flex items-center justify-center transition-colors cursor-pointer ${
              showLegend ? "text-sky-300 border-sky-400/40" : "text-slate-200 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in map"
            className="min-h-[44px] min-w-[44px] rounded-2xl glass-panel flex items-center justify-center text-slate-200 hover:text-white active:scale-95 transition-transform cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out map"
            className="min-h-[44px] min-w-[44px] rounded-2xl glass-panel flex items-center justify-center text-slate-200 hover:text-white active:scale-95 transition-transform cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset map focus"
            className="min-h-[44px] min-w-[44px] rounded-2xl glass-panel flex items-center justify-center text-slate-200 hover:text-white active:scale-95 transition-transform cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Transit Line Legend Popover */}
        {showLegend && (
          <div className="absolute left-3 top-3 z-20 glass-surface rounded-2xl p-3 max-w-[235px] shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-100">Chennai Transit Lines</span>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                aria-label="Close legend"
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              {TRANSIT_LINES.map((line) => (
                <div key={line.id} className="flex items-center gap-2">
                  <span
                    className="w-4 h-1 rounded-full shrink-0"
                    style={{
                      backgroundColor: line.color,
                      borderBottom: line.dashed ? "1px dashed #0B1120" : undefined,
                    }}
                  />
                  <span className="truncate">{line.shortName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focused AI Recommendation Banner on Map */}
        {focusedRecommendation && !selectedLandmark && (
          <div className="absolute left-3 right-3 bottom-3 z-20 glass-surface rounded-2xl p-3.5 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-300">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">AI Spatial Match · {focusedRecommendation.area}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-0.5 truncate">
                  {focusedRecommendation.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClearRecommendation}
                aria-label="Dismiss AI highlight"
                className="min-h-[36px] min-w-[36px] -mr-1 -mt-1 flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {focusedRecommendation.reason}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
              <span className="text-sky-200">{focusedRecommendation.detourTime}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate font-sans">{focusedRecommendation.transitMode}</span>
            </div>
          </div>
        )}

        {/* Selected Landmark Interactive Sheet */}
        {selectedLandmark && (
          <div className="absolute left-3 right-3 bottom-3 z-20 glass-surface rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400">
                  {selectedLandmark.district} · {lensConfig.label}
                </p>
                <h3 className="text-base font-bold text-white truncate mt-0.5">
                  {selectedLandmark.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectLandmark(null)}
                aria-label="Close landmark details"
                className="min-h-[40px] min-w-[40px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs">
              <span
                className="font-semibold"
                style={{ color: lensConfig.accentHex }}
              >
                {selectedLandmark.lenses[activeLens].badge}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-300 font-mono text-[11px] tabular-nums">
                {selectedLandmark.lenses[activeLens].highlightMetric}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {selectedLandmark.lenses[activeLens].detail}
            </p>

            <div className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <TrainFront className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{selectedLandmark.transitConnections.join(" · ")}</span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onAskCopilotForLandmark(selectedLandmark, activeLens)}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-sky-500/30 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Ask Copilot</span>
              </button>
              <button
                type="button"
                onClick={onOpenLiveTracker}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white/8 border border-white/12 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/14 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>Live Commute</span>
              </button>
            </div>
          </div>
        )}

        {/* Compact Map Footer Bar (only when no bottom sheet is open) */}
        {!selectedLandmark && !focusedRecommendation && (
          <div className="pointer-events-none absolute left-3 right-3 bottom-3 z-10 flex items-center justify-between gap-2">
            <div className="pointer-events-auto glass-panel rounded-xl px-3 py-2 flex items-center gap-2.5 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-1 rounded-full bg-sky-400" />
                Blue
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-1 rounded-full bg-emerald-400" />
                Green
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-1 rounded-full bg-amber-400" />
                EMU
              </span>
            </div>
            <div className="glass-panel rounded-xl px-2.5 py-2 text-[11px] text-slate-400 whitespace-nowrap">
              Tap any hub pin
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
