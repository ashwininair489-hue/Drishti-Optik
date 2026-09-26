import { cn } from "@/lib/utils";
import { Link } from "react-router";

/** Drishti-Optik mark — eye + optical crosshair. Original, not an ISRO emblem. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[1.05rem] clay-sm",
        "bg-[linear-gradient(140deg,#7c86ff,#6fb8e8_55%,#5ec4d4)]",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" className="size-[2.05rem]" role="img" aria-label="Drishti-Optik mark">
        <defs>
          <radialGradient id="bm-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a2744" />
            <stop offset="58%" stopColor="#1e3a5e" />
            <stop offset="100%" stopColor="#0f1d33" />
          </radialGradient>
        </defs>
        <circle cx="48" cy="48" r="26.5" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="1.5" />
        <circle cx="48" cy="48" r="21" fill="none" stroke="rgba(255,255,255,0.52)" strokeWidth="0.85" strokeDasharray="3 3" />
        <circle cx="48" cy="48" r="15.2" fill="url(#bm-iris)" stroke="rgba(255,255,255,0.82)" strokeWidth="1" />
        <circle cx="48" cy="48" r="9.6" fill="none" stroke="#7fd4ee" strokeWidth="1.05" opacity="0.92" />
        <circle cx="48" cy="48" r="4.7" fill="#0b1628" stroke="rgba(255,255,255,0.32)" strokeWidth="0.7" />
        <ellipse cx="45.4" cy="44.6" rx="2" ry="1.45" fill="rgba(255,255,255,0.68)" />
        <g stroke="#f6f8ff" strokeLinecap="round" opacity="0.96">
          <path d="M48 21.5V30M48 66V74.5M21.5 48H30M66 48H74.5" strokeWidth="1.9" fill="none" />
          <circle cx="48" cy="48" r="1.15" fill="#f6f8ff" stroke="none" />
        </g>
      </svg>
    </span>
  );
}

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3 rounded-2xl", className)} aria-label="Drishti-Optik home">
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="hud-value text-[15px] font-bold uppercase tracking-[0.13em] text-foreground">Drishti-Optik</span>
        {!compact && <span className="hud-label mt-1 !text-[9.5px] !tracking-[0.16em]">Virtual camera tracking</span>}
      </span>
    </Link>
  );
}
