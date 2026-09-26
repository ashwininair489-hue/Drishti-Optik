import { ClayPanel } from "@/components/common/Clay";
import { EASE_OUT } from "@/components/common/Reveal";
import { TechBadge } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/seo";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, LayoutDashboard, Radar, RotateCcw } from "lucide-react";
import { Link } from "react-router";

/**
 * 404 page. The radar sweep is decorative and driven entirely by CSS/SVG so the
 * page stays cheap to render even on a bad connection.
 */
export default function NotFound() {
  usePageMeta({
    title: "Signal Lost (404) | Drishti-Optik",
    description:
      "The requested route could not be located. Return to the Drishti-Optik home page or open the virtual camera tracking console.",
    path: "/404",
    noindex: true,
  });

  const reduced = useReducedMotion();

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-6">
      <ClayPanel size="lg" className="w-full max-w-2xl p-7 text-center sm:p-10">
        <div className="flex justify-center">
          <TechBadge tone="warn" pulse>
            Navigation error 404
          </TechBadge>
        </div>

        <div className="relative mx-auto mt-7 size-40">
          <div className="clay-screen absolute inset-0 rounded-full" />
          <svg
            viewBox="0 0 160 160"
            className="absolute inset-0 size-full"
            aria-hidden="true"
          >
            <circle cx="80" cy="80" r="62" fill="none" stroke="color-mix(in oklch, var(--hud-cyan) 35%, transparent)" strokeWidth="1" />
            <circle cx="80" cy="80" r="42" fill="none" stroke="color-mix(in oklch, var(--hud-cyan) 28%, transparent)" strokeWidth="1" />
            <circle cx="80" cy="80" r="22" fill="none" stroke="color-mix(in oklch, var(--hud-cyan) 24%, transparent)" strokeWidth="1" />
            <line x1="18" y1="80" x2="142" y2="80" stroke="color-mix(in oklch, var(--hud-cyan) 24%, transparent)" strokeWidth="1" />
            <line x1="80" y1="18" x2="80" y2="142" stroke="color-mix(in oklch, var(--hud-cyan) 24%, transparent)" strokeWidth="1" />
            <motion.path
              d="M80 80 L80 18 A62 62 0 0 1 133 52 Z"
              fill="color-mix(in oklch, var(--hud-cyan) 22%, transparent)"
              style={{ transformOrigin: "80px 80px" }}
              animate={reduced ? undefined : { rotate: 360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            />
            <circle cx="80" cy="80" r="3.5" fill="color-mix(in oklch, var(--hud-cyan) 90%, white)" />
          </svg>
        </div>

        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.45, ease: EASE_OUT }}
          className="hud-value mt-7 text-3xl font-extrabold uppercase tracking-[0.18em] text-foreground sm:text-4xl"
        >
          Signal lost
        </motion.h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          The requested route could not be located. The console itself is still running — head back
          to a known waypoint.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button asChild size="lg" className="clay-press rounded-full">
            <Link to="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Return home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="clay-press rounded-full">
            <Link to="/dashboard">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Open dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link to="/console" className="inline-flex items-center gap-1.5 hover:text-primary">
            <Radar className="size-3.5" aria-hidden="true" />
            Tracking console
          </Link>
          <Link to="/technology" className="hover:text-primary">
            Technology
          </Link>
          <Link to="/documentation" className="hover:text-primary">
            Documentation
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 hover:text-primary"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Go back
          </button>
        </div>
      </ClayPanel>
    </div>
  );
}
