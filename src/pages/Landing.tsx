import { ClayPanel } from "@/components/common/Clay";
import { Reveal, StaggerItem, StaggerList } from "@/components/common/Reveal";
import { SectionHeader } from "@/components/common/Section";
import { SourcesList } from "@/components/common/SourcesList";
import { CredibilityTag, SimulatedTag, TechBadge } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { DISCLAIMERS, SITE } from "@/lib/site";
import { usePageMeta } from "@/lib/seo";
import { SIM } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Camera,
  Crosshair,
  Gauge,
  Layers,
  Orbit,
  Radar,
  Rocket,
  Satellite,
  Sigma,
  Sparkles,
  Target,
  Waves,
  Zap,
} from "lucide-react";
import { lazy, Suspense, useRef } from "react";
import { Link } from "react-router";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));

const WORKFLOW = [
  "Camera input",
  "Scene detection",
  "Target identification",
  "Visual tracking",
  "Relative position",
  "Coarse alignment",
  "Confirmation",
  "Fine acquisition handover",
] as const;

const CAPABILITIES = [
  {
    icon: Camera,
    title: "Virtual sensor feed",
    body: "A synthetic camera frame with bounding box, estimated target centre, crosshair and alignment vector drawn from the same telemetry the numbers come from.",
  },
  {
    icon: Radar,
    title: "Target detection stage",
    body: "The detection stage is modelled rather than trained: the box follows the virtual target bearing so the workflow can be demonstrated end to end.",
  },
  {
    icon: Sigma,
    title: "Relative offset estimation",
    body: "Pixel offset and angular bearing error are computed from the virtual geometry, then inverted into a recommended coarse correction.",
  },
  {
    icon: Gauge,
    title: "Tracking confidence",
    body: "A modelled quality signal that falls as the target moves away from boresight, so reviewers can see when an estimate should be trusted.",
  },
  {
    icon: Waves,
    title: "Moving platform mode",
    body: "Enable simulated target drift to represent a mobile terminal whose bearing changes faster than a static mount.",
  },
  {
    icon: BrainCircuit,
    title: "Drishti AI guide",
    body: "An in-app assistant that explains every readout. It answers from a curated knowledge base and, when a model key is configured, a server-side model call.",
  },
];

/* ── interactive tilt card ─────────────────────────────────────────── */
function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 16 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 120, damping: 16 });

  function onMove(e: React.MouseEvent) {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={reduced ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

/* ── animated counter ──────────────────────────────────────────────── */
function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      initial={reduced ? undefined : { opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0 : 0.5 }}
      className="hud-value text-2xl font-extrabold text-foreground sm:text-3xl"
    >
      {value}
      {suffix && <span className="text-primary">{suffix}</span>}
    </motion.span>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const reduced = useReducedMotion();
  const heroMx = useMotionValue(0);
  const heroMy = useMotionValue(0);
  const spotX = useSpring(heroMx, { stiffness: 80, damping: 20 });
  const spotY = useSpring(heroMy, { stiffness: 80, damping: 20 });
  // Hoisted out of the JSX below: calling useTransform inside a conditional
  // branch changed the hook order between renders and crashed the page.
  const spotlight = useTransform(
    [spotX, spotY],
    ([x, y]) =>
      `radial-gradient(520px circle at ${x}% ${y}%, color-mix(in oklch, var(--chart-1) 10%, transparent), transparent 72%)`,
  );

  usePageMeta({
    title: "Drishti-Optik | AI-Based Virtual Camera Tracking for FSOC",
    description:
      "Drishti-Optik is a prototype virtual camera tracking console demonstrating computer-vision-assisted coarse alignment for mobile Free Space Optical Communication terminals. Simulation environment — not an official ISRO product.",
    path: "/",
  });

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ── HERO — interactive spotlight + parallax 3D ───────────── */}
      <section
        onMouseMove={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          heroMx.set(((e.clientX - r.left) / r.width) * 100);
          heroMy.set(((e.clientY - r.top) / r.height) * 100);
        }}
        className="relative -mx-4 -mt-6 overflow-hidden rounded-[2rem] border border-border/50 bg-[radial-gradient(90%_70%_at_20%_12%,color-mix(in_oklch,var(--chart-1)_14%,transparent),transparent_60%),radial-gradient(70%_60%_at_88%_88%,color-mix(in_oklch,var(--chart-2)_12%,transparent),transparent_55%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_94%,white))] px-4 py-10 sm:mx-0 sm:px-8 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:px-10"
      >
        {/* spotlight that follows cursor */}
        {!reduced && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: spotlight as unknown as string }}
          />
        )}
        <div className="hud-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true" />

        <div className="relative">
          <Reveal>
            <TechBadge tone="busy" pulse>
              {SITE.statusBadge}
            </TechBadge>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-5 text-balance text-4xl font-extrabold uppercase leading-[1.02] tracking-tight text-foreground sm:text-5xl xl:text-6xl">
              <motion.span
                initial={reduced ? undefined : { backgroundPosition: "100% 50%" }}
                animate={reduced ? undefined : { backgroundPosition: "0% 50%" }}
                transition={reduced ? undefined : { duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="hud-value bg-[linear-gradient(120deg,color-mix(in_oklch,var(--chart-1)_82%,black),color-mix(in_oklch,var(--chart-2)_78%,black),color-mix(in_oklch,var(--chart-1)_82%,black))] bg-clip-text text-transparent"
                style={reduced ? undefined : { backgroundSize: "200% 100%" }}
              >
                Drishti-Optik
              </motion.span>
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-lg font-semibold leading-7 text-foreground/90 sm:text-xl">
              AI-based virtual camera tracking for mobile FSOC terminal coarse alignment.
            </p>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
              {SITE.shortDescription}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="clay-press group rounded-full px-6">
                <Link to="/login?returnTo=%2Fconsole">
                  <motion.span
                    className="inline-flex"
                    animate={reduced ? undefined : { x: [0, 4, 0] }}
                    transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </motion.span>
                  Get access — sign in
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="clay-press rounded-full px-6">
                <Link to="/technology">Explore technology</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mt-5 max-w-xl text-xs leading-5 text-muted-foreground">
              An independent prototype exploring AI-based virtual camera tracking for mobile FSOC
              terminal coarse alignment. {DISCLAIMERS.notIsro}
            </p>
          </Reveal>

          {/* lively stats — each card reacts on hover */}
          <Reveal delay={0.24}>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <motion.div whileHover={reduced ? undefined : { y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 320, damping: 18 }} className="clay-sm flex flex-col gap-1 rounded-2xl px-4 py-4">
                <CountUp value="08" />
                <span className="hud-label">Pipeline stages</span>
                <CredibilityTag label="PROPOSED" className="mt-1" />
              </motion.div>
              <motion.div whileHover={reduced ? undefined : { y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 320, damping: 18 }} className="clay-sm flex flex-col gap-1 rounded-2xl px-4 py-4">
                <span className="flex items-center gap-1.5">
                  <span className="hud-value text-2xl font-extrabold text-foreground sm:text-3xl">SIM</span>
                  <Rocket className="size-4 text-primary" aria-hidden="true" />
                </span>
                <span className="hud-label">Data source</span>
                <CredibilityTag label="SIMULATED" className="mt-1" />
              </motion.div>
              <motion.div whileHover={reduced ? undefined : { y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 320, damping: 18 }} className="clay-sm flex flex-col gap-1 rounded-2xl px-4 py-4">
                <span className="hud-value text-2xl font-extrabold text-foreground sm:text-3xl">—</span>
                <span className="hud-label">Physical control</span>
                <span className="mt-1 text-xs text-muted-foreground">Commands no terminal</span>
              </motion.div>
            </div>
          </Reveal>

          {/* quick pill links — staggered entrance + hover lift */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Orbit, label: "2 terminals", to: "/console" },
              { icon: Zap, label: "Live telemetry", to: "/console" },
              { icon: Satellite, label: "3D beam", to: "/console" },
            ].map((p, i) => {
              const I = p.icon;
              return (
                <motion.div
                  key={p.label}
                  initial={reduced ? undefined : { opacity: 0, y: 6 }}
                  animate={reduced ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                  whileHover={reduced ? undefined : { scale: 1.05 }}
                  whileTap={reduced ? undefined : { scale: 0.96 }}
                  className="inline-flex"
                >
                  <Link
                    to={p.to}
                    className="clay-sm clay-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/80 hover:text-foreground"
                  >
                    <I className="size-3.5 text-primary" aria-hidden="true" />
                    {p.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <TiltCard className="mt-8 lg:mt-0">
          <ClayPanel size="lg" className="relative p-3 sm:p-4">
            {/* shimmer border */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius)+1.1rem)] opacity-40"
              style={{
                background:
                  "linear-gradient(120deg, transparent 30%, color-mix(in oklch, var(--chart-1) 22%, transparent) 50%, transparent 70%)",
              }}
            />
            <div className="clay-screen relative h-[19rem] overflow-hidden sm:h-[24rem] lg:h-[26rem]">
              <Suspense
                fallback={
                  <div className="flex size-full flex-col items-center justify-center gap-3">
                    <div className="clay-sm size-12 animate-pulse rounded-2xl" />
                    <p className="hud-label !text-white/60">Initialising 3D visualisation…</p>
                  </div>
                }
              >
                <HeroScene />
              </Suspense>

              <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                <span className="hud-label flex items-center gap-1.5 !text-[9.5px] !text-[color-mix(in_oklch,var(--hud-cyan)_85%,white)]">
                  <Sparkles className="size-3" aria-hidden="true" /> Two FSOC terminals · live 3D
                </span>
                <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--chart-5)_60%,transparent)] bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[color-mix(in_oklch,var(--chart-5)_88%,white)] backdrop-blur">
                  Illustrative
                </span>
              </div>

              <div className="pointer-events-none absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2 sm:inset-x-4 sm:bottom-4">
                {[
                  { label: "Field of view", value: `${SIM.fovAzimuthDeg}° × ${SIM.fovElevationDeg}°` },
                  { label: "Tolerance", value: `${SIM.coarseToleranceDeg}°` },
                  { label: "Sensor", value: `${SIM.frameWidth}×${SIM.frameHeight}` },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={reduced ? undefined : { opacity: 0, y: 6 }}
                    whileHover={reduced ? undefined : { scale: 1.04, y: -2 }}
                    transition={{ type: "spring", stiffness: 360, damping: 18 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    className="rounded-2xl bg-white/5 px-2.5 py-2 backdrop-blur-sm"
                    style={reduced ? undefined : { transitionDelay: `${0.05 + i * 0.05}s` }}
                  >
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/50">{item.label}</p>
                    <p className="hud-value mt-0.5 text-xs font-semibold text-white/90">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-2 px-1 text-[11px] leading-5 text-muted-foreground">
              <SimulatedTag>Prototype assumptions</SimulatedTag>
              Drag to orbit · scroll to zoom · values are simulated.
            </p>
          </ClayPanel>
        </TiltCard>
      </section>

      {/* ── ENTRY GATE — login at the start (lively, cannot be missed) ─ */}
      {!isAuthenticated && (
        <Reveal>
          <div className="clay-lg relative overflow-hidden p-6 sm:p-8">
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--chart-1)_18%,transparent),transparent_70%)] blur-2xl"
              animate={reduced ? undefined : { scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="hud-label flex items-center gap-1.5">
                  <span className="size-2 animate-pulse rounded-full bg-[color-mix(in_oklch,var(--chart-4)_70%,black)]" aria-hidden="true" />
                  Start here — sign in to unlock the console
                </p>
                <h2 className="mt-2 text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Your simulation starts with a sign-in
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  One-time email code or instant demo — no password, no hardware, no ISRO link. Every number after this is <span className="font-semibold text-foreground/80">SIMULATED DATA</span>.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button asChild size="lg" className="clay-press rounded-full px-6">
                  <Link to="/login?returnTo=%2Fconsole">Sign in — launch console</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="clay-press rounded-full px-6">
                  <Link to="/login?mode=signup&returnTo=%2Fconsole">Create account</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── WORKFLOW — interactive, hover-lift pills ─────────────────── */}
      <section aria-labelledby="workflow-heading">
        <SectionHeader
          eyebrow="Coarse alignment workflow"
          id="workflow-heading"
          title="From camera frame to a confirmed coarse alignment"
          description="The console walks this sequence live, stage by stage, and reports where each step stands. Pointing, acquisition and tracking terminology follows the published FSO literature listed in the references."
        />
        <StaggerList className="mt-7 flex flex-wrap gap-2.5">
          {WORKFLOW.map((step, index) => (
            <StaggerItem key={step}>
              <motion.div
                whileHover={reduced ? undefined : { y: -3, scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="clay-sm clay-hover flex cursor-default items-center gap-2.5 rounded-full px-4 py-2.5"
              >
                <span className="hud-label !text-[9.5px]">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium text-foreground/90">{step}</span>
                {index < WORKFLOW.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />}
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      {/* ── CAPABILITIES — tilt + sheen on each card ─────────────────── */}
      <section aria-labelledby="capabilities-heading">
        <SectionHeader
          eyebrow="What the prototype does"
          id="capabilities-heading"
          title="A working demonstration, not a rendered mock-up"
          description="Each capability below is implemented in the running application. Values are produced by the simulation engine, and the interface labels them as such."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap, i) => (
            <Reveal key={cap.title} delay={i * 0.05}>
              <TiltCard>
                <div className="clay group relative overflow-hidden p-5 transition-shadow hover:shadow-[12px_16px_30px_-12px_color-mix(in_oklch,var(--clay-shade)_55%,transparent)]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(520px circle at 30% 0%, color-mix(in oklch, var(--chart-1) 10%, transparent), transparent 65%)",
                    }}
                  />
                  <div className="relative">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <cap.icon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-foreground">{cap.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{cap.body}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CREDIBILITY ──────────────────────────────────────────────── */}
      <section aria-labelledby="credibility-heading">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Credibility model"
              id="credibility-heading"
              title="Every claim is labelled"
              description="This project separates what is sourced, what is simulated, what is assumed and what is merely proposed. Nothing is presented as a measurement when it is not."
            />
            <div className="mt-6 grid gap-3">
              {(
                [
                  ["VERIFIED", "Backed by a public source listed in the references."],
                  ["SIMULATED", "Produced by the demonstration environment."],
                  ["ASSUMPTION", "A prototype design choice, not a measurement."],
                  ["PROPOSED", "A future implementation idea. Not built yet."],
                ] as const
              ).map(([label, meaning]) => (
                <motion.div
                  key={label}
                  whileHover={reduced ? undefined : { x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="clay-inset flex items-center gap-3 rounded-2xl px-4 py-3"
                >
                  <CredibilityTag label={label} />
                  <span className="text-xs leading-5 text-muted-foreground">{meaning}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <p className="hud-label mb-3">Sources &amp; references</p>
            <SourcesList className="grid gap-3 sm:grid-cols-2" />
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Full reference list, including the prototype parameter set, is on the{" "}
              <Link to="/technology#references" className="text-primary underline-offset-4 hover:underline">
                technology page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA — gradient + floating orbs ──────────────────────────── */}
      <Reveal>
        <div className="clay-lg relative overflow-hidden p-7 sm:p-10">
          {/* animated gradient orbs */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--chart-1)_22%,transparent),transparent_70%)] blur-2xl"
            animate={reduced ? undefined : { scale: [1, 1.09, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--chart-2)_18%,transparent),transparent_70%)] blur-2xl"
            animate={reduced ? undefined : { scale: [1, 1.07, 1], opacity: [0.45, 0.6, 0.45] }}
            transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Crosshair className="size-4" aria-hidden="true" />
                </span>
                <p className="hud-label">Ready to review</p>
              </div>
              <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Open the console and run a live acquisition
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start tracking, nudge the target, enable drift, engage auto align and watch the
                error trace settle inside the tolerance band. Every run is saved to your history.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="clay-press rounded-full">
                <Link to="/login?returnTo=%2Fconsole">
                  <Target className="size-4" aria-hidden="true" />
                  Sign in to open the console
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="clay-press rounded-full">
                <Link to="/architecture">
                  <Layers className="size-4" aria-hidden="true" />
                  Explore architecture
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
