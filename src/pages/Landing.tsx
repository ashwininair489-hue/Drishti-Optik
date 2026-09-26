import { ClayPanel } from "@/components/common/Clay";
import { Reveal, StaggerItem, StaggerList } from "@/components/common/Reveal";
import { FeatureCard, SectionHeader, StatTile } from "@/components/common/Section";
import { SourcesList } from "@/components/common/SourcesList";
import { CredibilityTag, SimulatedTag, TechBadge } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { DISCLAIMERS, SITE } from "@/lib/site";
import { usePageMeta } from "@/lib/seo";
import { SIM } from "@/lib/tracking-engine";
import {
  ArrowRight,
  BrainCircuit,
  Camera,
  Crosshair,
  Gauge,
  Layers,
  Radar,
  Sigma,
  Target,
  Waves,
} from "lucide-react";
import { lazy, Suspense } from "react";
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

export default function Landing() {
  const { isAuthenticated } = useAuth();

  usePageMeta({
    title: "Drishti-Optik | AI-Based Virtual Camera Tracking for FSOC",
    description:
      "Drishti-Optik is a prototype virtual camera tracking console demonstrating computer-vision-assisted coarse alignment for mobile Free Space Optical Communication terminals. Simulation environment — not an official ISRO product.",
    path: "/",
  });

  return (
    <div className="space-y-16 sm:space-y-24">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <Reveal>
            <TechBadge tone="busy" pulse>
              {SITE.statusBadge}
            </TechBadge>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-5 text-balance text-4xl font-extrabold uppercase leading-[1.02] tracking-tight text-foreground sm:text-5xl xl:text-6xl">
              <span className="hud-value bg-[linear-gradient(120deg,color-mix(in_oklch,var(--chart-1)_82%,black),color-mix(in_oklch,var(--chart-2)_78%,black))] bg-clip-text text-transparent">
                Drishti-Optik
              </span>
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
              <Button asChild size="lg" className="clay-press rounded-full px-6">
                <Link to={isAuthenticated ? "/console" : "/auth?mode=signin&returnTo=%2Fconsole"}>
                  Launch tracking console
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="clay-press rounded-full px-6">
                <Link to="/technology">Explore technology</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mt-5 max-w-xl text-xs leading-5 text-muted-foreground">
              Built around the stated ISRO problem statement {SITE.problemStatementId}.{" "}
              {DISCLAIMERS.notIsro}
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <StatTile
                label="Pipeline stages"
                value="08"
                tag={<CredibilityTag label="PROPOSED" />}
                hint="Image input through alignment confirmation"
              />
              <StatTile
                label="Data source"
                value="Simulation"
                tag={<CredibilityTag label="SIMULATED" />}
                hint="No hardware telemetry is used"
              />
              <StatTile
                label="Physical control"
                value="None"
                hint="This prototype commands no terminal"
              />
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ClayPanel size="lg" className="p-3 sm:p-4">
            <div className="clay-screen relative h-[19rem] overflow-hidden sm:h-[24rem] lg:h-[26rem]">
              <Suspense
                fallback={
                  <div className="flex size-full flex-col items-center justify-center gap-3">
                    <div className="clay-sm size-12 animate-pulse rounded-2xl" />
                    <p className="hud-label !text-white/60">
                      Initialising 3D visualisation…
                    </p>
                    <p className="max-w-[16rem] text-center text-[11px] leading-4 text-white/45">
                      The page is fully usable before the 3D scene finishes loading.
                    </p>
                  </div>
                }
              >
                <HeroScene />
              </Suspense>

              <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                <span className="hud-label !text-[9.5px] !text-[color-mix(in_oklch,var(--hud-cyan)_85%,white)]">
                  Optical terminal · acquisition sweep
                </span>
                <span className="rounded-full border border-dashed border-[color-mix(in_oklch,var(--chart-5)_60%,transparent)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[color-mix(in_oklch,var(--chart-5)_88%,white)]">
                  Illustrative
                </span>
              </div>

              <div className="pointer-events-none absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2 sm:inset-x-4 sm:bottom-4">
                {[
                  { label: "Field of view", value: `${SIM.fovAzimuthDeg}° × ${SIM.fovElevationDeg}°` },
                  { label: "Tolerance", value: `${SIM.coarseToleranceDeg}°` },
                  { label: "Sensor", value: `${SIM.frameWidth}×${SIM.frameHeight}` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/5 px-2.5 py-2 backdrop-blur-sm"
                  >
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/50">
                      {item.label}
                    </p>
                    <p className="hud-value mt-0.5 text-xs font-semibold text-white/90">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-2 px-1 text-[11px] leading-5 text-muted-foreground">
              <SimulatedTag>Prototype assumptions</SimulatedTag>
              Field of view, tolerance and sensor size are design assumptions used by the
              simulation. They are not measured hardware specifications.
            </p>
          </ClayPanel>
        </Reveal>
      </section>

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
              <div className="clay-sm clay-hover flex items-center gap-2.5 rounded-full px-4 py-2.5">
                <span className="hud-label !text-[9.5px]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-foreground/90">{step}</span>
                {index < WORKFLOW.length - 1 && (
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section aria-labelledby="capabilities-heading">
        <SectionHeader
          eyebrow="What the prototype does"
          id="capabilities-heading"
          title="A working demonstration, not a rendered mock-up"
          description="Each capability below is implemented in the running application. Values are produced by the simulation engine, and the interface labels them as such."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability, index) => (
            <Reveal key={capability.title} delay={index * 0.05}>
              <FeatureCard icon={capability.icon} title={capability.title}>
                {capability.body}
              </FeatureCard>
            </Reveal>
          ))}
        </div>
      </section>

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
                <div key={label} className="clay-inset flex items-center gap-3 rounded-2xl px-4 py-3">
                  <CredibilityTag label={label} />
                  <span className="text-xs leading-5 text-muted-foreground">{meaning}</span>
                </div>
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

      <Reveal>
        <ClayPanel size="lg" className="overflow-hidden p-7 sm:p-10">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <Crosshair className="size-5 text-primary" aria-hidden="true" />
                <p className="hud-label">Ready to review</p>
              </div>
              <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Open the tracking console and run a simulated acquisition
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start tracking, enable target drift, engage auto align and watch the error
                trace settle inside the tolerance band. The run is saved to your alignment
                history so a reviewer can compare sessions.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="clay-press rounded-full">
                <Link to={isAuthenticated ? "/console" : "/auth?mode=signin&returnTo=%2Fconsole"}>
                  <Target className="size-4" aria-hidden="true" />
                  Launch tracking console
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
        </ClayPanel>
      </Reveal>
    </div>
  );
}
