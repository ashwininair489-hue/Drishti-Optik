import { ClayPanel } from "@/components/common/Clay";
import { SimulatedTag, TechBadge } from "@/components/common/Tags";
import {
  BENCHMARK_THRESHOLDS,
  SIM,
  deriveMetrics,
  evaluateBenchmark,
  type TrackerState,
} from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Award, BarChart3, Clock, Crosshair, FileJson, FileSpreadsheet, Timer, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";

interface TelemetryReportPanelProps {
  state: TrackerState;
  onExportJson?: () => void;
  onExportCsv?: () => void;
}

function buildJsonBlob(state: TrackerState): string {
  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      simulator: "Drishti-Optik — SIMULATED DATA",
      disclaimer: "All values are software-modelled. No hardware measurement.",
      seed: state.seed,
      fps: SIM.fps,
      thresholds: BENCHMARK_THRESHOLDS,
    },
    state: {
      status: state.status,
      mode: state.mode,
      motionPattern: state.motionPattern,
      noiseIntensity: state.noiseIntensity,
      camera: state.camera,
      target: state.target,
      elapsedTicks: state.elapsedTicks,
      tick: state.tick,
      confidence: state.confidence,
      lossCount: state.lossCount,
      reacquireCount: state.reacquireCount,
      hadLock: state.hadLock,
      alignedAtTick: state.alignedAtTick,
      peakErrorDeg: state.peakErrorDeg,
    },
    metrics: deriveMetrics(state),
    history: state.history,
    events: state.events,
  };
  return JSON.stringify(payload, null, 2);
}

function buildCsv(state: TrackerState): string {
  const header = "t_s,error_deg,error_mrad,confidence,fps,latency_ms,occluded";
  const rows = state.history.map((p) => {
    const t = (p.t / SIM.fps).toFixed(3);
    const err = p.errorDeg.toFixed(3);
    const mrad = ((p.errorMrad ?? p.errorDeg * SIM.degToMrad)).toFixed(2);
    const conf = p.confidence.toFixed(3);
    const fps = p.fps.toFixed(1);
    const lat = p.latencyMs.toFixed(1);
    const occ = p.occluded ? "1" : "0";
    return `${t},${err},${mrad},${conf},${fps},${lat},${occ}`;
  });
  return [header, ...rows].join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Performance Telemetry & Benchmark Report.
 *
 * Live line chart of pointing error, summary stat cards, and an Export Report
 * button that produces downloadable JSON/CSV + pass/fail against thresholds.
 */
export function TelemetryReportPanel({ state }: TelemetryReportPanelProps) {
  const reduced = useReducedMotion();
  const metrics = useMemo(() => deriveMetrics(state), [state]);
  const [thresholds, setThresholds] = useState(() => ({ ...BENCHMARK_THRESHOLDS }));
  const liveEval = useMemo(() => evaluateBenchmark(metrics, thresholds), [metrics, thresholds]);

  const chartData = state.history.map((p) => ({
    t: Math.round((p.t / SIM.fps) * 10) / 10,
    errorDeg: p.errorDeg,
    errorMrad: p.errorMrad ?? round2(p.errorDeg * SIM.degToMrad),
    confidence: Math.round(p.confidence * 1000) / 10,
  }));

  function handleExportJson() {
    downloadBlob(buildJsonBlob(state), `drishti-optik-session-${Date.now()}.json`, "application/json");
  }
  function handleExportCsv() {
    downloadBlob(buildCsv(state), `drishti-optik-session-${Date.now()}.csv`, "text/csv");
  }

  const STATS = [
    { label: "Mean error", value: `${metrics.meanErrorDeg.toFixed(3)}°`, sub: `${metrics.meanErrorMrad.toFixed(2)} mrad · SIMULATED`, icon: Crosshair, tone: liveEval.checks.meanError ? "ok" : "warn" as const },
    { label: "Max error", value: `${metrics.maxErrorDeg.toFixed(3)}°`, sub: `${metrics.maxErrorMrad.toFixed(2)} mrad · SIMULATED`, icon: TrendingUp, tone: liveEval.checks.maxError ? "ok" : "warn" as const },
    { label: "Acquisition time", value: metrics.acquisitionTimeSec !== null ? `${metrics.acquisitionTimeSec.toFixed(1)} s` : "—", sub: metrics.acquisitionTimeSec !== null ? `Aligned at tick ${state.alignedAtTick}` : "Not yet aligned", icon: Timer, tone: metrics.acquisitionTimeSec !== null && liveEval.checks.acquisition ? "ok" : metrics.acquisitionTimeSec === null ? "idle" as const : "warn" as const },
    { label: "Loss events", value: `${metrics.lossCount}`, sub: `${metrics.reacquireCount} re-acquisitions`, icon: Zap, tone: metrics.lossCount === 0 ? "ok" : "warn" as const },
    { label: "% time locked", value: `${metrics.timeLockedPct.toFixed(1)}%`, sub: `${state.history.length} samples · SIMULATED`, icon: Activity, tone: liveEval.checks.lockTime ? "ok" : "warn" as const },
    { label: "Final error", value: `${metrics.finalErrorDeg.toFixed(3)}°`, sub: `Peak ${metrics.peakErrorDeg.toFixed(3)}°`, icon: BarChart3, tone: "idle" as const },
  ];

  return (
    <div className="grid gap-4">
      <ClayPanel className="p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="hud-label">Live telemetry — SIMULATED DATA</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="size-4 text-primary" aria-hidden="true" /> Pointing error over time
            </h2>
          </div>
          <SimulatedTag />
        </header>

        {chartData.length > 2 ? (
          <div className="clay-inset mt-4 h-56 w-full rounded-2xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} unit="s" minTickGap={24} />
                <YAxis yAxisId="error" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} width={44} />
                <YAxis yAxisId="conf" orientation="right" domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ borderRadius: 18, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                  formatter={(value: number, name: string) => [`${value}`, name === "errorDeg" ? "Error (°)" : name === "errorMrad" ? "Error (mrad)" : "Confidence (%)"]}
                  labelFormatter={(label) => `t+${label}s — SIMULATED`}
                />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">
                      {value === "errorDeg" ? "Error (°) — SIMULATED" : value === "errorMrad" ? "Error (mrad) — SIMULATED" : "Confidence (%) — SIMULATED"}
                    </span>
                  )}
                />
                <Line yAxisId="error" type="monotone" dataKey="errorDeg" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                <Line yAxisId="conf" type="monotone" dataKey="confidence" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="clay-inset mt-4 rounded-2xl px-4 py-10 text-center text-xs text-muted-foreground">The pointing-error trace appears once a session has been running for a moment. Start tracking to stream simulated estimates.</p>
        )}

        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
          Pointing error = angular separation between boresight and beacon estimate. Switch units in the Camera View panel — deg, mrad and px all derive from the same SIMULATED geometry.
        </p>
      </ClayPanel>

      {/* Stat cards */}
      <ClayPanel className="p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" /> Summary — SIMULATED DATA
          </h2>
          <TechBadge tone={liveEval.passed ? "ok" : state.history.length === 0 ? "idle" : "warn"}>{liveEval.passed ? "PASS" : state.history.length === 0 ? "No data yet" : "FAIL — review thresholds"}</TechBadge>
        </header>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={reduced ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.3, delay: i * 0.05 }}
                whileHover={reduced ? undefined : { y: -2 }}
                className={cn("clay-inset rounded-2xl p-3.5", s.tone === "ok" ? "ring-1 ring-[color-mix(in oklch,var(--chart-4)_22%,transparent)]" : s.tone === "warn" ? "ring-1 ring-[color-mix(in oklch,var(--chart-5)_18%,transparent)]" : "")}
              >
                <p className="hud-label flex items-center gap-1.5">
                  <Icon className="size-3.5" aria-hidden="true" /> {s.label}
                </p>
                <p className={cn("hud-value mt-1.5 text-lg font-semibold", s.tone === "ok" ? "text-[color-mix(in oklch,var(--chart-4)_58%,black)]" : s.tone === "warn" ? "text-[color-mix(in oklch,var(--chart-5)_52%,black)]" : "text-foreground")}>{s.value}</p>
                <p className="mt-1 text-[10.5px] leading-4 text-muted-foreground">{s.sub}</p>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
          Mean/max error, acquisition time, loss count and lock fraction are derived from the rolling history (up to 240 ticks). All values SIMULATED.
        </p>
      </ClayPanel>

      {/* Benchmark readout + thresholds + export */}
      <ClayPanel className="p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Award className="size-4 text-primary" aria-hidden="true" /> Benchmark &amp; export
          </h2>
          <span className={cn("rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em]", liveEval.passed ? "bg-[color-mix(in oklch,var(--chart-4)_18%,black)] text-white" : state.history.length === 0 ? "bg-muted text-muted-foreground" : "bg-[color-mix(in oklch,var(--destructive)_16%,black)] text-white")}>
            {liveEval.passed ? "PASS" : state.history.length === 0 ? "—" : "FAIL"}
          </span>
        </header>

        {/* Configurable thresholds */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ThresholdInput label="Mean error ≤" unit="°" value={thresholds.meanErrorDeg} onChange={(v) => setThresholds((t) => ({ ...t, meanErrorDeg: v }))} min={0.1} max={2} step={0.05} ok={liveEval.checks.meanError} actual={metrics.meanErrorDeg} />
          <ThresholdInput label="Max error ≤" unit="°" value={thresholds.maxErrorDeg} onChange={(v) => setThresholds((t) => ({ ...t, maxErrorDeg: v }))} min={0.5} max={5} step={0.1} ok={liveEval.checks.maxError} actual={metrics.maxErrorDeg} />
          <ThresholdInput label="Acquisition ≤" unit="s" value={thresholds.acquisitionTimeSec} onChange={(v) => setThresholds((t) => ({ ...t, acquisitionTimeSec: v }))} min={1} max={30} step={0.5} ok={liveEval.checks.acquisition} actual={metrics.acquisitionTimeSec ?? 999} />
          <ThresholdInput label="Lock time ≥" unit="%" value={thresholds.lockTimePct} onChange={(v) => setThresholds((t) => ({ ...t, lockTimePct: v }))} min={10} max={95} step={1} ok={liveEval.checks.lockTime} actual={metrics.timeLockedPct} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="hud-label flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" /> Acquisition {metrics.acquisitionTimeSec !== null ? `${metrics.acquisitionTimeSec.toFixed(1)} s` : "—"} · Losses {metrics.lossCount} · Re-acqs {metrics.reacquireCount}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
            <Button onClick={handleExportJson} className="clay-press rounded-full" size="sm">
              <FileJson className="size-4" aria-hidden="true" /> Export Report (JSON)
            </Button>
          </motion.div>
          <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
            <Button onClick={handleExportCsv} variant="outline" className="clay-press rounded-full" size="sm">
              <FileSpreadsheet className="size-4" aria-hidden="true" /> Export CSV (log)
            </Button>
          </motion.div>
          <Button variant="ghost" size="sm" className="clay-press rounded-full" onClick={() => setThresholds({ ...BENCHMARK_THRESHOLDS })}>
            Reset thresholds
          </Button>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
          JSON contains the full session (history, events, metrics, seed). CSV is the time-series log (t, error, confidence, fps, latency). Both are SIMULATED — suitable for review or offline analysis.
        </p>
      </ClayPanel>
    </div>
  );
}

function ThresholdInput({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
  ok,
  actual,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  ok: boolean;
  actual: number;
}) {
  return (
    <div className={cn("clay-inset rounded-2xl p-3", ok ? "ring-1 ring-[color-mix(in oklch,var(--chart-4)_18%,transparent)]" : "ring-1 ring-[color-mix(in oklch,var(--chart-5)_14%,transparent)]")}>
      <div className="flex items-center justify-between gap-2">
        <label className="hud-label">{label}</label>
        <span className="hud-value text-xs font-semibold text-foreground">
          {value}
          {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[var(--primary)]" aria-label={`${label} threshold`} />
      <p className={cn("mt-1 font-mono text-[10.5px]", ok ? "text-[color-mix(in oklch,var(--chart-4)_52%,black)]" : "text-[color-mix(in oklch,var(--destructive)_60%,black)]")}>
        Actual {actual.toFixed(2)}
        {unit} · {ok ? "PASS" : "FAIL"}
      </p>
    </div>
  );
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}
