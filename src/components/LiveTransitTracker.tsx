import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Bus,
  Check,
  ChevronRight,
  Clock,
  RotateCcw,
  TrainFront,
  Users,
} from "lucide-react";
import { CHENNAI_LIVE_TRIPS } from "../data/chennaiData";
import type { CrowdLevel, TransitTrip } from "../types/maps";

interface LiveTransitTrackerProps {
  onTriggerWakeAlert: (payload: {
    penultimateStopName: string;
    destinationName: string;
    routeLabel: string;
    vibrated: boolean;
  }) => void;
}

function getCrowdStyle(level: CrowdLevel): {
  textClass: string;
  bars: number;
  barColor: string;
  hint: string;
} {
  switch (level) {
    case "Low":
      return {
        textClass: "text-emerald-300",
        bars: 1,
        barColor: "bg-emerald-400",
        hint: "Seats readily available",
      };
    case "Moderate":
      return {
        textClass: "text-amber-300",
        bars: 2,
        barColor: "bg-amber-400",
        hint: "Standing room comfortable",
      };
    case "High":
      return {
        textClass: "text-rose-300",
        bars: 3,
        barColor: "bg-rose-400",
        hint: "Peak commuter load",
      };
  }
}

function playGentleWakeTone() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0.001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.28);
    });
  } catch {
    // Ignore audio restriction errors gracefully
  }
}

export function LiveTransitTracker({ onTriggerWakeAlert }: LiveTransitTrackerProps) {
  const [selectedTripIndex, setSelectedTripIndex] = useState(0);
  const [currentStopIdx, setCurrentStopIdx] = useState(1); // Start 1 stop in so live progress is immediately clear
  const [wakeEnabled, setWakeEnabled] = useState(true);
  const [alertFiredForTrip, setAlertFiredForTrip] = useState(false);

  const trip: TransitTrip = CHENNAI_LIVE_TRIPS[selectedTripIndex];
  const lastStopIdx = trip.stops.length - 1;
  const penultimateStopIdx = trip.stops.length - 2;

  const totalTripMinutes = trip.stops[lastStopIdx].minutesFromStart;
  const elapsedMinutes = trip.stops[currentStopIdx].minutesFromStart;
  const remainingMinutesBase = Math.max(0, totalTripMinutes - elapsedMinutes);

  const [secondsLeft, setSecondsLeft] = useState(remainingMinutesBase * 60);

  // Sync live countdown whenever trip or current stop changes
  useEffect(() => {
    setSecondsLeft(remainingMinutesBase * 60);
  }, [remainingMinutesBase, selectedTripIndex, currentStopIdx]);

  // Smooth 1-second live ETA ticker
  useEffect(() => {
    if (currentStopIdx >= lastStopIdx) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentStopIdx, lastStopIdx]);

  const handleSwitchTrip = (index: number) => {
    setSelectedTripIndex(index);
    setCurrentStopIdx(1);
    setAlertFiredForTrip(false);
  };

  const handleSimulateNextStop = () => {
    if (currentStopIdx >= lastStopIdx) return;
    const nextIdx = currentStopIdx + 1;
    setCurrentStopIdx(nextIdx);

    if (nextIdx === penultimateStopIdx && wakeEnabled && !alertFiredForTrip) {
      let vibrated = false;
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try {
          vibrated = navigator.vibrate([260, 120, 260, 120, 420]);
        } catch {
          vibrated = false;
        }
      }
      playGentleWakeTone();
      setAlertFiredForTrip(true);
      onTriggerWakeAlert({
        penultimateStopName: trip.stops[penultimateStopIdx].name,
        destinationName: trip.stops[lastStopIdx].name,
        routeLabel: `${trip.mode} (${trip.routeCode})`,
        vibrated,
      });
    }
  };

  const handleResetTrip = () => {
    setCurrentStopIdx(0);
    setAlertFiredForTrip(false);
  };

  const currentStop = trip.stops[currentStopIdx];
  const nextStop = currentStopIdx < lastStopIdx ? trip.stops[currentStopIdx + 1] : null;
  const isCompleted = currentStopIdx >= lastStopIdx;
  const isAtPenultimate = currentStopIdx === penultimateStopIdx;
  const crowdInfo = getCrowdStyle(currentStop.crowd);

  const formattedMins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const formattedSecs = String(secondsLeft % 60).padStart(2, "0");
  const stopsRemaining = Math.max(0, lastStopIdx - currentStopIdx);
  const progressPercent = Math.round((currentStopIdx / lastStopIdx) * 100);

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Route Switcher Header */}
      <div className="px-4 pt-3 pb-2.5 shrink-0 border-b border-white/8 bg-[#0A101E]/80 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/8">
          {CHENNAI_LIVE_TRIPS.map((t, idx) => {
            const active = idx === selectedTripIndex;
            const Icon = t.mode === "Chennai Metro" ? TrainFront : Bus;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSwitchTrip(idx)}
                className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-slate-800 text-white shadow-sm border border-white/12"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? t.accentColor : undefined }} />
                <span className="truncate">
                  {t.mode === "Chennai Metro" ? "Metro Blue" : "MTC 21G"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Active Trip Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 space-y-3.5">
        {/* Active Trip Summary Card */}
        <section className="glass-panel rounded-2xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                <span className="font-semibold" style={{ color: trip.accentColor }}>
                  {trip.routeCode}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{trip.routeLineName}</span>
              </div>
              <h2 className="mt-1 text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>{trip.origin}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{trip.destination}</span>
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400 font-mono tabular-nums">
                {trip.vehicleTag} · Fare ₹{trip.fareInr}
              </p>
            </div>

            {/* Live ETA Countdown Block */}
            <div className="text-right shrink-0">
              <p className="text-[11px] text-slate-400">
                {isCompleted ? "Status" : "Arrival ETA"}
              </p>
              <p
                className="text-xl font-bold font-mono tabular-nums tracking-tight"
                style={{ color: isCompleted ? "#34D399" : trip.accentColor }}
              >
                {isCompleted ? "Arrived" : `${formattedMins}:${formattedSecs}`}
              </p>
              <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                {isCompleted
                  ? "Trip complete"
                  : `${stopsRemaining} ${stopsRemaining === 1 ? "stop" : "stops"} left`}
              </p>
            </div>
          </div>

          {/* Trip Progress Bar */}
          <div className="mt-3.5">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(8, progressPercent)}%`,
                  backgroundColor: trip.accentColor,
                }}
              />
            </div>
          </div>

          {/* Crowd Density & Next Stop Strip */}
          <div className="mt-3.5 pt-3 border-t border-white/8 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Crowd Density</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-xs font-bold ${crowdInfo.textClass}`}>
                  {currentStop.crowd}
                </span>
                <div className="flex items-center gap-1" aria-hidden="true">
                  {[1, 2, 3].map((step) => (
                    <span
                      key={step}
                      className={`h-2 w-3.5 rounded-sm ${
                        step <= crowdInfo.bars ? crowdInfo.barColor : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{crowdInfo.hint}</p>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{nextStop ? "Next Stop" : "Final Stop"}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-white truncate">
                {nextStop ? nextStop.name : currentStop.name}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {nextStop ? nextStop.platformOrBay : currentStop.platformOrBay}
              </p>
            </div>
          </div>
        </section>

        {/* Wake Me 1 Stop Before Toggle Card */}
        <div
          className={`rounded-2xl p-3.5 border transition-colors flex items-center justify-between gap-3 ${
            isAtPenultimate && wakeEnabled
              ? "bg-amber-400/15 border-amber-300/50"
              : "glass-panel"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                wakeEnabled
                  ? "bg-amber-400/18 text-amber-300 border border-amber-300/35"
                  : "bg-slate-800/90 text-slate-400 border border-white/8"
              }`}
            >
              {isAtPenultimate && wakeEnabled ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Wake Me 1 Stop Before</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {wakeEnabled
                  ? `Alert armed at ${trip.stops[penultimateStopIdx].name}`
                  : "Off · No vibration or visual wake alert"}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={wakeEnabled}
            aria-label="Wake Me 1 Stop Before"
            onClick={() => setWakeEnabled((prev) => !prev)}
            className="min-h-[44px] min-w-[54px] flex items-center justify-end cursor-pointer shrink-0"
          >
            <span
              className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                wakeEnabled ? "bg-amber-400" : "bg-slate-700"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-slate-950 shadow transition-transform duration-200 ${
                  wakeEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        </div>

        {/* Vertical Stop Progress Timeline */}
        <section className="glass-panel rounded-2xl p-4" aria-label="Live stop timeline">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-semibold text-slate-200">Live Route Timeline</h3>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              Stop {currentStopIdx + 1} / {trip.stops.length}
            </span>
          </div>

          <ol className="relative space-y-0">
            {trip.stops.map((stop, idx) => {
              const isPassed = idx < currentStopIdx;
              const isCurrent = idx === currentStopIdx;
              const isPenultimate = idx === penultimateStopIdx;
              const isDestination = idx === lastStopIdx;
              const isLast = idx === lastStopIdx;

              const etaDiff = Math.max(0, stop.minutesFromStart - currentStop.minutesFromStart);

              return (
                <li key={stop.id} className="relative pl-8 pb-4 last:pb-0">
                  {/* Connecting Vertical Rail */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[11px] top-5 bottom-0 w-[2px] transition-colors duration-300"
                      style={{
                        backgroundColor: isPassed
                          ? trip.accentColor
                          : "rgba(148, 163, 184, 0.2)",
                      }}
                    />
                  )}

                  {/* Timeline Node */}
                  <span
                    className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isPassed
                        ? "bg-slate-800 border border-sky-400/50 text-sky-300"
                        : isCurrent
                          ? "bg-slate-950 border-2 shadow-[0_0_12px_rgba(56,189,248,0.45)]"
                          : isPenultimate && wakeEnabled
                            ? "bg-amber-400/15 border border-amber-300/60 text-amber-300"
                            : "bg-slate-900 border border-white/15"
                    }`}
                    style={
                      isCurrent
                        ? { borderColor: trip.accentColor }
                        : undefined
                    }
                  >
                    {isPassed ? (
                      <Check className="w-3 h-3" />
                    ) : isCurrent ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: trip.accentColor }}
                      />
                    ) : isPenultimate && wakeEnabled ? (
                      <Bell className="w-3 h-3" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    )}
                  </span>

                  {/* Stop Details Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold leading-tight ${
                          isCurrent
                            ? "text-white"
                            : isPassed
                              ? "text-slate-500"
                              : "text-slate-200"
                        }`}
                      >
                        {stop.name}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 leading-snug ${
                          isPassed ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        {isCurrent
                          ? isCompleted
                            ? "Arrived at destination"
                            : "Current live location"
                          : isPenultimate && wakeEnabled
                            ? "Wake alert trigger · 1 stop before exit"
                            : stop.subtitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px] tabular-nums">
                      {isPassed ? (
                        <span className="text-slate-600">Passed</span>
                      ) : isCurrent ? (
                        <span className="font-semibold" style={{ color: trip.accentColor }}>
                          Now
                        </span>
                      ) : (
                        <span className={isDestination ? "text-white font-semibold" : "text-slate-400"}>
                          +{etaDiff} min
                        </span>
                      )}
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                        {stop.crowd}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {/* Sticky Thumb-Zone Simulation Controls */}
      <div className="px-4 py-3 shrink-0 border-t border-white/8 bg-[#0A101E]/95 backdrop-blur-xl flex items-center gap-2">
        <button
          type="button"
          onClick={handleResetTrip}
          aria-label="Reset simulated trip"
          className="min-h-[48px] px-3.5 rounded-2xl bg-slate-900 border border-white/12 text-slate-300 hover:text-white hover:border-white/25 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          disabled={isCompleted}
          onClick={handleSimulateNextStop}
          className="flex-1 min-h-[48px] px-4 rounded-2xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap"
          style={{ backgroundColor: isCompleted ? "#34D399" : trip.accentColor }}
        >
          <span>
            {isCompleted
              ? "Arrived at Destination"
              : currentStopIdx + 1 === penultimateStopIdx && wakeEnabled
                ? "Simulate Next Stop (Wake Alert)"
                : "Simulate Next Stop"}
          </span>
          {!isCompleted && <ChevronRight className="w-4 h-4 stroke-[2.5] shrink-0" />}
        </button>
      </div>
    </div>
  );
}
