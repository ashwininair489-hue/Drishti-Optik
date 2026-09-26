import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  MOTION_PATTERNS,
  SCENARIO_PRESETS,
  SIM,
  type MotionPattern,
  type ScenarioPresetId,
} from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CloudRain, EyeOff, Gauge, Orbit, Route, Sparkles, Sun, Waves, Wind } from "lucide-react";

const SCENARIO_ICON: Record<ScenarioPresetId, React.ComponentType<{ className?: string }>> = {
  calm: Sun,
  windy: Wind,
  turbulent: CloudRain,
};

interface DisturbancePanelProps {
  running: boolean;
  motionPattern: MotionPattern;
  noiseIntensity: number;
  occlusionRemaining: number;
  onSetPattern: (pattern: MotionPattern) => void;
  onSetNoise: (intensity: number) => void;
  onTriggerOcclusion: () => void;
  onApplyPreset: (id: ScenarioPresetId) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRecenter: () => void;
  onAutoAlign: () => void;
  aligned: boolean;
}

/**
 * Disturbance & Scenario Controls.
 *
 * Motion pattern selector, noise/turbulence slider, occlusion trigger,
 * scenario presets, and start/pause/reset. All SIMULATED — demonstrates how
 * disturbances stress the tracker.
 */
export function DisturbancePanel({
  running,
  motionPattern,
  noiseIntensity,
  occlusionRemaining,
  onSetPattern,
  onSetNoise,
  onTriggerOcclusion,
  onApplyPreset,
  onStart,
  onPause,
  onReset,
  onRecenter,
  onAutoAlign,
  aligned,
}: DisturbancePanelProps) {
  const reduced = useReducedMotion();
  const occluded = occlusionRemaining > 0;
  const jitterAz = (SIM.noiseJitterAzDeg * noiseIntensity).toFixed(2);
  return (
    <motion.div initial={reduced ? undefined : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.45 }}>
      <ClayPanel className="flex flex-col gap-5 p-5">
      <header>
        <p className="hud-label flex items-center gap-1.5">
          <Waves className="size-3.5" aria-hidden="true" /> Disturbance &amp; scenario — SIMULATED DATA
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <Gauge className="size-4 text-primary" aria-hidden="true" /> Configure the simulation
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          Inject motion, turbulence and dropouts to see how the tracker copes. Presets configure several knobs at once.
        </p>
      </header>

      {/* Scenario presets — lively cards */}
      <div>
        <p className="hud-label mb-2 flex items-center gap-1.5">
          <Sparkles className="size-3.5" aria-hidden="true" /> Scenario presets
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(SCENARIO_PRESETS) as ScenarioPresetId[]).map((id, i) => {
            const preset = SCENARIO_PRESETS[id]!;
            const Icon = SCENARIO_ICON[id];
            const active = preset.pattern === motionPattern && Math.abs(preset.noise - noiseIntensity) < 0.06;
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => onApplyPreset(id)}
                initial={reduced ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.35, delay: i * 0.06 }}
                whileHover={reduced ? undefined : { y: -3, scale: 1.02 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                className={cn(
                  "clay-sm clay-press flex flex-col items-start gap-2 rounded-2xl p-3.5 text-left transition-colors",
                  active ? "ring-2 ring-primary/40 bg-[color-mix(in oklch,var(--clay-surface)_88%,var(--primary))]" : ""
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-foreground">{preset.label}</span>
                <span className="hud-label !text-[9px] !normal-case !tracking-normal">{preset.hint}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Motion pattern selector — pills with spring */}
      <div>
        <p className="hud-label mb-2 flex items-center gap-1.5">
          <Orbit className="size-3.5" aria-hidden="true" /> Motion pattern
        </p>
        <div className="clay-inset flex flex-wrap gap-1 rounded-2xl p-1.5" role="radiogroup" aria-label="Motion pattern">
          {MOTION_PATTERNS.map((p) => {
            const active = p.id === motionPattern;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                title={p.hint}
                onClick={() => onSetPattern(p.id)}
                className={cn("relative rounded-full px-3 py-2 text-xs font-semibold capitalize transition-colors", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}
              >
                {active && (
                  <motion.span layoutId="disturb-pattern-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 30 }} />
                )}
                <span className="relative">{p.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          {MOTION_PATTERNS.find((p) => p.id === motionPattern)?.hint} — deterministic, seed-driven.
        </p>
      </div>

      {/* Noise / turbulence slider — lively dot that jitters with intensity */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="hud-label" htmlFor="noise-slider">
            Noise / turbulence — SIMULATED
          </label>
          <span className="flex items-center gap-2">
            <motion.span
              className="size-2 rounded-full"
              style={{ background: noiseIntensity > 0.6 ? "color-mix(in oklch, var(--chart-5) 80%, white)" : noiseIntensity > 0.25 ? "color-mix(in oklch, var(--chart-2) 70%, white)" : "color-mix(in oklch, var(--chart-4) 70%, white)" }}
              animate={reduced || noiseIntensity === 0 ? undefined : { scale: [1, 1.35, 1], opacity: [0.9, 0.6, 0.9] }}
              transition={reduced ? undefined : { duration: 0.9 - noiseIntensity * 0.4, repeat: Infinity }}
              aria-hidden="true"
            />
            <span className="hud-value text-xs font-semibold text-foreground">{Math.round(noiseIntensity * 100)}%</span>
          </span>
        </div>
        <Slider
          id="noise-slider"
          aria-label="Noise / turbulence intensity"
          className="mt-3"
          min={0}
          max={1}
          step={0.02}
          value={[noiseIntensity]}
          onValueChange={(v) => onSetNoise(v[0] ?? 0)}
        />
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>Clean</span>
          <span>Heavy</span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          Jitter added to the beacon each tick (±{jitterAz}° AZ at this setting). Also penalises confidence and inflates latency.
        </p>
      </div>

      {/* Occlusion trigger — pulse when active */}
      <ClayInset className="flex flex-col gap-3 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="hud-label flex items-center gap-1.5">
            <EyeOff className="size-3.5" aria-hidden="true" /> Manual occlusion / dropout
          </p>
          {occluded ? (
            <motion.span
              animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
              transition={reduced ? undefined : { duration: 0.8, repeat: Infinity }}
              className="rounded-full bg-[color-mix(in oklch,var(--destructive)_18%,black)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white"
            >
              Dropout · {(occlusionRemaining / SIM.fps).toFixed(1)} s left
            </motion.span>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Forces the target to disappear for ~{(SIM.occlusionDurationTicks / SIM.fps).toFixed(1)} s. Use it to test recovery — the status should go <span className="font-semibold text-foreground">LOST → REACQUIRING → TRACKING</span>.
        </p>
        <Button
          onClick={onTriggerOcclusion}
          variant={occluded ? "secondary" : "outline"}
          className="clay-press rounded-full w-fit"
          aria-label="Trigger occlusion dropout"
        >
          <AlertTriangle className="size-4" aria-hidden="true" />
          {occluded ? "Dropout active — extend" : "Trigger dropout"}
        </Button>
      </ClayInset>

      {/* Start / Pause / Reset — lively primary */}
      <div>
        <p className="hud-label mb-2 flex items-center gap-1.5">
          <Route className="size-3.5" aria-hidden="true" /> Session
        </p>
        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
            <Button onClick={running ? onPause : onStart} className="clay-press rounded-full" variant={running ? "outline" : "default"}>
              {running ? "Pause" : "Start"}
            </Button>
          </motion.div>
          <Button onClick={onAutoAlign} className={cn("clay-press rounded-full", aligned && "bg-[color-mix(in oklch,var(--chart-4)_70%,black)]")} aria-label="Auto align">
            Auto align
          </Button>
          <Button onClick={onRecenter} variant="outline" className="clay-press rounded-full">
            Re-centre
          </Button>
          <Button onClick={onReset} variant="ghost" className="clay-press rounded-full">
            Reset
          </Button>
        </div>
      </div>

      <p className="text-[11px] leading-5 text-muted-foreground">
        All disturbances are software-modelled. Nothing here affects a real terminal.
      </p>
    </ClayPanel>
    </motion.div>
  );
}
