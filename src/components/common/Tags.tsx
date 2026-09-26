import { CREDIBILITY_COPY, type CredibilityLabel } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TONE_CLASS: Record<string, string> = {
  idle: "bg-muted text-muted-foreground",
  busy: "bg-[color-mix(in_oklch,var(--chart-1)_26%,transparent)] text-[color-mix(in_oklch,var(--chart-1)_70%,black)]",
  ok: "bg-[color-mix(in_oklch,var(--chart-4)_30%,transparent)] text-[color-mix(in_oklch,var(--chart-4)_60%,black)]",
  warn: "bg-[color-mix(in_oklch,var(--chart-5)_28%,transparent)] text-[color-mix(in_oklch,var(--chart-5)_58%,black)]",
  error: "bg-[color-mix(in_oklch,var(--destructive)_22%,transparent)] text-[color-mix(in_oklch,var(--destructive)_70%,black)]",
};

export function StatusDot({
  tone = "idle",
  pulse = false,
  className,
}: {
  tone?: keyof typeof TONE_CLASS;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative flex size-2.5 shrink-0", className)} aria-hidden="true">
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-60",
            TONE_CLASS[tone],
          )}
        />
      )}
      <span className={cn("relative inline-flex size-2.5 rounded-full", TONE_CLASS[tone])} />
    </span>
  );
}

export function TechBadge({
  children,
  tone = "idle",
  className,
  pulse,
  title,
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_CLASS;
  className?: string;
  pulse?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "clay-sm inline-flex items-center gap-2 rounded-full px-3 py-1",
        "hud-label !text-[10.5px] !text-foreground/80",
        className,
      )}
    >
      <StatusDot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}

/** Anti-hallucination tag rendered next to any claim that needs a label. */
export function CredibilityTag({
  label,
  className,
  title,
}: {
  label: CredibilityLabel;
  className?: string;
  title?: string;
}) {
  const copy = CREDIBILITY_COPY[label];
  const tone =
    copy.tone === "ok"
      ? "ok"
      : copy.tone === "sim"
        ? "busy"
        : copy.tone === "assume"
          ? "warn"
          : "idle";
  return (
    <TechBadge tone={tone} className={className} title={title ?? copy.meaning}>
      {label}
    </TechBadge>
  );
}

/** Explicit marker for any value produced by the simulation. */
export function SimulatedTag({ className, children = "SIMULATED" }: { className?: string; children?: ReactNode }) {
  return (
    <span
      className={cn(
        "hud-label inline-flex items-center gap-1.5 rounded-full border border-dashed border-[color-mix(in_oklch,var(--chart-5)_55%,transparent)] px-2 py-0.5 !text-[9.5px] text-[color-mix(in_oklch,var(--chart-5)_52%,black)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Key/value readout used across the console and dashboard. */
export function Readout({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof TONE_CLASS;
  className?: string;
}) {
  return (
    <div className={cn("clay-inset rounded-2xl px-3.5 py-3", className)}>
      <p className="hud-label">{label}</p>
      <p
        className={cn(
          "hud-value mt-1.5 text-lg font-semibold text-foreground",
          tone && tone === "ok" && "text-[color-mix(in_oklch,var(--chart-4)_62%,black)]",
          tone && tone === "warn" && "text-[color-mix(in_oklch,var(--chart-5)_55%,black)]",
          tone && tone === "error" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
