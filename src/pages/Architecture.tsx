import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { EASE_OUT } from "@/components/common/Reveal";
import { PageHeader, SectionHeader } from "@/components/common/Section";
import { CredibilityTag, SimulatedTag, TechBadge } from "@/components/common/Tags";
import { usePageMeta } from "@/lib/seo";
import type { CredibilityLabel } from "@/lib/site";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Aperture,
  BrainCircuit,
  Calculator,
  CameraIcon,
  Cpu,
  Crosshair,
  Gauge,
  Layers,
  MonitorSmartphone,
  Radar,
  ScanSearch,
  Send,
  Sparkles,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Link } from "react-router";

interface ArchNode {
  id: string;
  label: string;
  short: string;
  group: "Optical" | "Compute" | "Control" | "Interface";
  label_: CredibilityLabel;
  role: string;
  inputs: string;
  outputs: string;
  note: string;
  icon: ComponentType<LucideProps>;
  optional?: boolean;
}

const NODES: ArchNode[] = [
  {
    id: "camera",
    label: "Camera",
    short: "Wide-field visible sensor",
    group: "Optical",
    label_: "ASSUMPTION",
    role: "Widest available sensor. Coarse alignment works with the largest uncertainty, so it starts here rather than with the narrow beam.",
    inputs: "Scene radiance",
    outputs: "Raw frame",
    note: "One camera is assumed. Multi-camera or event-sensor variants are a future option, not built here.",
    icon: CameraIcon,
  },
  {
    id: "acquisition",
    label: "Image acquisition",
    short: "Frame capture & timestamping",
    group: "Compute",
    label_: "ASSUMPTION",
    role: "Grabs frames at a fixed cadence and timestamps them so latency can be attributed later.",
    inputs: "Raw frame",
    outputs: "Timestamped frame",
    note: "In the prototype this is the 30 Hz simulation tick, not a device capture pipeline.",
    icon: Aperture,
  },
  {
    id: "preprocess",
    label: "Preprocessing",
    short: "Normalise, denoise, mask",
    group: "Compute",
    label_: "PROPOSED",
    role: "Normalises exposure and contrast, removes sensor noise and masks irrelevant regions before detection.",
    inputs: "Timestamped frame",
    outputs: "Clean frame",
    note: "Represented in the simulation; no image processing library is bundled in this build.",
    icon: ScanSearch,
  },
  {
    id: "cv",
    label: "AI / computer vision",
    short: "Detector + descriptor",
    group: "Compute",
    label_: "PROPOSED",
    role: "The learning component of the pipeline: detection, feature extraction and association.",
    inputs: "Clean frame",
    outputs: "Detections, descriptors",
    note: "Deliberately not implemented as a trained model in v1 — the prototype demonstrates the workflow around it.",
    icon: BrainCircuit,
  },
  {
    id: "detection",
    label: "Target detection",
    short: "Candidate localisation",
    group: "Compute",
    label_: "SIMULATED",
    role: "Localises the partner terminal or beacon and returns a bounding box with a score.",
    inputs: "Clean frame",
    outputs: "Bounding box + score",
    note: "Modelled directly from the virtual target bearing so the console can run without training data.",
    icon: Radar,
  },
  {
    id: "tracking",
    label: "Tracking",
    short: "Frame-to-frame association",
    group: "Compute",
    label_: "SIMULATED",
    role: "Keeps the estimate continuous between detections and smooths it through brief dropouts.",
    inputs: "Bounding box + score",
    outputs: "Smoothed target estimate",
    note: "Represented as a stable modelled confidence in this prototype.",
    icon: Crosshair,
  },
  {
    id: "estimate",
    label: "Position / offset estimation",
    short: "Bearing error",
    group: "Compute",
    label_: "SIMULATED",
    role: "Converts the target estimate into a pixel offset and an angular bearing error relative to boresight.",
    inputs: "Smoothed target estimate",
    outputs: "ΔX, ΔY, azimuth/elevation error",
    note: "The pixel-per-degree mapping is a prototype assumption chosen for legibility.",
    icon: Calculator,
  },
  {
    id: "controller",
    label: "Alignment controller",
    short: "Slew command generation",
    group: "Control",
    label_: "PROPOSED",
    role: "Turns the bearing error into a coarse slew command, respecting rate and range limits of the mount.",
    inputs: "Bearing error",
    outputs: "Recommended correction",
    note: "The console applies the correction to the virtual gimbal only.",
    icon: Cpu,
  },
  {
    id: "recommendation",
    label: "Coarse alignment recommendation",
    short: "Operator-facing correction",
    group: "Control",
    label_: "SIMULATED",
    role: "Presents the recommended slew and the tolerance status to the operator, so the correction can be reviewed before it is applied.",
    inputs: "Recommended correction",
    outputs: "Azimuth / elevation correction",
    note: "In manual and assisted modes this is an operator-visible recommendation, not an automatic command.",
    icon: Send,
  },
  {
    id: "terminal",
    label: "Optical terminal",
    short: "Physical pointing stage",
    group: "Optical",
    label_: "ASSUMPTION",
    role: "The physical coarse pointing stage — gimbal, mount and coarse tracking sensor.",
    inputs: "Coarse slew command",
    outputs: "Boresight motion",
    note: "Not modelled beyond geometry. Drishti-Optik never commands a real terminal.",
    icon: Gauge,
  },
  {
    id: "ui",
    label: "User interface",
    short: "Virtual camera tracking console",
    group: "Interface",
    label_: "VERIFIED",
    role: "The operator surface: viewport, telemetry, controls and the alignment trace.",
    inputs: "Simulation state",
    outputs: "Operator actions",
    note: "This is the page you are reading, and the /console route.",
    icon: MonitorSmartphone,
    optional: true,
  },
  {
    id: "monitoring",
    label: "Monitoring dashboard",
    short: "Session history & health",
    group: "Interface",
    label_: "VERIFIED",
    role: "Summarises status, detection, confidence, health and persisted session history.",
    inputs: "Persisted sessions",
    outputs: "Review surface",
    note: "Backed by Convex tables scoped to the signed-in account.",
    icon: Layers,
    optional: true,
  },
  {
    id: "assistant",
    label: "AI assistant",
    short: "Drishti AI guidance",
    group: "Interface",
    label_: "PROPOSED",
    role: "Explains the pipeline and the current simulation state to a reviewer on demand.",
    inputs: "Question + live context",
    outputs: "Explanation",
    note: "Server-side only. It answers from a curated knowledge base unless a model key is configured.",
    icon: Sparkles,
    optional: true,
  },
];

const MAIN_CHAIN = NODES.filter((node) => !node.optional);
const INTERFACE_CHAIN = NODES.filter((node) => node.optional);

export default function Architecture() {
  usePageMeta({
    title: "System Architecture | Drishti-Optik FSOC Coarse Alignment",
    description:
      "Interactive architecture diagram for the Drishti-Optik prototype: camera, acquisition, preprocessing, detection, tracking, offset estimation, alignment controller and recommendation.",
    path: "/architecture",
  });

  const [selectedId, setSelectedId] = useState<string>(MAIN_CHAIN[3].id);
  const selected = NODES.find((node) => node.id === selectedId) ?? MAIN_CHAIN[0];
  const reduced = useReducedMotion();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="System architecture"
        icon={Layers}
        title="How the coarse alignment chain fits together"
        description="Select any block to see what it does, what it consumes, what it produces and how confident we are in it. The chain is a proposal for a real system; the prototype implements the simulation-facing parts of it."
        badge={<SimulatedTag>Interactive diagram</SimulatedTag>}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <ClayPanel className="p-5 sm:p-6">
          <p className="hud-label">Primary processing chain</p>
          <ol className="mt-4 space-y-2">
            {MAIN_CHAIN.map((node, index) => (
              <li key={node.id}>
                <ArchNodeButton
                  node={node}
                  index={index + 1}
                  selected={node.id === selectedId}
                  onSelect={() => setSelectedId(node.id)}
                />
                {index < MAIN_CHAIN.length - 1 && <Connector />}
              </li>
            ))}
          </ol>

          <p className="hud-label mt-7">Optional interface layer</p>
          <ol className="mt-4 space-y-2">
            {INTERFACE_CHAIN.map((node, index) => (
              <li key={node.id}>
                <ArchNodeButton
                  node={node}
                  index={MAIN_CHAIN.length + index + 1}
                  selected={node.id === selectedId}
                  onSelect={() => setSelectedId(node.id)}
                />
              </li>
            ))}
          </ol>

          <p className="mt-5 text-[11px] leading-5 text-muted-foreground">
            The interface layer sits beside the chain rather than inside it: none of these
            components participate in the pointing path.
          </p>
        </ClayPanel>

        <ClayPanel className="p-5 sm:p-6 lg:sticky lg:top-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: EASE_OUT }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="clay-sm flex size-11 items-center justify-center rounded-2xl text-primary">
                    <selected.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="hud-label">{selected.group} layer</p>
                    <h2 className="text-lg font-semibold text-foreground">{selected.label}</h2>
                  </div>
                </div>
                <CredibilityTag label={selected.label_} />
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">{selected.role}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <ClayInset className="rounded-2xl p-3.5">
                  <p className="hud-label">Inputs</p>
                  <p className="mt-1.5 text-xs leading-5 text-foreground/85">{selected.inputs}</p>
                </ClayInset>
                <ClayInset className="rounded-2xl p-3.5">
                  <p className="hud-label">Outputs</p>
                  <p className="mt-1.5 text-xs leading-5 text-foreground/85">{selected.outputs}</p>
                </ClayInset>
              </div>

              <ClayInset className="mt-3 rounded-2xl p-4">
                <p className="hud-label">Implementation status</p>
                <p className="mt-1.5 text-xs leading-5 text-foreground/85">{selected.note}</p>
              </ClayInset>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <TechBadge tone="ok">Live in console</TechBadge>
            <Link
              to="/console"
              className="clay-sm clay-press rounded-full px-3.5 py-2 text-xs font-semibold text-foreground/85"
            >
              Open the tracking console
            </Link>
          </div>
        </ClayPanel>
      </div>

      <section aria-labelledby="arch-notes">
        <SectionHeader
          id="arch-notes"
          eyebrow="Design notes"
          title="Why the chain is split this way"
          description="Two constraints shaped this architecture: the coarse stage must tolerate the largest uncertainty, and the prototype must be demonstrable with no hardware attached."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Widest sensor first",
              body: "Coarse alignment starts with the widest field of view available, so a vision estimator can see a candidate before the narrow acquisition sensor can. Published PAT surveys describe this coarse-then-fine progression.",
            },
            {
              title: "Estimate, then command",
              body: "The controller is separated from the estimator so the correction can be reviewed by an operator in manual or assisted mode before any slew is applied.",
            },
            {
              title: "Deterministic core",
              body: "The simulation engine is a pure reducer. Given a seed, a session replays identically, which makes the demo reviewable and the behaviour testable.",
            },
            {
              title: "Honest labelling",
              body: "Every block carries a credibility label. Detection and tracking are SIMULATED in this build; the learning components are PROPOSED.",
            },
            {
              title: "No operational path",
              body: "There is no network path from this application to any optical terminal, spacecraft or ISRO system. The recommendation is text on a screen.",
            },
            {
              title: "Server-side secrets",
              body: "Any model key stays in the backend action. The browser never receives a credential, and the assistant degrades to a curated knowledge base when no key exists.",
            },
          ].map((note) => (
            <ClayPanel key={note.title} hoverable size="sm" className="p-5">
              <h3 className="text-sm font-semibold text-foreground">{note.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{note.body}</p>
            </ClayPanel>
          ))}
        </div>
      </section>
    </div>
  );
}

function ArchNodeButton({
  node,
  index,
  selected,
  onSelect,
}: {
  node: ArchNode;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = node.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-3xl px-4 py-3.5 text-left transition-all",
        selected
          ? "bg-primary text-primary-foreground"
          : "clay-sm clay-hover text-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-white/20" : "bg-[color-mix(in_oklch,var(--clay-surface)_60%,white)] text-primary",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "hud-label !text-[9px]",
                selected && "!text-primary-foreground/70",
              )}
            >
              {String(index).padStart(2, "0")}
            </span>
            <span className="truncate text-sm font-semibold">{node.label}</span>
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-[11px]",
              selected ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {node.short}
          </span>
        </span>
        <span
          className={cn(
            "hud-label shrink-0 !text-[8.5px]",
            selected ? "!text-primary-foreground/70" : "!text-muted-foreground",
          )}
        >
          {node.group}
        </span>
      </div>
    </button>
  );
}

function Connector() {
  return (
    <div className="ml-[2.3rem] flex h-4 items-center" aria-hidden="true">
      <motion.span
        className="h-full w-px bg-border"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: "top" }}
      />
    </div>
  );
}
