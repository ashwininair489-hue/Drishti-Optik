import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { Reveal } from "@/components/common/Reveal";
import { PageHeader, SectionHeader } from "@/components/common/Section";
import { SourcesList } from "@/components/common/SourcesList";
import { CredibilityTag, SimulatedTag, TechBadge } from "@/components/common/Tags";
import { usePageMeta } from "@/lib/seo";
import { SIM } from "@/lib/tracking-engine";
import type { CredibilityLabel } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ArrowRight, Cpu, GitBranch, Radar, Scale, TriangleAlert, Wrench } from "lucide-react";
import { Link } from "react-router";

interface TechSection {
  id: string;
  title: string;
  label: CredibilityLabel;
  body: string[];
  aside?: string;
}

const SECTIONS: TechSection[] = [
  {
    id: "problem",
    title: "Problem",
    label: "VERIFIED",
    body: [
      "A free-space optical link carries data on a narrow optical beam. Because the beam is narrow, the terminal must be pointed accurately at the partner terminal before any link budget can be closed; published surveys describe this as a pointing, acquisition and tracking (PAT) problem.",
      "A mobile platform makes it harder: the bearing to the partner changes continuously, so pointing is a control problem rather than a one-off setup step. Coarse alignment is the stage that must tolerate the largest uncertainty, because nothing downstream can work until the target is at least inside the acquisition sensor's field of view.",
    ],
    aside:
      "This is background from the public literature, not a claim about any specific ISRO programme.",
  },
  {
    id: "solution",
    title: "Solution concept",
    label: "PROPOSED",
    body: [
      "Drishti-Optik proposes a virtual camera tracking stage: a wide-field camera, a computer-vision estimator that localises the partner terminal, and a controller that converts the estimated bearing error into a coarse correction.",
      "The prototype implements the workflow and the interface, not the trained perception model. Detection, tracking and confidence are modelled from the virtual geometry so the coarse alignment sequence can be demonstrated and reviewed end to end.",
    ],
  },
  {
    id: "workflow",
    title: "Coarse alignment workflow",
    label: "PROPOSED",
    body: [
      "Camera input → scene and terminal detection → target identification → visual tracking → relative position estimation → coarse alignment recommendation → alignment confirmation → ready for fine acquisition.",
      "The console exposes each step with a live status, so a reviewer can see where the estimate currently stands instead of only reading the final number.",
    ],
  },
  {
    id: "computer-vision",
    title: "Computer vision",
    label: "PROPOSED",
    body: [
      "A production implementation would use a detector for candidate localisation, a descriptor or keypoint stage for association, and a filter to smooth the estimate and predict through short dropouts.",
      "None of that is trained in this build. The prototype treats the perception stage as a black box whose output — a bounding box, a score and a bearing error — is synthesised from the virtual target pose.",
    ],
  },
  {
    id: "detection",
    title: "Target detection",
    label: "SIMULATED",
    body: [
      "The detector's job is to answer: is the partner terminal in this frame, and where? In the simulation the answer is derived from the modelled target bearing, and the reported confidence falls as the target moves away from boresight.",
      `The virtual sensor is ${SIM.frameWidth}×${SIM.frameHeight} with a ${SIM.pxPerDeg} px/degree mapping. Both are prototype assumptions chosen to make the geometry legible, not measured sensor characteristics.`,
    ],
  },
  {
    id: "tracking",
    title: "Tracking",
    label: "SIMULATED",
    body: [
      "Tracking keeps the estimate continuous frame to frame. In the prototype this appears as a smoothed confidence value and a steadily decreasing bearing error once lock is declared — the observable behaviour of a tracker, without the tracker.",
    ],
  },
  {
    id: "coarse-alignment",
    title: "Coarse alignment",
    label: "SIMULATED",
    body: [
      "Because the error is defined as target minus boresight, the recommended correction is numerically the same slew on both axes: applying it moves the boresight onto the target estimate until the error falls inside the tolerance band.",
      `The prototype treats ${SIM.coarseToleranceDeg}° as “inside tolerance” and slews at a maximum of ${SIM.slewDegPerTick}° per tick. These are demonstration constants, not hardware figures.`,
    ],
    aside:
      "Real systems quote tolerances far below a degree because the beam itself is narrow. Do not read the prototype constant as a specification.",
  },
  {
    id: "benefits",
    title: "Expected benefits",
    label: "PROPOSED",
    body: [
      "A vision-based coarse stage could shorten acquisition time on a moving platform by giving the fine pointing stage a better starting bearing, and could reduce the reliance on a dedicated wide-field acquisition sensor.",
      "A simulator-first workflow also means the control logic and operator interface can be reviewed before any hardware is involved.",
    ],
  },
  {
    id: "limitations",
    title: "Limitations",
    label: "ASSUMPTION",
    body: [
      "No perception model is trained or validated. Detection quality, robustness to glare and background clutter, and performance under vibration are all unaddressed in v1.",
      "There is no hardware in the loop, no latency model, and no calibration against a real mount. The numbers on screen describe the simulation, nothing more.",
    ],
  },
  {
    id: "future-scope",
    title: "Future scope",
    label: "PROPOSED",
    body: [
      "Train and evaluate a detector on representative imagery, replace the modelled geometry with the real camera pipeline, add a latency and jitter model, and close the loop on a hardware-in-the-loop testbed.",
      "Beyond that: beam-divergence-aware tolerance analysis, multi-camera fusion, and a comparison against a dedicated acquisition sensor.",
    ],
  },
];

export default function Technology() {
  usePageMeta({
    title: "FSOC Virtual Camera Tracking Technology | Drishti-Optik",
    description:
      "Technical overview of the Drishti-Optik prototype: the FSOC pointing problem, the proposed vision pipeline, simulated detection and tracking, coarse alignment tolerance and future scope.",
    path: "/technology",
  });

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Technical overview"
        icon={Cpu}
        title="The technology behind the console"
        description="A plain-language walk through the problem, the proposed pipeline and the limits of what this prototype actually demonstrates. Each section carries a credibility label."
        badge={<SimulatedTag>Prototype scope</SimulatedTag>}
      />

      <nav aria-label="On this page" className="clay-inset rounded-3xl p-4">
        <p className="hud-label mb-3">On this page</p>
        <ul className="flex flex-wrap gap-2">
          {[...SECTIONS.map((s) => ({ id: s.id, title: s.title })), { id: "references", title: "References" }].map(
            (item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="clay-sm rounded-full px-3.5 py-2 text-xs font-medium text-foreground/85 hover:text-primary"
                >
                  {item.title}
                </a>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="space-y-5">
        {SECTIONS.map((section, index) => (
          <Reveal key={section.id} delay={index * 0.03}>
            <ClayPanel
              id={section.id}
              className="scroll-mt-28 p-5 sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight text-foreground">
                  <span className="hud-label !text-[10px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                <CredibilityTag label={section.label} />
              </div>

              <div className="mt-4 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.aside && (
                <ClayInset className="mt-4 flex gap-3 rounded-2xl p-4">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--chart-5)_52%,black)]" aria-hidden="true" />
                  <p className="text-xs leading-6 text-muted-foreground">{section.aside}</p>
                </ClayInset>
              )}
            </ClayPanel>
          </Reveal>
        ))}
      </div>

      <section aria-labelledby="parameters" className="scroll-mt-28" id="simulation-parameters">
        <SectionHeader
          id="parameters"
          eyebrow="Prototype parameter set"
          title="Every constant the simulation uses"
          description="Collected in one place so it is obvious which numbers are design choices rather than measurements."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Virtual sensor", value: `${SIM.frameWidth} × ${SIM.frameHeight} px`, label_: "ASSUMPTION" as CredibilityLabel },
            { label: "Field of view", value: `${SIM.fovAzimuthDeg}° × ${SIM.fovElevationDeg}°`, label_: "ASSUMPTION" as CredibilityLabel },
            { label: "Pixel mapping", value: `${SIM.pxPerDeg} px / degree`, label_: "ASSUMPTION" as CredibilityLabel },
            { label: "Coarse tolerance", value: `${SIM.coarseToleranceDeg}°`, label_: "ASSUMPTION" as CredibilityLabel },
            { label: "Max slew rate", value: `${SIM.slewDegPerTick}° / tick`, label_: "SIMULATED" as CredibilityLabel },
            { label: "Simulation cadence", value: `${SIM.fps} Hz`, label_: "SIMULATED" as CredibilityLabel },
            { label: "Modelled range", value: `${SIM.distanceKm} km`, label_: "SIMULATED" as CredibilityLabel },
            { label: "Drift amplitude", value: `${SIM.driftAmplitudeDeg}°`, label_: "SIMULATED" as CredibilityLabel },
            { label: "Confidence at boresight", value: `${(SIM.confidenceBase * 100).toFixed(1)}%`, label_: "SIMULATED" as CredibilityLabel },
          ].map((item) => (
            <ClayInset key={item.label} className="rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="hud-label">{item.label}</p>
                <span
                  className={cn(
                    "font-mono text-[8.5px] uppercase tracking-[0.12em]",
                    item.label_ === "SIMULATED" ? "text-[color-mix(in_oklch,var(--chart-5)_50%,black)]" : "text-muted-foreground",
                  )}
                >
                  {item.label_}
                </span>
              </div>
              <p className="hud-value mt-2 text-lg font-semibold text-foreground">{item.value}</p>
            </ClayInset>
          ))}
        </div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          Demonstration values — not measured hardware results.
        </p>
      </section>

      <section aria-labelledby="references" id="references" className="scroll-mt-28">
        <SectionHeader
          id="references"
          eyebrow="Sources & references"
          title="Where the technical statements come from"
          description="Public, citable material used for the background claims on this page. Anything not listed here is a prototype assumption."
        />
        <SourcesList className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" />
      </section>

      <ClayPanel className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary">
            <Scale className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              Read the limitations before quoting a number
              <TechBadge tone="warn">Important</TechBadge>
            </p>
            <p className="mt-1.5 max-w-2xl text-xs leading-6 text-muted-foreground">
              Everything the console reports is simulation output. The prototype does not control
              hardware, and no figure here should be presented as an ISRO result.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/architecture"
            className="clay-sm clay-press inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-foreground/85"
          >
            <GitBranch className="size-4" aria-hidden="true" />
            Architecture
          </Link>
          <Link
            to="/console"
            className="clay-sm clay-press inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            <Radar className="size-4" aria-hidden="true" />
            Open console
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </ClayPanel>

      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Wrench className="size-3.5" aria-hidden="true" />
        Found an error in the technical copy? Report it from the contact page so it can be
        corrected with a source.
      </p>
    </div>
  );
}
