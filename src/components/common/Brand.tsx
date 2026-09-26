import { cn } from "@/lib/utils";
import { Link } from "react-router";

/** Original mark for this prototype — not an ISRO or government emblem. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-[1.05rem]",
        "bg-[linear-gradient(140deg,color-mix(in_oklch,var(--chart-1)_78%,white),color-mix(in_oklch,var(--chart-2)_70%,white))]",
        "clay-sm text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.2v3.4M12 17.4v3.4M3.2 12h3.4M17.4 12h3.4" />
      </svg>
    </span>
  );
}

export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-3 rounded-2xl", className)}
      aria-label="Drishti-Optik home"
    >
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="hud-value text-[15px] font-bold uppercase tracking-[0.13em] text-foreground">
          Drishti-Optik
        </span>
        {!compact && (
          <span className="hud-label mt-1 !text-[9.5px] !tracking-[0.16em]">
            Virtual camera tracking
          </span>
        )}
      </span>
    </Link>
  );
}
