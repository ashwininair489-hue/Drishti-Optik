import { Readout } from "@/components/common/Tags";
import { GuidanceArrow } from "@/components/tracking/GuidanceBadge";
import { SIM, STATUS_COPY, fmt, type Telemetry, type TrackingStatus } from "@/lib/tracking-engine";

/**
 * Headline telemetry strip a reviewer scans first. Every tile is tagged as
 * SIMULATED because the console is a model, not a hardware feed. The secondary
 * row (fps / latency / guidance) is also modelled — see Telemetry docs.
 */
export function StatusStrip({
  telemetry,
  status,
  cameraAzimuth,
  cameraElevation,
  running,
}: {
  telemetry: Telemetry;
  status: TrackingStatus;
  cameraAzimuth: number;
  cameraElevation: number;
  running: boolean;
}) {
  const copy = STATUS_COPY[status];

  return (
    <div className="grid gap-3">
      {/* Primary row — identity / lock state */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Readout label="System status" value="Nominal (sim)" hint="Simulation service online" />
        <Readout
          label="Camera status"
          value={running ? "Streaming" : "Standby"}
          hint={`AZ ${fmt.deg(cameraAzimuth)} · EL ${fmt.deg(cameraElevation)}`}
        />
        <Readout
          label="Tracking status"
          value={copy.label}
          tone={copy.tone}
          hint={running ? "Session active" : "Session not running"}
        />
        <Readout
          label="Target detection"
          value={telemetry.detected ? "Detected" : "No target"}
          tone={telemetry.detected ? "ok" : "warn"}
          hint={`${telemetry.distanceKm} km modelled range`}
        />
        <Readout
          label="Alignment status"
          value={telemetry.aligned ? "Complete" : "In progress"}
          tone={telemetry.aligned ? "ok" : "warn"}
          hint={`Tolerance ${SIM.coarseToleranceDeg}°`}
        />
      </div>
      {/* Secondary row — modelled throughput and guidance */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Readout
          label="Confidence — SIMULATED"
          value={fmt.pct(telemetry.confidence)}
          hint="Model estimate, not a measurement"
        />
        <Readout
          label="Frame rate — SIMULATED"
          value={`${telemetry.simulatedFps.toFixed(1)} fps`}
          hint={`Nominal ${SIM.fps} Hz · −${SIM.fpsConfidencePenalty} when unstable`}
        />
        <Readout
          label="Latency — SIMULATED"
          value={`${telemetry.simulatedLatencyMs.toFixed(1)} ms`}
          hint={`${SIM.baseLatencyMs} ms + error term (never measured)`}
        />
        <div className="clay-inset rounded-2xl px-3.5 py-3">
          <p className="hud-label">Directional guidance — SIMULATED</p>
          <p className="mt-1.5 flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex items-center gap-1.5 font-mono text-foreground">
              AZ <GuidanceArrow axis="azimuth" guidance={telemetry.guidance.azimuth} />
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-foreground">
              EL <GuidanceArrow axis="elevation" guidance={telemetry.guidance.elevation} />
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Slew direction to close the error</p>
        </div>
      </div>
    </div>
  );
}
