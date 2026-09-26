import { ClayPanel } from "@/components/common/Clay";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  Pause,
  Play,
  RotateCcw,
  Route,
  Shuffle,
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
  target,
  camera,
  onStart,
  onPause,
  onReset,
  onRecenter,
  onToggleDrift,
  onAutoAlign,
  onModeChange,
  onSetTarget,
  onSetCamera,
  onNudgeTarget,
}: {
  running: boolean;
  mode: TrackingMode;
  drift: boolean;
  aligned: boolean;
  /** Current target bearing — shown beside the nudger. */
  target?: { azimuth: number; elevation: number };
  /** Current camera bearing — shown beside the nudger. */
  camera?: { azimuth: number; elevation: number };
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRecenter: () => void;
  onToggleDrift: () => void;
  onAutoAlign: () => void;
  onModeChange: (mode: TrackingMode) => void;
  /** Direct target bearing setters (wired to the sliders when available). */
  onSetTarget?: (azimuth: number, elevation: number) => void;
  onSetCamera?: (azimuth: number, elevation: number) => void;
  /** Small steps of the virtual target, used by the D-pad. */
  onNudgeTarget?: (azimuth?: number, elevation?: number) => void;
}) {
  return (
    <ClayPanel className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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

        <div className="shrink-0 lg:min-w-[19rem]">
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

      {/* Target-position controls — SIMULATED DATA */}
      <div className="mt-5 grid gap-4 border-t border-border/60 pt-5 lg:grid-cols-[minmax(0,1.15fr)_auto]">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-2">
            <p className="hud-label">Target position — SIMULATED DATA</p>
            <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--chart-5)_55%,transparent)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[color-mix(in_oklch,var(--chart-5)_52%,black)]">
              Demo
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Move the virtual beacon to test re-acquisition, loss, and the guidance arrows. When
            drift is on, its position is driven by the model.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SliderRow
              label="Target azimuth"
              valueLabel={`${(target?.azimuth ?? 0) >= 0 ? "+" : ""}${(target?.azimuth ?? 0).toFixed(2)}°`}
              min={-14}
              max={14}
              step={0.1}
              raw={target?.azimuth ?? 0}
              disabled={drift}
              onChange={(v) => onSetTarget?.(v, target?.elevation ?? 0)}
            />
            <SliderRow
              label="Target elevation"
              valueLabel={`${(target?.elevation ?? 0) >= 0 ? "+" : ""}${(target?.elevation ?? 0).toFixed(2)}°`}
              min={-9}
              max={9}
              step={0.1}
              raw={target?.elevation ?? 0}
              disabled={drift}
              onChange={(v) => onSetTarget?.(target?.azimuth ?? 0, v)}
            />
            <SliderRow
              label="Camera azimuth"
              valueLabel={`${(camera?.azimuth ?? 0) >= 0 ? "+" : ""}${(camera?.azimuth ?? 0).toFixed(2)}°`}
              min={-40}
              max={40}
              step={0.1}
              raw={camera?.azimuth ?? 0}
              onChange={(v) => onSetCamera?.(v, camera?.elevation ?? 0)}
            />
            <SliderRow
              label="Camera elevation"
              valueLabel={`${(camera?.elevation ?? 0) >= 0 ? "+" : ""}${(camera?.elevation ?? 0).toFixed(2)}°`}
              min={-20}
              max={20}
              step={0.1}
              raw={camera?.elevation ?? 0}
              onChange={(v) => onSetCamera?.(camera?.azimuth ?? 0, v)}
            />
          </div>
        </div>

        {/* D-pad nudger — keyboard-accessible */}
        <div className="flex flex-col items-center gap-3">
          <p className="hud-label">Nudge target</p>
          <div className="grid grid-cols-3 gap-1.5">
            <span aria-hidden="true" />
            <Button
              size="icon"
              variant="outline"
              className="clay-sm clay-press size-9 rounded-xl"
              aria-label="Nudge target up"
              onClick={() => {
                const el = target?.elevation ?? 0;
                onNudgeTarget?.(undefined, Math.min(9, el + 0.6));
              }}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>
            <span aria-hidden="true" />
            <Button
              size="icon"
              variant="outline"
              className="clay-sm clay-press size-9 rounded-xl"
              aria-label="Nudge target left"
              onClick={() => {
                const az = target?.azimuth ?? 0;
                onNudgeTarget?.(Math.max(-14, az - 0.6), undefined);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-9 rounded-xl text-muted-foreground"
              aria-label="Randomise target position"
              title="Randomise target position"
              onClick={() => {
                const az = (Math.random() * 2 - 1) * 10;
                const el = (Math.random() * 2 - 1) * 5;
                onNudgeTarget?.(az, el);
              }}
            >
              <Shuffle className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="clay-sm clay-press size-9 rounded-xl"
              aria-label="Nudge target right"
              onClick={() => {
                const az = target?.azimuth ?? 0;
                onNudgeTarget?.(Math.min(14, az + 0.6), undefined);
              }}
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <span aria-hidden="true" />
            <Button
              size="icon"
              variant="outline"
              className="clay-sm clay-press size-9 rounded-xl"
              aria-label="Nudge target down"
              onClick={() => {
                const el = target?.elevation ?? 0;
                onNudgeTarget?.(undefined, Math.max(-9, el - 0.6));
              }}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
            <span aria-hidden="true" />
          </div>
          <p className="max-w-[14rem] text-center text-[10.5px] leading-4 text-muted-foreground">
            ±0.6° steps. Randomise to test re-acquisition from a wide offset.
          </p>
        </div>
      </div>
    </ClayPanel>
  );
}

function SliderRow({
  label,
  valueLabel,
  min,
  max,
  step,
  raw,
  disabled,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  raw: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="hud-label" htmlFor={`deck-${label}`}>
          {label}
        </label>
        <span className="hud-value text-xs font-semibold text-foreground">{valueLabel}</span>
      </div>
      <Slider
        id={`deck-${label}`}
        aria-label={label}
        className="mt-2.5"
        min={min}
        max={max}
        step={step}
        value={[raw]}
        disabled={disabled}
        onValueChange={(values) => onChange(values[0] ?? raw)}
      />
    </div>
  );
}
