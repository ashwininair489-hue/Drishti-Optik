import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { SimulatedTag } from "@/components/common/Tags";
import { Progress } from "@/components/ui/progress";
import { SIM, fmt, type Telemetry } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { MoveDiagonal2, Target } from "lucide-react";

/**
 * The recommended coarse correction.
 *
 * The correction is the equal-and-opposite of the estimated bearing error, which
 * is why the sign flips between the two blocks below. Everything is simulated.
 */
export function AlignmentVectorPanel({ telemetry }: { telemetry: Telemetry }) {
  const withinTolerance = telemetry.errorMagnitudeDeg <= SIM.coarseToleranceDeg;
  const progress = Math.min(
    100,
    Math.max(0, (1 - telemetry.errorMagnitudeDeg / (SIM.fovAzimuthDeg / 2)) * 100),
  );

  return (
    <ClayPanel className="p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="hud-label">Alignment vector</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Relative offset &amp; recommended correction
          </h2>
        </div>
        <SimulatedTag />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="clay-inset rounded-2xl p-3.5">
          <p className="hud-label">Target offset</p>
          <p className="hud-value mt-2 text-lg font-semibold text-foreground">
            ΔX {fmt.px(telemetry.offsetPx.x)}
          </p>
          <p className="hud-value mt-1 text-lg font-semibold text-foreground">
            ΔY {fmt.px(telemetry.offsetPx.y)}
          </p>
        </div>
        <div className="clay-inset rounded-2xl p-3.5">
          <p className="hud-label">Bearing error</p>
          <p className="hud-value mt-2 text-lg font-semibold text-foreground">
            AZ {fmt.deg(telemetry.error.azimuthDeg)}
          </p>
          <p className="hud-value mt-1 text-lg font-semibold text-foreground">
            EL {fmt.deg(telemetry.error.elevationDeg)}
          </p>
        </div>
      </div>

      <ClayInset className="mt-3 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="hud-label">Recommended correction</p>
          <MoveDiagonal2 className="size-3.5 text-primary" aria-hidden="true" />
        </div>
        <p className="hud-value mt-2 text-sm font-semibold text-foreground/90">
          Azimuth {fmt.deg(telemetry.correction.azimuthDeg)}
        </p>
        <p className="hud-value mt-1 text-sm font-semibold text-foreground/90">
          Elevation {fmt.deg(telemetry.correction.elevationDeg)}
        </p>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          Equal and opposite to the estimated error. Applying this moves the boresight toward
          the target estimate.
        </p>
      </ClayInset>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="hud-label">Coarse alignment progress</p>
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
