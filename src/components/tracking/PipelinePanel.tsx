import { ClayPanel } from "@/components/common/Clay";
import { StatusDot } from "@/components/common/Tags";
import { EASE_OUT } from "@/components/common/Reveal";
import { STAGE_LABEL, STAGE_TONE, deriveStages } from "@/lib/pipeline-stages";
import type { Telemetry, TrackingStatus } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Binary,
  Calculator,
  Camera,
  Crosshair,
  Filter,
  Radar,
  Send,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

interface Stage {
  id: string;
  label: string;
  detail: string;
  icon: ComponentType<LucideProps>;
}

const STAGES: Stage[] = [
  { id: "input", label: "Image input", detail: "Virtual sensor frame capture", icon: Camera },
  { id: "preprocess", label: "Preprocessing", detail: "Normalise, denoise, exposure", icon: Filter },
  { id: "detect", label: "Target detection", detail: "Locate candidate in frame", icon: Radar },
  { id: "features", label: "Feature extraction", detail: "Descriptor / keypoint set", icon: Binary },
  { id: "track", label: "Target tracking", detail: "Frame-to-frame association", icon: Crosshair },
  { id: "offset", label: "Relative offset estimation", detail: "Bearing error in pixels and degrees", icon: Calculator },
  { id: "command", label: "Coarse alignment command", detail: "Recommended slew vector", icon: Send },
  { id: "confirm", label: "Alignment confirmation", detail: "Error inside tolerance band", icon: BadgeCheck },
];

export function PipelinePanel({
  status,
  telemetry,
}: {
  status: TrackingStatus;
  telemetry: Telemetry;
}) {
  const states = deriveStages(status, telemetry);
  const completed = Object.values(states).filter((state) => state === "completed").length;

  return (
    <ClayPanel className="p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="hud-label">Conceptual AI pipeline</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Coarse alignment stage monitor
          </h2>
        </div>
        <span className="clay-inset hud-value rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
          {completed}/{STAGES.length} stages
        </span>
      </header>

      <ol className="mt-4 space-y-2">
        {STAGES.map((stage, index) => {
          const state = states[stage.id];
          const Icon = stage.icon;
          const isProcessing = state === "processing";
          return (
            <li key={stage.id}>
              <motion.div
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03, ease: EASE_OUT }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors",
                  state === "completed"
                    ? "bg-[color-mix(in_oklch,var(--chart-4)_14%,var(--clay-surface))]"
                    : state === "processing"
                      ? "bg-[color-mix(in_oklch,var(--chart-1)_12%,var(--clay-surface))]"
                      : "clay-inset",
                )}
              >
                <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--clay-surface)_70%,white)] text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                  {isProcessing && (
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-[color-mix(in_oklch,var(--chart-1)_60%,transparent)]"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    <span className="hud-label mr-2 !text-[9.5px]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {stage.label}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{stage.detail}</p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <StatusDot tone={STAGE_TONE[state]} pulse={isProcessing} />
                  <span className="hud-label !text-[9.5px] !tracking-[0.1em]">
                    {STAGE_LABEL[state]}
                  </span>
                </span>
              </motion.div>

              {index < STAGES.length - 1 && (
                <div className="ml-[2.15rem] h-2 w-px overflow-hidden bg-border">
                  <AnimatePresence>
                    {state === "completed" && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        exit={{ height: 0 }}
                        className="w-px bg-[color-mix(in_oklch,var(--chart-4)_70%,black)]"
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
        Stage status is derived live from the tracker state machine. In this prototype the
        detected bounding box is modelled from the virtual target bearing, so the panel shows
        the intended workflow rather than the output of a trained network.
      </p>
    </ClayPanel>
  );
}
