import { ClayPanel } from "@/components/common/Clay";
import { EASE_OUT } from "@/components/common/Reveal";
import { TechBadge } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/seo";
import { DISCLAIMERS } from "@/lib/site";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Layers, LayoutDashboard } from "lucide-react";
import { Link } from "react-router";

export default function ThankYou() {
  usePageMeta({
    title: "Thank You | Drishti-Optik",
    description:
      "Thank you for your interest in Drishti-Optik. Return to the tracking console or explore the system architecture.",
    path: "/thank-you",
  });

  const reduced = useReducedMotion();

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center py-6 text-center sm:py-14">
      <motion.span
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.5, ease: EASE_OUT }}
        className="clay-sm flex size-20 items-center justify-center rounded-[1.75rem] text-[color-mix(in_oklch,var(--chart-4)_55%,black)]"
      >
        <CheckCircle2 className="size-9" aria-hidden="true" />
      </motion.span>

      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.5, delay: 0.08, ease: EASE_OUT }}
      >
        <div className="mt-6 flex justify-center">
          <TechBadge tone="ok">Message received</TechBadge>
        </div>
        <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Thank you for your interest in Drishti-Optik
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
          Your submission reached the prototype team. If you included a question about a specific
          session, mentioning the event log text again in any follow-up will help us answer faster.
        </p>
      </motion.div>

      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.5, delay: 0.16, ease: EASE_OUT }}
        className="mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row"
      >
        <Button asChild size="lg" className="clay-press rounded-full">
          <Link to="/dashboard">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Return to dashboard
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="clay-press rounded-full">
          <Link to="/architecture">
            <Layers className="size-4" aria-hidden="true" />
            Explore technical architecture
          </Link>
        </Button>
      </motion.div>

      <motion.p
        initial={reduced ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.3 }}
        className="mt-8 max-w-xl text-[11px] leading-5 text-muted-foreground"
      >
        {DISCLAIMERS.notIsro}
      </motion.p>

      <ClayPanel size="sm" className="mt-8 w-full p-5 text-left">
        <p className="hud-label">While you are here</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          The tracking console runs a complete simulated acquisition: start a session, enable
          target drift, then engage auto align and watch the bearing error settle inside the
          tolerance band. The alignment trace and event log record what happened so a reviewer can
          compare runs.
        </p>
      </ClayPanel>
    </div>
  );
}
