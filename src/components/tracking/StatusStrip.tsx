import { Readout } from "@/components/common/Tags";
import { SIM, STATUS_COPY, fmt, type Telemetry, type TrackingStatus } from "@/lib/tracking-engine";

/**
 * The seven headline readouts a reviewer scans first. Every tile is tagged
 * DEMO because the console is a simulation, not a hardware telemetry feed.
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
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
      <Readout
        label="Confidence"
        value={fmt.pct(telemetry.confidence)}
        hint="Model estimate, not a measurement"
      />
      <Readout
        label="Last update"
        value={new Date().toLocaleTimeString()}
        hint={`Demo tick ${SIM.fps} Hz`}
      />
    </div>
  );
}
