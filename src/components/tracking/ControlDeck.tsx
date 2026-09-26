import { ClayPanel } from "@/components/common/Clay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Crosshair,
  Pause,
  Play,
  RotateCcw,
  Route,
  Wand2,
  Waves,
} from "lucide-react";
import type { TrackingMode } from "@/lib/tracking-engine";

const MODES: { id: TrackingMode; label: string; hint: string }[] = [
  { id: "manual", label: "Manual", hint: "Operator drives the boresight" },
  { id: "assisted", label: "Assisted", hint: "Operator leads, tracking aids" },
  { id: "auto", label: "Auto", hint: "Tracking closes the loop" },
];

export function ControlDeck({
  running,
  mode,
  drift,
  aligned,
  onStart,
  onPause,
  onReset,
  onRecenter,
  onToggleDrift,
  onAutoAlign,
  onModeChange,
}: {
  running: boolean;
  mode: TrackingMode;
  drift: boolean;
  aligned: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRecenter: () => void;
  onToggleDrift: () => void;
  onAutoAlign: () => void;
  onModeChange: (mode: TrackingMode) => void;
}) {
  return (
    <ClayPanel className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onStart}
            disabled={running}
            className="clay-press rounded-full"
            aria-label="Start tracking"
          >
            <Play className="size-4" aria-hidden="true" />
            Start tracking
          </Button>
          <Button
            onClick={onPause}
            disabled={!running}
            variant="outline"
            className="clay-press rounded-full"
            aria-label="Pause tracking"
          >
            <Pause className="size-4" aria-hidden="true" />
            Pause
          </Button>
          <Button
            onClick={onAutoAlign}
            className={cn(
              "clay-press rounded-full",
              aligned && "bg-[color-mix(in_oklch,var(--chart-4)_70%,black)]",
            )}
            aria-label="Auto align the virtual terminal"
          >
            <Wand2 className="size-4" aria-hidden="true" />
            Auto align
          </Button>
          <Button
            onClick={onRecenter}
            variant="outline"
            className="clay-press rounded-full"
            aria-label="Re-centre the boresight on the target estimate"
          >
            <Crosshair className="size-4" aria-hidden="true" />
            Re-centre
          </Button>
          <Button
            onClick={onToggleDrift}
            variant={drift ? "secondary" : "outline"}
            aria-pressed={drift}
            className="clay-press rounded-full"
            aria-label="Toggle simulated target movement"
          >
            <Waves className="size-4" aria-hidden="true" />
            {drift ? "Drift on" : "Simulate movement"}
          </Button>
          <Button
            onClick={onReset}
            variant="ghost"
            className="clay-press rounded-full"
            aria-label="Reset the simulation"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </Button>
        </div>

        <div className="lg:min-w-[19rem]">
          <p className="hud-label mb-2 flex items-center gap-1.5">
            <Route className="size-3.5" aria-hidden="true" />
            Tracking mode
          </p>
          <div
            role="radiogroup"
            aria-label="Tracking mode"
            className="clay-inset flex gap-1 rounded-full p-1"
          >
            {MODES.map((entry) => {
              const active = entry.id === mode;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={entry.hint}
                  onClick={() => onModeChange(entry.id)}
                  className={cn(
                    "relative flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="tracking-mode-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ClayPanel>
  );
}
