import { ClayPanel } from "@/components/common/Clay";
import { PageHeader } from "@/components/common/Section";
import { SimulatedTag, TechBadge } from "@/components/common/Tags";
import { ControlDeck } from "@/components/tracking/ControlDeck";
import { AlignmentVectorPanel } from "@/components/tracking/AlignmentVectorPanel";
import { CameraViewport } from "@/components/tracking/CameraViewport";
import { EventLogPanel } from "@/components/tracking/EventLogPanel";
import { PipelinePanel } from "@/components/tracking/PipelinePanel";
import { SessionHistory } from "@/components/tracking/SessionHistory";
import { StatusStrip } from "@/components/tracking/StatusStrip";
import { TerminalControls } from "@/components/tracking/TerminalControls";
import { useTracker, type SessionSummary } from "@/hooks/use-tracker";
import { api } from "@/convex/_generated/api";
import { DISCLAIMERS } from "@/lib/site";
import { setLiveSimulation } from "@/lib/live-simulation";
import { usePageMeta } from "@/lib/seo";
import { SIM, STATUS_COPY } from "@/lib/tracking-engine";
import { useMutation } from "convex/react";
import { MonitorPlay } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

/**
 * The Drishti-Optik virtual camera tracking console — the centrepiece of the
 * prototype. It demonstrates the coarse alignment workflow end to end against a
 * simulated target, with no dependency on physical optical hardware.
 */
export default function TrackingConsole() {
  usePageMeta({
    title: "Virtual Camera Tracking Console | Drishti-Optik",
    description:
      "Simulated coarse alignment console: virtual sensor feed, target detection, relative offset estimation and recommended correction for mobile FSOC terminals.",
    path: "/console",
    noindex: true,
  });

  const recordSession = useMutation(api.simulation.recordSession);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSessionComplete = useCallback(
    async (summary: SessionSummary) => {
      setSaveError(null);
      try {
        const result = await recordSession({
          startedAt: summary.startedAt,
          durationSeconds: summary.durationSeconds,
          peakErrorDeg: summary.peakErrorDeg,
          finalErrorDeg: summary.finalErrorDeg,
          ticks: summary.ticks,
          mode: summary.mode,
          outcome: summary.outcome,
          rangeKm: SIM.distanceKm,
        });
        if (result.saved) setLastSaved(new Date().toLocaleTimeString());
      } catch {
        // A persistence failure must never interrupt the simulation.
        setSaveError(
          "Tracking service unavailable — this run was not saved. The simulation can still be used locally.",
        );
      }
    },
    [recordSession],
  );

  const { state, telemetry, controls } = useTracker({
    seed: 20260926,
    persist: true,
    onSessionComplete: handleSessionComplete,
  });

  // Publish the live snapshot so Drishti AI can explain the current state.
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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Virtual camera tracking console"
        title="Coarse alignment simulation"
        description="Camera input → detection → tracking → relative offset estimation → coarse alignment recommendation → confirmation. Every reading below is produced by the Drishti-Optik simulation engine."
        icon={MonitorPlay}
        badge={<SimulatedTag />}
        actions={
          <>
            <TechBadge tone={telemetry.aligned ? "ok" : "busy"} pulse={state.running}>
              {STATUS_COPY[state.status].label}
            </TechBadge>
            <Link
              to="/dashboard"
              className="clay-sm clay-press rounded-full px-3.5 py-2 text-xs font-semibold text-foreground/85"
            >
              Open dashboard
            </Link>
          </>
        }
      />

      {(saveError || lastSaved) && (
        <ClayPanel size="sm" className="px-4 py-3 text-xs">
          {saveError ? (
            <p className="text-[color-mix(in_oklch,var(--chart-5)_45%,black)]">{saveError}</p>
          ) : (
            <p className="text-muted-foreground">
              Last run saved to your alignment history at{" "}
              <span className="hud-value text-foreground">{lastSaved}</span>.
            </p>
          )}
        </ClayPanel>
      )}

      <StatusStrip
        telemetry={telemetry}
        status={state.status}
        cameraAzimuth={state.camera.azimuth}
        cameraElevation={state.camera.elevation}
        running={state.running}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <CameraViewport
            telemetry={telemetry}
            status={state.status}
            frameId="TRK-01"
            cameraAzimuth={state.camera.azimuth}
            cameraElevation={state.camera.elevation}
          />
          <ControlDeck
            running={state.running}
            mode={state.mode}
            drift={state.driftTarget}
            aligned={telemetry.aligned}
            onStart={controls.start}
            onPause={controls.pause}
            onReset={controls.reset}
            onRecenter={controls.recenter}
            onToggleDrift={controls.toggleDrift}
            onAutoAlign={controls.autoAlign}
            onModeChange={controls.setMode}
          />
          <PipelinePanel status={state.status} telemetry={telemetry} />
          <SessionHistory trace={state.history} />
        </div>

        <div className="space-y-5">
          <AlignmentVectorPanel telemetry={telemetry} />
          <TerminalControls
            camera={state.camera}
            target={state.target}
            telemetry={telemetry}
            mode={state.mode}
            onCameraChange={controls.setCamera}
            onTargetChange={controls.setTarget}
            onReset={controls.reset}
            onModeChange={controls.setMode}
          />
          <EventLogPanel events={state.events} />
        </div>
      </div>

      <ClayPanel size="sm" className="p-5 text-xs leading-5 text-muted-foreground">
        <p className="hud-label mb-2">Simulation disclaimer</p>
        <p>{DISCLAIMERS.simulation}</p>
        <p className="mt-2">{DISCLAIMERS.noControl}</p>
      </ClayPanel>
    </div>
  );
}
