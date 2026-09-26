import { ClayPanel } from "@/components/common/Clay";
import { SimulatedTag } from "@/components/common/Tags";
import { SIM, STATUS_BADGE, type Telemetry, type TrackingStatus } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Crosshair, Eye, ScanLine, Target } from "lucide-react";

export type ErrorUnit = "deg" | "mrad" | "px";

interface CameraViewPanelProps {
  telemetry: Telemetry;
  status: TrackingStatus;
  errorUnit: ErrorUnit;
  onUnitChange: (unit: ErrorUnit) => void;
  cameraAzimuth: number;
  cameraElevation: number;
}

function badgeTone(status: TrackingStatus): string {
  switch (status) {
    case "tracking":
    case "aligned":
      return "bg-[color-mix(in_oklch,var(--chart-4)_86%,black)] text-white";
    case "acquiring":
      return "bg-[color-mix(in oklch,var(--chart-1)_82%,black)] text-white";
    case "reacquiring":
      return "bg-[color-mix(in oklch,var(--chart-5)_80%,black)] text-white";
    case "lost":
      return "bg-[color-mix(in oklch,var(--destructive)_78%,black)] text-white";
    case "searching":
      return "bg-[color-mix(in oklch,var(--chart-5)_32%,black)] text-white border border-[color-mix(in oklch,var(--chart-5)_40%,transparent)]";
    default:
      return "bg-white/10 text-white/80 border border-white/15";
  }
}

function formatError(telemetry: Telemetry, unit: ErrorUnit) {
  if (unit === "mrad") {
    return {
      az: `${telemetry.errorMradAz >= 0 ? "+" : ""}${telemetry.errorMradAz.toFixed(2)} mrad`,
      el: `${telemetry.errorMradEl >= 0 ? "+" : ""}${telemetry.errorMradEl.toFixed(2)} mrad`,
      mag: `${telemetry.errorMrad.toFixed(2)} mrad`,
    };
  }
  if (unit === "px") {
    return {
      az: `${telemetry.offsetPx.x >= 0 ? "+" : ""}${telemetry.offsetPx.x.toFixed(1)} px`,
      el: `${telemetry.offsetPx.y >= 0 ? "+" : ""}${telemetry.offsetPx.y.toFixed(1)} px`,
      mag: `${Math.hypot(telemetry.offsetPx.x, telemetry.offsetPx.y).toFixed(1)} px`,
    };
  }
  return {
    az: `${telemetry.error.azimuthDeg >= 0 ? "+" : ""}${telemetry.error.azimuthDeg.toFixed(2)}°`,
    el: `${telemetry.error.elevationDeg >= 0 ? "+" : ""}${telemetry.error.elevationDeg.toFixed(2)}°`,
    mag: `${telemetry.errorMagnitudeDeg.toFixed(3)}°`,
  };
}

/**
 * Camera View — the "what the camera sees" panel.
 *
 * Cropped/zoomed view centred on the camera boresight. Shows only the
 * 12°×7° FOV, with bounding box / crosshair overlay on the beacon, a status
 * badge (ACQUIRING / TRACKING / LOST / REACQUIRING), and a live numeric
 * pointing-error readout. Slewing is smooth, frame-by-frame.
 */
export function CameraViewPanel({
  telemetry,
  status,
  errorUnit,
  onUnitChange,
  cameraAzimuth,
  cameraElevation,
}: CameraViewPanelProps) {
  const reduced = useReducedMotion();
  const badge = STATUS_BADGE[status];
  const tone = badgeTone(status);
  const err = formatError(telemetry, errorUnit);
  const inFov = telemetry.inFov;
  const occluded = telemetry.occluded;
  const centreX = telemetry.center.x;
  const centreY = telemetry.center.y;
  const centreOfFrame = { x: SIM.frameWidth / 2, y: SIM.frameHeight / 2 };
  const isLost = status === "lost";
  const isReacquiring = status === "reacquiring";
  const isLocked = status === "tracking" || status === "aligned";

  return (
    <ClayPanel className="flex flex-col gap-3 p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="hud-label flex items-center gap-1.5">
            <Eye className="size-3.5" aria-hidden="true" /> Camera view — SIMULATED DATA
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ScanLine className="size-4 text-primary" aria-hidden="true" /> What the virtual camera sees
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SimulatedTag />
          <span className={cn("rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em]", tone)}>{badge}</span>
        </div>
      </header>

      {/* Sensor frame */}
      <div className="clay-screen relative isolate overflow-hidden aspect-video w-full">
        {/* Sensor gradient */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(110% 85% at 50% 10%, color-mix(in oklch, var(--hud-cyan) 10%, transparent), transparent 58%), radial-gradient(85% 70% at 22% 100%, color-mix(in oklch, var(--hud-violet) 12%, transparent), transparent 62%), linear-gradient(180deg, oklch(0.23 0.03 266), oklch(0.19 0.03 266))",
          }}
        />
        <div className="hud-scanlines absolute inset-0 opacity-55" aria-hidden="true" />

        {/* Reference grid */}
        <svg className="absolute inset-0 size-full opacity-45" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
          {[60, 120, 180].map((r) => (
            <circle key={r} cx={centreOfFrame.x} cy={centreOfFrame.y} r={r} fill="none" stroke="color-mix(in oklch, var(--hud-cyan) 26%, transparent)" strokeWidth={0.7} strokeDasharray="5 8" />
          ))}
          <line x1={centreOfFrame.x} y1={0} x2={centreOfFrame.x} y2={360} stroke="color-mix(in oklch, var(--hud-cyan) 50%, transparent)" strokeWidth={0.9} />
          <line x1={0} y1={centreOfFrame.y} x2={640} y2={centreOfFrame.y} stroke="color-mix(in oklch, var(--hud-cyan) 50%, transparent)" strokeWidth={0.9} />
        </svg>

        {/* Sweep when acquiring */}
        {inFov && status !== "aligned" && !isLost && !reduced && (
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "conic-gradient(from 0deg, color-mix(in oklch, var(--hud-cyan) 18%, transparent), transparent 42%)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Tracking reticles */}
        {inFov && isLocked && (
          <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
            <circle cx={centreX} cy={centreY} r={42} fill="none" stroke="color-mix(in oklch, var(--chart-4) 42%, white)" strokeWidth={1} strokeDasharray="7 6" className={reduced ? "" : "animate-[spin_6s_linear_infinite] [transform-origin:var(--x)_var(--y)]"} style={{ ["--x" as string]: `${centreX}px`, ["--y" as string]: `${centreY}px` } as React.CSSProperties} />
            <circle cx={centreX} cy={centreY} r={20} fill="none" stroke="color-mix(in oklch, var(--chart-4) 72%, white)" strokeWidth={1.25} />
            {[0, 90, 180, 270].map((a) => {
              const rad = (a * Math.PI) / 180;
              return <line key={a} x1={centreX + Math.cos(rad) * 26} y1={centreY + Math.sin(rad) * 26} x2={centreX + Math.cos(rad) * 32} y2={centreY + Math.sin(rad) * 32} stroke="color-mix(in oklch, var(--chart-4) 80%, white)" strokeWidth={1.35} />;
            })}
          </svg>
        )}
        {inFov && isReacquiring && (
          <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
            <circle cx={centreX} cy={centreY} r={36} fill="none" stroke="color-mix(in oklch, var(--chart-5) 70%, white)" strokeWidth={1.35} strokeDasharray="8 7" className={reduced ? "" : "animate-pulse"} />
            <circle cx={centreX} cy={centreY} r={16} fill="none" stroke="color-mix(in oklch, var(--chart-5) 52%, transparent)" strokeWidth={1} strokeDasharray="3 5" />
          </svg>
        )}

        {/* Bbox + alignment vector — the detection overlay */}
        {inFov && !occluded && (
          <svg className="absolute inset-0 size-full" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
            <line x1={centreOfFrame.x} y1={centreOfFrame.y} x2={centreX} y2={centreY} stroke={isLost ? "color-mix(in oklch, var(--destructive) 75%, white)" : isReacquiring ? "color-mix(in oklch, var(--chart-5) 78%, white)" : "color-mix(in oklch, var(--hud-violet) 85%, white)"} strokeWidth={1.5} strokeDasharray="6 5" opacity={isLost ? 0.55 : 1} />
            <rect x={telemetry.bbox.x} y={telemetry.bbox.y} width={telemetry.bbox.width} height={telemetry.bbox.height} fill={isLost ? "color-mix(in oklch, var(--destructive) 10%, transparent)" : isReacquiring ? "color-mix(in oklch, var(--chart-5) 10%, transparent)" : "color-mix(in oklch, var(--chart-4) 12%, transparent)"} stroke={isLost ? "color-mix(in oklch, var(--destructive) 72%, white)" : isReacquiring ? "color-mix(in oklch, var(--chart-5) 72%, white)" : "color-mix(in oklch, var(--chart-4) 80%, white)"} strokeWidth={2} rx={10} strokeDasharray={isReacquiring ? "7 5" : undefined} />
            <circle cx={centreX} cy={centreY} r={4.2} fill={isLost ? "color-mix(in oklch, var(--destructive) 88%, white)" : isReacquiring ? "color-mix(in oklch, var(--chart-5) 88%, white)" : "color-mix(in oklch, var(--chart-4) 92%, white)"} />
            <circle cx={centreX} cy={centreY} r={11} fill="none" stroke={isLost ? "color-mix(in oklch, var(--destructive) 58%, white)" : "color-mix(in oklch, var(--chart-4) 70%, white)"} strokeWidth={1.15} />
            <line x1={centreX - 7} y1={centreY} x2={centreX + 7} y2={centreY} stroke="rgba(255,255,255,0.88)" strokeWidth={1} />
            <line x1={centreX} y1={centreY - 7} x2={centreX} y2={centreY + 7} stroke="rgba(255,255,255,0.88)" strokeWidth={1} />
          </svg>
        )}

        {/* Boresight crosshair */}
        <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
          <circle cx={centreOfFrame.x} cy={centreOfFrame.y} r={26} fill="none" stroke="color-mix(in oklch, var(--hud-cyan) 70%, white)" strokeWidth={1.35} />
          <line x1={centreOfFrame.x - 12} y1={centreOfFrame.y} x2={centreOfFrame.x + 12} y2={centreOfFrame.y} stroke="color-mix(in oklch, var(--hud-cyan) 88%, white)" strokeWidth={1.35} />
          <line x1={centreOfFrame.x} y1={centreOfFrame.y - 12} x2={centreOfFrame.x} y2={centreOfFrame.y + 12} stroke="color-mix(in oklch, var(--hud-cyan) 88%, white)" strokeWidth={1.35} />
          <path d="M18 46V18h28M594 18h28v28M622 314v28h-28M46 342H18v-28" fill="none" stroke="color-mix(in oklch, var(--hud-cyan) 45%, white)" strokeWidth={2} />
        </svg>

        {/* Beacon label */}
        {inFov && !occluded && (
          <motion.div className="absolute" style={{ x: "-50%" }} animate={{ left: `${(centreX / SIM.frameWidth) * 100}%`, top: `${(centreY / SIM.frameHeight) * 100}%` }} transition={{ duration: reduced ? 0 : 1 / SIM.fps, ease: "linear" }}>
            <div className={cn("translate-y-[13px] whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold tracking-wide text-white", isLost ? "bg-[color-mix(in_oklch,var(--destructive)_78%,black)]" : isReacquiring ? "bg-[color-mix(in oklch,var(--chart-5)_74%,black)]" : "bg-[color-mix(in oklch,var(--chart-4)_84%,black)]")}>
              TRK-01 · {Math.round(telemetry.confidence * 100)}%{isLocked && " · LOCK"}{isReacquiring && " · RE-ACQ"}
            </div>
          </motion.div>
        )}

        {/* Top bar — status badge + FPS/latency */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className={cn("rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur", tone)}>{badge}{occluded && " · OCCLUDED"}</span>
          <span className="rounded-full bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/75 backdrop-blur border border-white/10">
            {SIM.frameWidth}×{SIM.frameHeight} · {telemetry.simulatedFps.toFixed(1)} fps · {telemetry.simulatedLatencyMs.toFixed(1)} ms
          </span>
        </div>

        {/* Bottom — error readout (live, unit-switchable) */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 font-mono text-[11px] font-semibold text-white backdrop-blur border border-white/10">
              <Target className="size-3.5" aria-hidden="true" /> Err AZ {err.az} · EL {err.el} · |err| {err.mag}
            </span>
            {!inFov && <span className="rounded-full bg-[color-mix(in oklch,var(--destructive)_22%,black)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white backdrop-blur">Target outside FOV</span>}
            {occluded && <span className="rounded-full bg-black/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white backdrop-blur">Dropout active</span>}
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/55">
            <Crosshair className="size-3" aria-hidden="true" /> Boresight AZ {cameraAzimuth >= 0 ? "+" : ""}{cameraAzimuth.toFixed(2)}° · EL {cameraElevation >= 0 ? "+" : ""}{cameraElevation.toFixed(2)}°
          </div>
        </div>

        {/* Occlusion veil */}
        {occluded && <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_14px,color-mix(in_oklch,white_6%,transparent)_14px,color-mix(in_oklch,white_6%,transparent)_15px)] opacity-60" aria-hidden="true" />}
      </div>

      {/* Unit switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="hud-label">Pointing error unit</span>
        <div className="clay-inset flex gap-1 rounded-full p-1" role="radiogroup" aria-label="Pointing error unit">
          {(["deg", "mrad", "px"] as const).map((u) => {
            const active = errorUnit === u;
            const label = u === "deg" ? "° (deg)" : u === "mrad" ? "mrad" : "px";
            return (
              <button key={u} type="button" role="radio" aria-checked={active} onClick={() => onUnitChange(u)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            );
          })}
        </div>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">Optical axis = centre · SIMULATED</span>
      </div>

      <p className="text-[11px] leading-5 text-muted-foreground">
        Bounding box + crosshair follow the modelled detection. The axis at the centre is the optical axis. Error is the angular (or pixel) offset from that axis to the estimated beacon. <span className="font-medium text-foreground/70">All values SIMULATED DATA.</span>
      </p>
    </ClayPanel>
  );
}
