import { BellRing, Check, Smartphone } from "lucide-react";

interface WakeAlertModalProps {
  open: boolean;
  penultimateStopName: string;
  destinationName: string;
  routeLabel: string;
  vibrated: boolean;
  onDismiss: () => void;
}

export function WakeAlertModal({
  open,
  penultimateStopName,
  destinationName,
  routeLabel,
  vibrated,
  onDismiss,
}: WakeAlertModalProps) {
  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="wake-alert-title"
      aria-describedby="wake-alert-desc"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#0F172A] border border-amber-400/45 p-6 shadow-[0_0_50px_rgba(250,204,21,0.22)] text-center relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-amber-400/18 blur-3xl"
        />

        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-amber-400/60 animate-alert-ring"
          />
          <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-300/60 flex items-center justify-center text-amber-300">
            <BellRing className="w-7 h-7" />
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold text-amber-300">
          Wake Alert · 1 Stop Remaining
        </p>

        <h2 id="wake-alert-title" className="mt-1 text-xl font-bold text-white">
          Approaching {penultimateStopName}
        </h2>

        <p id="wake-alert-desc" className="mt-2 text-sm text-slate-300 leading-relaxed">
          Next stop is your destination,{" "}
          <span className="font-semibold text-white">{destinationName}</span> on {routeLabel}. Move
          toward the exit doors now.
        </p>

        <div className="mt-4 py-2 px-3 rounded-xl bg-white/5 border border-white/10 inline-flex items-center gap-2 text-xs text-slate-300">
          <Smartphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>
            {vibrated
              ? "Haptic vibration alert triggered"
              : "Visual wake alert active"}
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full min-h-[48px] rounded-2xl bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>I&apos;m Awake — Dismiss</span>
        </button>
      </div>
    </div>
  );
}
