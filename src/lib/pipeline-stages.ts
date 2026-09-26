import type { Telemetry, TrackingStatus } from "@/lib/tracking-engine";

/** Status of a single conceptual pipeline stage. */
export type StageState = "waiting" | "processing" | "completed" | "error";

export interface PipelineStageDefinition {
  id: string;
  label: string;
  detail: string;
}

/**
 * Stage status derived from the tracker state machine rather than hard-coded, so
 * the pipeline diagram cannot drift out of sync with the console.
 */
export function deriveStages(
  status: TrackingStatus,
  telemetry: Telemetry,
): Record<string, StageState> {
  const running = status !== "idle";
  const locked = status === "tracking" || status === "aligned";
  const done = status === "aligned";
  // A run that has held lock and then lost the target is a different event from
  // one that never acquired: detection drops into ERROR and the downstream
  // stages reset, rather than silently stalling in PROCESSING.
  const lost = status === "lost";
  const reacquiring = status === "reacquiring";

  // Nothing reports "completed" before a session is running: the target being
  // geometrically inside the field of view is not the same as the pipeline
  // having detected it.
  return {
    input: running ? "completed" : "waiting",
    preprocess: running ? "completed" : "waiting",
    detect: !running
      ? "waiting"
      : lost
        ? "error"
        : telemetry.detected
          ? "completed"
          : "processing",
    features: !running || !telemetry.detected
      ? "waiting"
      : locked
        ? "completed"
        : "processing",
    track: !running
      ? "waiting"
      : locked
        ? "completed"
        : reacquiring || telemetry.detected
          ? "processing"
          : "waiting",
    offset: running && telemetry.detected ? "completed" : "waiting",
    command: !running
      ? "waiting"
      : done
        ? "completed"
        : telemetry.detected
          ? "processing"
          : "waiting",
    confirm: done ? "completed" : "waiting",
  };
}

export const STAGE_TONE: Record<
  StageState,
  "idle" | "busy" | "ok" | "warn" | "error"
> = {
  waiting: "idle",
  processing: "busy",
  completed: "ok",
  error: "error",
};

export const STAGE_LABEL: Record<StageState, string> = {
  waiting: "Waiting",
  processing: "Processing",
  completed: "Completed",
  error: "Error",
};
