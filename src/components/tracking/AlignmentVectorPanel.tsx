import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { SimulatedTag } from "@/components/common/Tags";
import { GuidanceArrow } from "@/components/tracking/GuidanceBadge";
import { Progress } from "@/components/ui/progress";
import { SIM, fmt, type Telemetry } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { Crosshair, MoveDiagonal2, Navigation, Target } from "lucide-react";

/**
 * The recommended coarse correction.
 *
 * `error = target - boresight`, so the correction is the slew the terminal must
 * apply and equals the error on both axes — the same arithmetic the auto-align
 * slew performs. Only the pixel readout flips sign on Y, because pixel rows
 * increase downwards while elevation increases upwards.
 */
export function AlignmentVectorPanel({ telemetry }: { telemetry: Telemetry }) {
  const withinTolerance = telemetry.errorMagnitudeDeg <= SIM.coarseToleranceDeg;
  const progress = Math.min(
    100,
    Math.max(0, (1 - telemetry.errorMagnitudeDeg / (SIM.fovAzimuthDeg / 2)) * 100),
  );

  const azGuidance = telemetry.guidance.azimuth;
  const elGuidance = telemetry.guidance.elevation;

  return (
    <ClayPanel className="p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="hud-label">Alignment vector — SIMULATED DATA</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Relative offset &amp; recommended correction
          </h2>
        </div>
        <SimulatedTag />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="clay-inset rounded-2xl p-3.5">
          <p className="hud-label flex items-center gap-1.5">
            <Target className="size-3.5" aria-hidden="true" /> Target offset — SIMULATED
          </p>
          <p className="hud-value mt-2 text-lg font-semibold text-foreground">
            ΔX {fmt.px(telemetry.offsetPx.x)}
          </p>
          <p className="hud-value mt-1 text-lg font-semibold text-foreground">
            ΔY {fmt.px(telemetry.offsetPx.y)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
            <GuidanceArrow axis="azimuth" guidance={azGuidance} /> AZ ·{" "}
            <GuidanceArrow axis="elevation" guidance={elGuidance} /> EL
          </p>
        </div>
        <div className="clay-inset rounded-2xl p-3.5">
          <p className="hud-label">Bearing error — SIMULATED</p>
          <p className="hud-value mt-2 text-lg font-semibold text-foreground">
            AZ {fmt.deg(telemetry.error.azimuthDeg)}
          </p>
          <p className="hud-value mt-1 text-lg font-semibold text-foreground">
            EL {fmt.deg(telemetry.error.elevationDeg)}
          </p>
          <p className="mt-2 font-mono text-[10.5px] text-muted-foreground">
            |err| {telemetry.errorMagnitudeDeg.toFixed(3)}° · {telemetry.distanceKm} km
          </p>
        </div>
      </div>

      {/* Centroid and position estimation — both in view coordinates */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="clay-inset flex flex-col gap-2 rounded-2xl p-3.5">
          <p className="hud-label flex items-center gap-1.5">
            <Crosshair className="size-3.5" aria-hidden="true" /> Estimated centroid — SIMULATED
          </p>
          <p className="hud-value text-sm font-semibold text-foreground">
            {telemetry.center.x.toFixed(1)}, {telemetry.center.y.toFixed(1)} px
          </p>
          <p className="text-[11px] leading-4 text-muted-foreground">
            Modelled bounding-box centre in the {SIM.frameWidth}×{SIM.frameHeight} virtual frame.
          </p>
        </div>
        <div className="clay-inset flex flex-col gap-2 rounded-2xl p-3.5">
          <p className="hud-label flex items-center gap-1.5">
            <Navigation className="size-3.5" aria-hidden="true" /> Position estimate — SIMULATED
          </p>
          <p className="hud-value text-sm font-semibold text-foreground">
            {telemetry.center.x.toFixed(1)} px · {telemetry.center.y.toFixed(1)} px
          </p>
          <p className="text-[11px] leading-4 text-muted-foreground">
            Bbox {telemetry.bbox.width}×{telemetry.bbox.height} px · lock{" "}
            {Math.round(telemetry.progress * 100)}%
          </p>
        </div>
      </div>

      <ClayInset className="mt-3 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="hud-label">Recommended correction — SIMULATED</p>
          <MoveDiagonal2 className="size-3.5 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="hud-label">Azimuth</p>
            <p className="hud-value flex items-center gap-2 text-sm font-semibold text-foreground/90">
              {fmt.deg(telemetry.correction.azimuthDeg)}
              <GuidanceArrow axis="azimuth" guidance={azGuidance} className="text-base" />
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {azGuidance === "hold"
                ? "Hold"
                : azGuidance === "increase"
                  ? "Increase AZ →"
                  : "Decrease AZ ←"}
            </p>
          </div>
          <div>
            <p className="hud-label">Elevation</p>
            <p className="hud-value flex items-center gap-2 text-sm font-semibold text-foreground/90">
              {fmt.deg(telemetry.correction.elevationDeg)}
              <GuidanceArrow axis="elevation" guidance={elGuidance} className="text-base" />
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {elGuidance === "hold"
                ? "Hold"
                : elGuidance === "increase"
                  ? "Increase EL ↑"
                  : "Decrease EL ↓"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
          The slew to apply: it moves the boresight onto the target estimate, exactly as the
          auto-align sequence does. Note the pixel readout above shows ΔY with the opposite sign,
          because pixel rows count downwards while elevation counts upwards. Arrows show the
          direction the gimbal must move to close the error.
        </p>
      </ClayInset>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="hud-label">Coarse alignment progress — SIMULATED</p>
          <p
            className={cn(
              "hud-value text-sm font-semibold",
              withinTolerance
                ? "text-[color-mix(in_oklch,var(--chart-4)_58%,black)]"
                : "text-foreground",
            )}
          >
            {fmt.deg(telemetry.errorMagnitudeDeg)} error
          </p>
        </div>
        <Progress value={progress} className="clay-inset mt-2 h-3" aria-label="Coarse alignment progress" />
        <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-muted-foreground">
          <Target className="size-3.5 shrink-0" aria-hidden="true" />
          Declared complete inside {SIM.coarseToleranceDeg}° (prototype assumption for legibility).
        </p>
      </div>
    </ClayPanel>
  );
}
