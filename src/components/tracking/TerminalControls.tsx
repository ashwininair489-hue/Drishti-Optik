import { ClayPanel } from "@/components/common/Clay";
import { SimulatedTag } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SIM, fmt, type Telemetry, type TrackingMode } from "@/lib/tracking-engine";
import { Box, Info, RotateCcw } from "lucide-react";
import { lazy, Suspense } from "react";

const TerminalScene = lazy(() => import("@/components/three/TerminalScene"));

/**
 * 3D optical terminal view plus its direct orientation controls.
 *
 * The sliders write straight into the simulation state, so dragging azimuth also
 * updates the numeric readouts and the camera viewport — there is a single
 * source of truth for the virtual boresight.
 */
export function TerminalControls({
  camera,
  target,
  telemetry,
  mode,
  onCameraChange,
  onTargetChange,
  onReset,
  onModeChange,
}: {
  camera: { azimuth: number; elevation: number };
  target: { azimuth: number; elevation: number };
  telemetry: Telemetry;
  mode: TrackingMode;
  onCameraChange: (azimuth: number, elevation: number) => void;
  onTargetChange: (azimuth: number, elevation: number) => void;
  onReset: () => void;
  onModeChange: (mode: TrackingMode) => void;
}) {
  const beamProgress = telemetry.inFov ? Math.max(0.18, telemetry.progress) : 0;

  return (
    <ClayPanel className="flex flex-col p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="hud-label">3D optical terminals — SIMULATED DATA</p>
          <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
            <Box className="size-4 text-primary" aria-hidden="true" />
            Two terminals, beam &amp; alignment vector
          </h2>
        </div>
        <SimulatedTag />
      </header>

      <div className="clay-screen relative mt-4 h-64 overflow-hidden sm:h-72">
        <Suspense
          fallback={
            <div className="flex size-full flex-col items-center justify-center gap-3">
              <div className="clay-sm size-10 animate-pulse rounded-2xl" />
              <p className="hud-label !text-white/60">Loading 3D terminal model…</p>
            </div>
          }
        >
          <TerminalScene
            className="size-full"
            azimuthDeg={camera.azimuth}
            elevationDeg={camera.elevation}
            targetAzimuthDeg={target.azimuth}
            targetElevationDeg={target.elevation}
            beamProgress={beamProgress}
            errorMagnitudeDeg={telemetry.errorMagnitudeDeg}
          />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/55">
            Drag to orbit · scroll to zoom
          </span>
          <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--chart-5)_60%,transparent)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[color-mix(in_oklch,var(--chart-5)_88%,white)]">
            Illustration
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <SliderRow
          label="Camera azimuth"
          value={`${fmt.deg(camera.azimuth)}`}
          min={-40}
          max={40}
          step={0.1}
          raw={camera.azimuth}
          onChange={(value) => onCameraChange(value, camera.elevation)}
        />
        <SliderRow
          label="Camera elevation"
          value={`${fmt.deg(camera.elevation)}`}
          min={-20}
          max={20}
          step={0.1}
          raw={camera.elevation}
          onChange={(value) => onCameraChange(camera.azimuth, value)}
        />
        <SliderRow
          label="Target azimuth offset"
          value={`${fmt.deg(target.azimuth)}`}
          min={-14}
          max={14}
          step={0.1}
          raw={target.azimuth}
          onChange={(value) => onTargetChange(value, target.elevation)}
        />
        <SliderRow
          label="Target elevation offset"
          value={`${fmt.deg(target.elevation)}`}
          min={-9}
          max={9}
          step={0.1}
          raw={target.elevation}
          onChange={(value) => onTargetChange(target.azimuth, value)}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="clay-inset flex gap-1 rounded-full p-1" role="radiogroup" aria-label="3D tracking mode">
          {(["manual", "assisted", "auto"] as TrackingMode[]).map((entry) => (
            <button
              key={entry}
              type="button"
              role="radio"
              aria-checked={mode === entry}
              onClick={() => onModeChange(entry)}
              className={
                mode === entry
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold capitalize text-primary-foreground"
                  : "rounded-full px-3 py-1.5 text-xs font-semibold capitalize text-muted-foreground hover:text-foreground"
              }
            >
              {entry}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={onReset} className="clay-press rounded-full">
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset simulation
        </Button>
      </div>

      <p className="mt-4 flex gap-2 text-[11px] leading-5 text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        The model is an illustration of the geometry, not a CAD representation of any real
        terminal. Field of view, slew rate and tolerance are prototype assumptions
        ({SIM.fovAzimuthDeg}° × {SIM.fovElevationDeg}° FOV, {SIM.slewDegPerTick}°/tick slew).
      </p>
    </ClayPanel>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  raw,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  raw: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="hud-label" htmlFor={`slider-${label}`}>
          {label}
        </label>
        <span className="hud-value text-xs font-semibold text-foreground">{value}</span>
      </div>
      <Slider
        id={`slider-${label}`}
        aria-label={label}
        className="mt-2.5"
        min={min}
        max={max}
        step={step}
        value={[raw]}
        onValueChange={(values) => onChange(values[0] ?? raw)}
      />
    </div>
  );
}
