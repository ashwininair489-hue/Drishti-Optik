import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Raising the clay surface vocabulary into components keeps the soft-shadow
 * look consistent instead of repeating long class strings across pages.
 */
export function ClayPanel({
  className,
  size = "md",
  hoverable = false,
  ...props
}: ComponentProps<"div"> & { size?: "sm" | "md" | "lg"; hoverable?: boolean }) {
  return (
    <div
      className={cn(
        size === "sm" ? "clay-sm" : size === "lg" ? "clay-lg" : "clay",
        hoverable && "clay-hover",
        className,
      )}
      {...props}
    />
  );
}

/** Debossed well: use for grouped controls, inputs and nested content. */
export function ClayInset({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("clay-inset", className)} {...props} />;
}

/** Recessed dark instrument screen for camera / HUD surfaces. */
export function ClayScreen({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("clay-screen", className)} {...props} />;
}

export function ClayPill({
  className,
  size = "md",
  ...props
}: ComponentProps<"div"> & { size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full",
        size === "sm" ? "clay-sm px-2.5 py-1" : "clay px-3.5 py-1.5",
        className,
      )}
      {...props}
    />
  );
}
