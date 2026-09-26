import { ClayPanel } from "@/components/common/Clay";
import { EASE_OUT } from "@/components/common/Reveal";
import { TechBadge } from "@/components/common/Tags";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Anchor/id for the heading, so sections can be referenced and labelled. */
  id?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && <p className="hud-label mb-3">{eyebrow}</p>}
      <h2
        id={id}
        className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
  actions?: ReactNode;
  icon?: ComponentType<LucideProps>;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.header
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE_OUT }}
      className="relative"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            {Icon && (
              <span className="clay-sm flex size-11 items-center justify-center rounded-2xl text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            )}
            <p className="hud-label">{eyebrow}</p>
            {badge}
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </motion.header>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tag,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tag?: ReactNode;
  className?: string;
}) {
  return (
    <ClayPanel size="sm" className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="hud-label">{label}</p>
        {tag}
      </div>
      <p className="hud-value mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </ClayPanel>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
  footer,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <ClayPanel hoverable className="flex h-full flex-col gap-3 p-5">
      <span className="clay-sm flex size-11 items-center justify-center rounded-2xl text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="flex-1 text-sm leading-6 text-muted-foreground">{children}</p>
      {footer && <div className="pt-1">{footer}</div>}
    </ClayPanel>
  );
}

export function InfoNotice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn";
  title: string;
  children: ReactNode;
}) {
  return (
    <ClayPanel
      size="sm"
      className={cn(
        "flex gap-3 p-4",
        tone === "warn" &&
          "border border-dashed border-[color-mix(in_oklch,var(--chart-5)_50%,transparent)]",
      )}
    >
      <TechBadge tone={tone === "warn" ? "warn" : "busy"}>
        {tone === "warn" ? "Heads up" : "Note"}
      </TechBadge>
      <div className="text-sm leading-6 text-muted-foreground">
        <p className="font-semibold text-foreground">{title}</p>
        {children}
      </div>
    </ClayPanel>
  );
}
