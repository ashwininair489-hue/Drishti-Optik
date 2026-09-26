import { ClayPanel } from "@/components/common/Clay";
import { SimulatedTag } from "@/components/common/Tags";
import { SIM, type Telemetry } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Globe, Map, Scan, Target } from "lucide-react";

interface WorldViewPanelProps {
  telemetry: Telemetry;
  camera: { azimuth: number; elevation: number };
  className?: string;
}

/**
 * World View — the "big picture" panel.
 *
 * Shows the entire simulated airspace (az ±16°, el ±10°) with:
 * - beacon trail (fading path)
 * - current beacon position
 * - camera FOV rectangle (what the Camera View will see)
 * - boresight crosshair + grid
 *
 * All coordinates are SIMULATED. The panel is intentionally larger than the
 * 12°×7° camera frustum so loss / re-acquisition is obvious at a glance.
 */
export function WorldViewPanel({ telemetry, camera, className }: WorldViewPanelProps) {
  const reduced = useReducedMotion();
  const trail = telemetry.beaconTrail ?? [];
  // Map simulation degrees → SVG viewBox 0..320 × 0..180
  const MAP_W = 320;
  const MAP_H = 180;
  const AZ_RANGE = 32; // -16..16
  const EL_RANGE = 20; // -10..10
  const AZ_MIN = -16;
  const EL_MAX = 10;

  function project(p: { azimuth: number; elevation: number }) {
    const x = ((p.azimuth - AZ_MIN) / AZ_RANGE) * MAP_W;
    const y = ((EL_MAX - p.elevation) / EL_RANGE) * MAP_H;
    return { x, y };
  }

  const cam = project(camera);
  const currentBeaconPct = (() => {
    const p = trail.length
      ? project({ azimuth: trail[trail.length - 1]!.azimuth, elevation: trail[trail.length - 1]!.elevation })
      : project({ azimuth: 3.1, elevation: -2.2 });
    return { leftPct: (p.x / MAP_W) * 100, topPct: (p.y / MAP_H) * 100 };
  })();
  const fovPct = {
    leftPct: ((cam.x - (SIM.fovAzimuthDeg / AZ_RANGE) * MAP_W / 2) / MAP_W) * 100,
    topPct: ((cam.y - (SIM.fovElevationDeg / EL_RANGE) * MAP_H / 2) / MAP_H) * 100,
    wPct: (SIM.fovAzimuthDeg / AZ_RANGE) * 100,
    hPct: (SIM.fovElevationDeg / EL_RANGE) * 100,
  };

  // Build trail path d
  const trailPath =
    trail.length > 1
      ? "M " + trail.map((p) => {
          const q = project(p);
          return `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        }).join(" L ")
      : null;

  // FOV rectangle — percent-based so it stays aligned in the responsive container

  const beaconInFov = telemetry.inFov;

  return (
    <ClayPanel className={cn("flex flex-col p-4 sm:p-5", className)}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="hud-label flex items-center gap-1.5">
            <Globe className="size-3.5" aria-hidden="true" /> World view — SIMULATED DATA
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Map className="size-4 text-primary" aria-hidden="true" /> Full simulated environment
          </h2>
        </div>
        <SimulatedTag />
      </header>

      <div className="clay-screen relative mt-4 overflow-hidden aspect-[16/9]">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(90% 70% at 18% 18%, color-mix(in oklch, var(--chart-1) 12%, transparent), transparent 60%), radial-gradient(70% 60% at 85% 90%, color-mix(in oklch, var(--chart-2) 10%, transparent), transparent 65%), linear-gradient(180deg, oklch(0.26 0.03 266), oklch(0.2 0.03 266))",
          }}
        />
        {/* Grid */}
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
          {/* Vertical/horizontal grid lines every 4° */}
          {Array.from({ length: 9 }).map((_, i) => {
            const az = AZ_MIN + i * 4;
            const { x } = project({ azimuth: az, elevation: 0 });
            return <line key={`v-${i}`} x1={x} y1={0} x2={x} y2={MAP_H} stroke="rgba(255,255,255,0.07)" strokeWidth={0.7} />;
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const el = EL_MAX - i * 4;
            const { y } = project({ azimuth: 0, elevation: el });
            return <line key={`h-${i}`} x1={0} y1={y} x2={MAP_W} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.7} />;
          })}
          {/* Center crosshair */}
          {(() => {
            const c = project({ azimuth: 0, elevation: 0 });
            return (
              <g stroke="rgba(255,255,255,0.18)" strokeWidth={0.9}>
                <line x1={c.x - 14} y1={c.y} x2={c.x + 14} y2={c.y} />
                <line x1={c.x} y1={c.y - 14} x2={c.x} y2={c.y + 14} />
                <circle cx={c.x} cy={c.y} r={10} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={0.8} />
              </g>
            );
          })()}
          {/* Beacon trail */}
          {trailPath && (
            <path
              d={trailPath}
              fill="none"
              stroke="color-mix(in oklch, var(--chart-4) 72%, white)"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
              strokeDasharray="0"
              style={{ filter: "drop-shadow(0 0 6px color-mix(in oklch, var(--chart-4) 40%, transparent))" }}
            />
          )}
          {/* Trail fading dots — sparse for clarity */}
          {trail.filter((_, i) => i % 14 === 0).map((p, i) => {
            const q = project(p);
            const opacity = 0.18 + (i / Math.max(1, trail.length / 14)) * 0.5;
            return <circle key={`d-${i}`} cx={q.x} cy={q.y} r={1.2} fill="white" opacity={opacity * 0.55} />;
          })}
        </svg>

        {/* FOV rectangle — smooth transition when camera slews (percent-based, stays sharp at any width) */}
        <motion.div
          className="absolute rounded-[10px] border-2"
          style={{
            borderColor: beaconInFov ? "color-mix(in oklch, var(--hud-cyan) 82%, white)" : "color-mix(in oklch, var(--chart-5) 70%, white)",
            background: beaconInFov
              ? "color-mix(in oklch, var(--hud-cyan) 10%, transparent)"
              : "color-mix(in oklch, var(--chart-5) 10%, transparent)",
            boxShadow: beaconInFov ? "0 0 18px color-mix(in oklch, var(--hud-cyan) 22%, transparent), inset 0 0 12px color-mix(in oklch, var(--hud-cyan) 14%, transparent)" : "0 0 14px color-mix(in oklch, var(--chart-5) 18%, transparent)",
            width: `${fovPct.wPct}%`,
            height: `${fovPct.hPct}%`,
          }}
          animate={{
            left: `${fovPct.leftPct}%`,
            top: `${fovPct.topPct}%`,
          }}
          transition={{ duration: reduced ? 0 : 1 / SIM.fps, ease: "linear" }}
        >
          {/* corner ticks */}
          <span className="absolute -left-[1px] -top-[1px] size-3 border-l-2 border-t-2 rounded-tl-[8px] border-white/70" aria-hidden="true" />
          <span className="absolute -right-[1px] -top-[1px] size-3 border-r-2 border-t-2 rounded-tr-[8px] border-white/70" aria-hidden="true" />
          <span className="absolute -left-[1px] -bottom-[1px] size-3 border-l-2 border-b-2 rounded-bl-[8px] border-white/70" aria-hidden="true" />
          <span className="absolute -right-[1px] -bottom-[1px] size-3 border-r-2 border-b-2 rounded-br-[8px] border-white/70" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 bg-white/40" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-white/40" aria-hidden="true" />
        </motion.div>

        {/* Beacon current — pulses when in FOV (percent-based) */}
        <motion.div
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: beaconInFov ? "color-mix(in oklch, var(--chart-4) 88%, white)" : "color-mix(in oklch, var(--chart-5) 82%, white)",
            boxShadow: beaconInFov
              ? "0 0 12px color-mix(in oklch, var(--chart-4) 55%, transparent), 0 0 24px color-mix(in oklch, var(--chart-4) 28%, transparent)"
              : "0 0 10px color-mix(in oklch, var(--chart-5) 45%, transparent)",
          }}
          animate={{ scale: beaconInFov && !reduced ? [1, 1.18, 1] : 1, left: `${currentBeaconPct.leftPct}%`, top: `${currentBeaconPct.topPct}%` }}
          transition={{ duration: reduced ? 0 : 1.1, repeat: reduced || !beaconInFov ? 0 : Infinity, ease: "easeInOut" }}
        >
          <span className="absolute inset-[-6px] rounded-full border border-white/30" aria-hidden="true" />
        </motion.div>

        {/* HUD labels */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-black/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70 backdrop-blur">World · {AZ_RANGE}° × {EL_RANGE}° · SIMULATED</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] backdrop-blur",
              beaconInFov ? "bg-[color-mix(in oklch,var(--chart-4)_18%,black)] text-white/90" : "bg-[color-mix(in oklch,var(--chart-5)_20%,black)] text-white/90"
            )}
          >
            Beacon {beaconInFov ? "in FOV" : "outside FOV"}
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1 text-[10px] text-white/65 backdrop-blur">
          <Scan className="size-3" aria-hidden="true" /> FOV {SIM.fovAzimuthDeg}° × {SIM.fovElevationDeg}° · Beacon trail {trail.length} pts
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 hidden items-center gap-1.5 rounded-full bg-black/30 px-2 py-1 font-mono text-[9px] text-white/60 backdrop-blur sm:flex">
          <Target className="size-3" aria-hidden="true" /> Trail fades older → newer
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        Full airspace with beacon trail and camera FOV overlay. The rectangle shows exactly what the Camera View panel sees. Smooth, frame-by-frame slewing is driven by the same 30 Hz tick that powers the console. <span className="font-medium text-foreground/70">SIMULATED DATA — demonstration, not hardware.</span>
      </p>
    </ClayPanel>
  );
}
