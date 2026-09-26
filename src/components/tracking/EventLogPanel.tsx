import { ClayPanel } from "@/components/common/Clay";
import { SIM, type LogEntry, type LogLevel } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, ScrollText } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

const LEVEL_STYLE: Record<
  LogLevel,
  { icon: ComponentType<LucideProps>; className: string; label: string }
> = {
  info: {
    icon: Info,
    className: "text-[color-mix(in_oklch,var(--chart-2)_55%,black)]",
    label: "INFO",
  },
  success: {
    icon: CheckCircle2,
    className: "text-[color-mix(in_oklch,var(--chart-4)_52%,black)]",
    label: "OK",
  },
  warn: {
    icon: AlertTriangle,
    className: "text-[color-mix(in_oklch,var(--chart-5)_52%,black)]",
    label: "WARN",
  },
  error: { icon: AlertTriangle, className: "text-destructive", label: "ERR" },
};

export function EventLogPanel({ events }: { events: LogEntry[] }) {
  return (
    <ClayPanel className="flex flex-col p-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="hud-label">Event log</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">Pipeline events</h2>
        </div>
        <ScrollText className="size-4 text-muted-foreground" aria-hidden="true" />
      </header>

      <ul className="mt-4 max-h-[19rem] space-y-2 overflow-y-auto pr-1" aria-live="polite">
        <AnimatePresence initial={false}>
          {events.map((entry) => {
            const style = LEVEL_STYLE[entry.level];
            const Icon = style.icon;
            return (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="clay-inset flex gap-3 rounded-2xl px-3.5 py-3"
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", style.className)} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="hud-label !text-[9.5px]">{style.label}</span>
                    <span className="hud-value text-[10px] text-muted-foreground">
                      t+{(entry.tick / SIM.fps).toFixed(1)}s
                    </span>
                  </p>
                  <p className="mt-1 text-xs leading-5 text-foreground/85">{entry.message}</p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {events.length === 0 && (
        <p className="clay-inset mt-4 rounded-2xl px-4 py-6 text-center text-xs text-muted-foreground">
          No events yet. Start a tracking session to populate the log.
        </p>
      )}
    </ClayPanel>
  );
}
