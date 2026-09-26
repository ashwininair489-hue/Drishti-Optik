import { ClayPanel } from "@/components/common/Clay";
import { Reveal } from "@/components/common/Reveal";
import { PageHeader } from "@/components/common/Section";
import { SimulatedTag, TechBadge } from "@/components/common/Tags";
import { AlignmentVectorPanel } from "@/components/tracking/AlignmentVectorPanel";
import { ControlDeck } from "@/components/tracking/ControlDeck";
import { EventLogPanel } from "@/components/tracking/EventLogPanel";
import { PipelinePanel } from "@/components/tracking/PipelinePanel";
import { SessionHistory } from "@/components/tracking/SessionHistory";
import { StatusStrip } from "@/components/tracking/StatusStrip";
import { TerminalControls } from "@/components/tracking/TerminalControls";
import { CameraViewPanel, type ErrorUnit } from "@/components/tracking/CameraViewPanel";
import { WorldViewPanel } from "@/components/tracking/WorldViewPanel";
import { DisturbancePanel } from "@/components/tracking/DisturbancePanel";
import { TelemetryReportPanel } from "@/components/tracking/TelemetryReportPanel";
import { useTracker, type SessionSummary } from "@/hooks/use-tracker";
import { api } from "@/convex/_generated/api";
import { DISCLAIMERS } from "@/lib/site";
import { setLiveSimulation } from "@/lib/live-simulation";
import { usePageMeta } from "@/lib/seo";
import { SIM, STATUS_COPY } from "@/lib/tracking-engine";
import { useMutation } from "convex/react";
import { MonitorPlay, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

/**
 * The Drishti-Optik virtual camera tracking console — the centrepiece of the
 * prototype. Demonstrates the coarse alignment workflow end to end against a
 * simulated target, with no dependency on physical optical hardware. Every
 * numeric value is SIMULATED DATA.
 */
export default function TrackingConsole() {
  usePageMeta({
    title: "Virtual Camera Tracking Console | Drishti-Optik",
    description:
      "Simulated coarse alignment console: world view + camera view, detection overlay with status badge and pointing-error readout, disturbance controls, live telemetry chart, stat cards and exportable benchmark report. All values SIMULATED DATA.",
    path: "/console",
    noindex: true,
  });

  const recordSession = useMutation(api.simulation.recordSession);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errorUnit, setErrorUnit] = useState<ErrorUnit>("deg");

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
        eyebrow="Virtual camera tracking console — SIMULATED DATA"
        title="Coarse alignment simulation"
        description="World view (full airspace + beacon trail + FOV) → Camera view (what the camera sees, with detection overlay) → Disturbance lab → Live telemetry & benchmark report. Every reading below is SIMULATED — a software demonstration, not a hardware measurement."
        icon={MonitorPlay}
        badge={<SimulatedTag>SIMULATED DATA</SimulatedTag>}
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

      {/* Feature 1 & 2 — World View + Camera View (the lab) */}
      <Reveal>
        <div className="grid gap-5 xl:grid-cols-2">
          <WorldViewPanel telemetry={telemetry} camera={state.camera} />
          <CameraViewPanel
            telemetry={telemetry}
            status={state.status}
            errorUnit={errorUnit}
            onUnitChange={setErrorUnit}
            cameraAzimuth={state.camera.azimuth}
            cameraElevation={state.camera.elevation}
          />
        </div>
      </Reveal>

      {/* Feature 3 — Disturbance lab + fine target controls */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <DisturbancePanel
          running={state.running}
          motionPattern={state.motionPattern}
          noiseIntensity={state.noiseIntensity}
          occlusionRemaining={state.occlusionRemaining}
          onSetPattern={controls.setMotionPattern}
          onSetNoise={controls.setNoiseIntensity}
          onTriggerOcclusion={() => controls.triggerOcclusion()}
          onApplyPreset={controls.applyPreset}
          onStart={controls.start}
          onPause={controls.pause}
          onReset={controls.reset}
          onRecenter={controls.recenter}
          onAutoAlign={controls.autoAlign}
          aligned={telemetry.aligned}
        />
        <div className="space-y-5">
          <AlignmentVectorPanel telemetry={telemetry} />
          <ControlDeck
            running={state.running}
            mode={state.mode}
            drift={state.driftTarget}
            aligned={telemetry.aligned}
            target={state.target}
            camera={state.camera}
            onStart={controls.start}
            onPause={controls.pause}
            onReset={controls.reset}
            onRecenter={controls.recenter}
            onToggleDrift={controls.toggleDrift}
            onAutoAlign={controls.autoAlign}
            onModeChange={controls.setMode}
            onSetTarget={controls.setTarget}
            onSetCamera={controls.setCamera}
            onNudgeTarget={controls.nudgeTarget}
          />
        </div>
      </div>

      {/* Feature 4 — Performance telemetry & benchmark report */}
      <Reveal>
        <TelemetryReportPanel state={state} />
      </Reveal>

      {/* Supporting panels — pipeline, 3D, log, history */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-5">
          <PipelinePanel status={state.status} telemetry={telemetry} />
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
        </div>
        <div className="space-y-5">
          <EventLogPanel events={state.events} />
          <SessionHistory trace={state.history} />
        </div>
      </div>

      <ClayPanel size="sm" className="flex flex-col gap-3 p-5">
        <p className="hud-label flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" /> SIMULATED DATA — disclaimer
        </p>
        <p className="text-xs leading-5 text-muted-foreground">{DISCLAIMERS.simulation}</p>
        <p className="text-xs leading-5 text-muted-foreground">{DISCLAIMERS.noControl}</p>
        <p className="text-[11px] leading-5 text-muted-foreground/80">
          Pointing error is shown in degrees, milliradians (1° = 17.45 mrad) and pixels interchangeably — all three are the same SIMULATED geometry expressed in different units. Thresholds in the benchmark report are configurable prototype assumptions.
        </p>
      </ClayPanel>
    </div>
  );
}
