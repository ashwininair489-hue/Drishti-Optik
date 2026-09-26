import { useAssistant } from "@/components/assistant/assistant-context";
import { ClayPanel } from "@/components/common/Clay";
import { PageHeader } from "@/components/common/Section";
import { Readout, SimulatedTag, StatusDot, TechBadge } from "@/components/common/Tags";
import { AlignmentVectorPanel } from "@/components/tracking/AlignmentVectorPanel";
import { CameraViewport } from "@/components/tracking/CameraViewport";
import { EventLogPanel } from "@/components/tracking/EventLogPanel";
import { SessionHistory } from "@/components/tracking/SessionHistory";
import { StatusStrip } from "@/components/tracking/StatusStrip";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useTracker } from "@/hooks/use-tracker";
import { setLiveSimulation } from "@/lib/live-simulation";
import { usePageMeta } from "@/lib/seo";
import { DISCLAIMERS } from "@/lib/site";
import { STATUS_COPY, fmt } from "@/lib/tracking-engine";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import { GuidanceArrow } from "@/components/tracking/GuidanceBadge";
import {
  Activity,
  Camera,
  Database,
  LayoutDashboard,
  Sparkles,
  Waves,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { KB_PROMPTS } from "@/shared/knowledge";

/**
 * Monitoring view over the same simulation engine the console uses. It is the
 * "at a glance" surface: status, detection, alignment vector, confidence,
 * health, assistant, log and history.
 */
export default function Dashboard() {
  usePageMeta({
    title: "Tracking Console | Drishti-Optik",
    description:
      "Drishti-Optik monitoring dashboard: simulation status, target detection, alignment vector, tracking confidence, system health and persisted alignment history.",
    path: "/dashboard",
    noindex: true,
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { open } = useAssistant();

  const { state, telemetry, controls } = useTracker({ seed: 777001, persist: false });
  const sessions = useQuery(api.simulation.recentSessions, { limit: 6 });
  const stats = useQuery(api.simulation.sessionStats, {});

  const { start, pause, reset, toggleDrift, autoAlign } = controls;

  // Keep the dashboard alive: a monitoring surface with a permanently idle
  // tracker would show nothing useful. `start` is stable, so this runs once.
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    setLiveSimulation({
      statusLabel: STATUS_COPY[state.status].label,
      mode: state.mode,
      errorDeg: telemetry.errorMagnitudeDeg,
      offsetX: telemetry.offsetPx.x,
      offsetY: telemetry.offsetPx.y,
      confidencePct: telemetry.confidence * 100,
      running: state.running,
      distanceKm: telemetry.distanceKm,
    });
    return () => setLiveSimulation(null);
  }, [
    state.status,
    state.mode,
    state.running,
    telemetry.errorMagnitudeDeg,
    telemetry.offsetPx.x,
    telemetry.offsetPx.y,
    telemetry.confidence,
    telemetry.distanceKm,
  ]);

  const health = [
    {
      label: "Simulation engine",
      detail: `Deterministic tick loop at ${"30"} Hz (simulated)`,
      ok: true,
    },
    {
      label: "Backend persistence",
      detail: sessions === undefined ? "Connecting to session store…" : "Session store reachable",
      ok: sessions !== undefined,
    },
    {
      label: "Account history",
      detail: stats ? `${stats.total} saved run(s)` : "Loading history…",
      ok: stats !== undefined,
    },
    {
      label: "AI assistant",
      detail: "Curated knowledge base ready",
      ok: true,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Virtual camera tracking console"
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Monitoring view for the Drishti-Optik simulation. Status, detection, alignment, confidence, health and history are derived from the same engine as the tracking console."
        icon={LayoutDashboard}
        badge={<SimulatedTag />}
        actions={
          <>
            <TechBadge tone={telemetry.aligned ? "ok" : "busy"} pulse={state.running}>
              {STATUS_COPY[state.status].label}
            </TechBadge>
            <Button className="clay-press rounded-full" onClick={() => navigate("/console")}>
              Open full console
            </Button>
          </>
        }
      />

      <StatusStrip
        telemetry={telemetry}
        status={state.status}
        cameraAzimuth={state.camera.azimuth}
        cameraElevation={state.camera.elevation}
        running={state.running}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ClayPanel className="p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Camera className="size-4 text-primary" aria-hidden="true" />
              Camera feed
            </h2>
            <TechBadge tone={state.running ? "busy" : "idle"}>
              {state.running ? "Streaming simulation" : "Standby"}
            </TechBadge>
          </header>
          <CameraViewport
            telemetry={telemetry}
            status={state.status}
            frameId="TRK-01"
            cameraAzimuth={state.camera.azimuth}
            cameraElevation={state.camera.elevation}
          />
        </ClayPanel>

        <div className="space-y-5">
          <ConfidenceCard
            confidence={telemetry.confidence}
            fps={telemetry.simulatedFps}
            latencyMs={telemetry.simulatedLatencyMs}
            guidance={telemetry.guidance}
            status={state.status}
          />
          <ClayPanel className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">Target detection — SIMULATED DATA</h2>
              <SimulatedTag />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Readout
                label="Detection"
                value={telemetry.detected ? "Locked" : "None"}
                tone={telemetry.detected ? "ok" : "warn"}
              />
              <Readout label="Target ID" value="TRK-01 — SIMULATED" />
              <Readout label="Offset X" value={fmt.px(telemetry.offsetPx.x)} />
              <Readout label="Offset Y" value={fmt.px(telemetry.offsetPx.y)} />
              <Readout label="Centroid" value={`${telemetry.center.x.toFixed(1)}, ${telemetry.center.y.toFixed(1)} px`} />
              <Readout
                label="Bbox"
                value={`${telemetry.bbox.width}×${telemetry.bbox.height} px — SIMULATED`}
              />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Detection is modelled from the virtual target bearing — no trained network runs
              in this prototype. All values simulated.
            </p>
          </ClayPanel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AlignmentVectorPanel telemetry={telemetry} />

        <ClayPanel className="p-5">
          <header className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="size-4 text-primary" aria-hidden="true" />
              System health
            </h2>
            <TechBadge tone={health.every((item) => item.ok) ? "ok" : "warn"}>
              {health.every((item) => item.ok) ? "All nominal" : "Degraded"}
            </TechBadge>
          </header>
          <ul className="mt-4 space-y-2">
            {health.map((item) => (
              <li
                key={item.label}
                className="clay-inset flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
                <StatusDot tone={item.ok ? "ok" : "warn"} pulse={!item.ok} />
              </li>
            ))}
          </ul>
          <div className="clay-inset mt-4 flex items-start gap-2.5 rounded-2xl px-4 py-3">
            <Database className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-[11px] leading-5 text-muted-foreground">
              Saved runs are scoped to your account. Clearing history in{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => navigate("/profile")}
              >
                profile &amp; settings
              </button>{" "}
              removes them permanently.
            </p>
          </div>
        </ClayPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <ClayPanel className="flex flex-col p-5">
          <header className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              AI assistant
            </h2>
            <TechBadge tone="ok">Online</TechBadge>
          </header>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Drishti AI can explain the current simulation state, the pipeline stages and every
            readout on this page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {KB_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => open(prompt)}
                className="clay-sm clay-press rounded-full px-3.5 py-2 text-left text-xs font-medium text-foreground/85"
              >
                {prompt}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
            No ISRO systems are connected. Answers come from the curated knowledge base, or
            from a server-side model call when a key is configured.
          </p>
        </ClayPanel>

        <ClayPanel className="p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Waves className="size-4 text-primary" aria-hidden="true" />
              Live simulation controls
            </h2>
            <SimulatedTag />
          </header>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={state.running ? pause : start}
              variant="outline"
              className="clay-press rounded-full"
            >
              {state.running ? "Pause preview" : "Resume preview"}
            </Button>
            <Button onClick={autoAlign} className="clay-press rounded-full">
              Auto align
            </Button>
            <Button onClick={toggleDrift} variant="outline" className="clay-press rounded-full">
              {state.driftTarget ? "Stop drift" : "Simulate drift"}
            </Button>
            <Button onClick={reset} variant="ghost" className="clay-press rounded-full">
              Reset
            </Button>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
            {DISCLAIMERS.noControl}
          </p>
        </ClayPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <EventLogPanel events={state.events} />
        <SessionHistory trace={state.history} />
      </div>
    </div>
  );
}

function ConfidenceCard({
  confidence,
  fps,
  latencyMs,
  guidance,
  status,
}: {
  confidence: number;
  fps: number;
  latencyMs: number;
  guidance: { azimuth: import("@/lib/tracking-engine").Guidance; elevation: import("@/lib/tracking-engine").Guidance };
  status: import("@/lib/tracking-engine").TrackingStatus;
}) {
  const reduced = useReducedMotion();
  const percent = Math.round(confidence * 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - confidence);

  return (
    <ClayPanel className="p-5">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Tracking confidence</h2>
        <SimulatedTag />
      </header>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative size-32 shrink-0">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={12}
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="var(--color-chart-1)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: reduced ? 0 : 0.45, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="hud-value text-2xl font-bold text-foreground">{percent}%</span>
            <span className="hud-label !text-[9px]">modelled</span>
          </div>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          A quality signal for the current estimate. It falls as the modelled target moves away
          from boresight and is not calibrated against any hardware.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="clay-inset rounded-2xl px-3 py-2.5 text-center">
          <p className="hud-label">FPS — SIMULATED</p>
          <p className="hud-value text-sm font-semibold text-foreground">{fps.toFixed(1)}</p>
        </div>
        <div className="clay-inset rounded-2xl px-3 py-2.5 text-center">
          <p className="hud-label">Latency — SIMULATED</p>
          <p className="hud-value text-sm font-semibold text-foreground">{latencyMs.toFixed(1)} ms</p>
        </div>
        <div className="clay-inset rounded-2xl px-3 py-2.5 text-center">
          <p className="hud-label">Status</p>
          <p className="hud-value text-xs font-semibold text-foreground">{status}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 font-mono text-xs text-muted-foreground">
        Slew <GuidanceArrow axis="azimuth" guidance={guidance.azimuth} /> AZ ·{" "}
        <GuidanceArrow axis="elevation" guidance={guidance.elevation} /> EL
      </div>
    </ClayPanel>
  );
}
