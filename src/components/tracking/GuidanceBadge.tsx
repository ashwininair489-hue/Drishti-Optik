import { cn } from "@/lib/utils";
import type { Guidance } from "@/lib/tracking-engine";

const GLYPH: Record<"azimuth" | "elevation", Record<Guidance, string>> = {
  azimuth: { increase: "→", decrease: "←", hold: "•" },
  elevation: { increase: "↑", decrease: "↓", hold: "•" },
};

const TONE: Record<Guidance, string> = {
  increase: "text-[color-mix(in_oklch,var(--chart-1)_62%,black)]",
  decrease: "text-[color-mix(in_oklch,var(--chart-2)_58%,black)]",
  hold: "text-muted-foreground",
};

/** Arrow telling the operator which way to slew one axis to close the error. */
export function GuidanceArrow({
  axis,
  guidance,
  className,
}: {
  axis: "azimuth" | "elevation";
  guidance: Guidance;
  className?: string;
}) {
  return (
    <span
      aria-label={`${axis} ${guidance}`}
      title={`Slew ${axis} ${guidance}`}
      className={cn("hud-value font-semibold", TONE[guidance], className)}
    >
      {GLYPH[axis][guidance]}
    </span>
  );
}
