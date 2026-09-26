import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { PageHeader, SectionHeader } from "@/components/common/Section";
import { SimulatedTag, TechBadge } from "@/components/common/Tags";
import { usePageMeta } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { useEffect } from "react";
import { BookOpen, KeyRound, ListOrdered, Server, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link } from "react-router";

const QUICK_START = [
  {
    title: "Create an account",
    body: "Open the sign-in page and choose Create account. Enter your name and email, then enter the one-time code we send you. If you only want to look around, use Continue as demo user instead — that session is anonymous and is not recoverable.",
  },
  {
    title: "Open the tracking console",
    body: "The console runs the whole sequence on one screen: virtual sensor feed, controls, alignment vector, pipeline monitor, event log and history.",
  },
  {
    title: "Start a session",
    body: "Press Start tracking. Watch the pipeline monitor move from image input through to alignment confirmation, and the camera viewport acquire the virtual target.",
  },
  {
    title: "Exercise the loop",
    body: "Enable Simulate movement to make the target drift, then press Auto align. The bearing error should fall and settle inside the tolerance band, after which the run is saved to your alignment history.",
  },
  {
    title: "Ask Drishti AI",
    body: "Open the assistant from the bottom-right corner and ask what the current state means. It answers from a curated knowledge base, or a server-side model when a key is configured.",
  },
];

const DATA_MODEL = [
  { table: "users", purpose: "Account record from the authentication provider.", fields: "name, email, role" },
  { table: "simulationSessions", purpose: "One row per completed coarse alignment run.", fields: "duration, peak/final error, mode, outcome, range" },
  { table: "trackingEvents", purpose: "Discrete pipeline events tied to a session.", fields: "type, message, createdAt" },
  { table: "contactMessages", purpose: "Contact form submissions.", fields: "name, email, topic, message, status" },
  { table: "aiConversations / aiMessages", purpose: "Optional assistant transcript for signed-in users.", fields: "role, content, source" },
  { table: "analyticsEvents", purpose: "Consent-gated product events only.", fields: "event, path, createdAt" },
  { table: "rateLimits", purpose: "Fixed-window limiter for public endpoints.", fields: "bucket, windowStart, count" },
];

const API_REFERENCE = [
  { name: "api.simulation.recordSession", kind: "mutation", detail: "Persists a completed run for the signed-in user. Returns saved:false when signed out." },
  { name: "api.simulation.recentSessions", kind: "query", detail: "Most recent runs for the signed-in user, newest first." },
  { name: "api.simulation.sessionStats", kind: "query", detail: "Aggregate counts and mean/best final error across recent runs." },
  { name: "api.contact.submit", kind: "mutation", detail: "Validates and stores a contact message; rate limited per email address." },
  { name: "api.analytics.logEvent", kind: "mutation", detail: "Stores an allow-listed product event. Rejects unknown event names." },
  { name: "api.ai.ask", kind: "action", detail: "Server-side assistant call with curated fallback. Never exposes a key to the browser." },
  { name: "api.aiData.appendExchange", kind: "mutation", detail: "Appends a transcript turn for signed-in users only." },
  { name: "api.profile.updateDisplayName", kind: "mutation", detail: "Updates the display name for the signed-in user." },
  { name: "api.profile.clearHistory", kind: "mutation", detail: "Deletes the signed-in user's simulation sessions and their events." },
];

export default function Documentation() {
  usePageMeta({
    title: "Documentation | Drishti-Optik Tracking Console",
    description:
      "Quick start, console walkthrough, simulation parameters, data model, API reference, accessibility and error-handling notes for the Drishti-Optik prototype.",
    path: "/documentation",
  });

  useEffect(() => {
    track("documentation_viewed");
  }, []);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Documentation"
        icon={BookOpen}
        title="Everything a reviewer needs to run the prototype"
        description="How to sign in, what each control does, which values are simulated, and how the backend is wired. Written so someone else can reproduce a session without asking questions."
        badge={<SimulatedTag>Version 1</SimulatedTag>}
      />

      <section aria-labelledby="quick-start">
        <SectionHeader
          id="quick-start"
          eyebrow="Quick start"
          title="Five steps to a completed alignment run"
        />
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_START.map((step, index) => (
            <li key={step.title}>
              <ClayPanel className="h-full p-5">
                <span className="hud-value clay-sm inline-flex size-9 items-center justify-center rounded-2xl text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{step.body}</p>
              </ClayPanel>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="console-walkthrough">
        <SectionHeader
          id="console-walkthrough"
          eyebrow="Console walkthrough"
          title="What each panel is telling you"
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <ClayPanel className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListOrdered className="size-4 text-primary" aria-hidden="true" />
              Control deck
            </h3>
            <dl className="mt-4 space-y-3">
              {[
                ["Start / Pause tracking", "Runs or holds the deterministic tick loop."],
                ["Auto align", "Switches to auto mode and closes the loop on the modelled bearing error."],
                ["Re-centre", "Snaps the boresight onto the current target estimate."],
                ["Simulate movement", "Enables a drifting target to represent a mobile platform."],
                ["Tracking mode", "Manual reports only; assisted and auto apply part or all of the correction."],
                ["Reset", "Returns the whole simulation to its initial state."],
              ].map(([term, description]) => (
                <div key={term} className="clay-inset rounded-2xl px-4 py-3">
                  <dt className="text-xs font-semibold text-foreground">{term}</dt>
                  <dd className="mt-1 text-xs leading-5 text-muted-foreground">{description}</dd>
                </div>
              ))}
            </dl>
          </ClayPanel>

          <ClayPanel className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <KeyRound className="size-4 text-primary" aria-hidden="true" />
              Reading the numbers
            </h3>
            <dl className="mt-4 space-y-3">
              {[
                ["ΔX / ΔY", "Pixel offset of the estimated target centre from the frame centre."],
                ["Bearing error", "Angular separation between boresight and target estimate, per axis."],
                [
                  "Recommended correction",
                  "The slew to apply — numerically the bearing error itself, on both axes.",
                ],
                ["Confidence", "Modelled quality signal for the estimate, not a measurement."],
                ["Progress", "How far the error has closed against the prototype tolerance."],
              ].map(([term, description]) => (
                <div key={term} className="clay-inset rounded-2xl px-4 py-3">
                  <dt className="text-xs font-semibold text-foreground">{term}</dt>
                  <dd className="mt-1 text-xs leading-5 text-muted-foreground">{description}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
              Full parameter list:{" "}
              <Link to="/technology#simulation-parameters" className="text-primary underline-offset-4 hover:underline">
                prototype parameter set
              </Link>
              .
            </p>
          </ClayPanel>
        </div>
      </section>

      <section aria-labelledby="data-model">
        <SectionHeader
          id="data-model"
          eyebrow="Reference"
          title="Data model and backend surface"
          description="The backend is Convex functions and a typed schema. No secrets are stored in the browser, and the schema is defined in src/convex/schema.ts."
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <ClayPanel className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Server className="size-4 text-primary" aria-hidden="true" />
              Tables
            </h3>
            <ul className="mt-4 space-y-2">
              {DATA_MODEL.map((table) => (
                <li key={table.table} className="clay-inset rounded-2xl px-4 py-3">
                  <p className="hud-value text-xs font-semibold text-foreground">{table.table}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{table.purpose}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/90">{table.fields}</p>
                </li>
              ))}
            </ul>
          </ClayPanel>

          <ClayPanel className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Server className="size-4 text-primary" aria-hidden="true" />
              Functions
            </h3>
            <ul className="mt-4 space-y-2">
              {API_REFERENCE.map((fn) => (
                <li key={fn.name} className="clay-inset rounded-2xl px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="hud-value text-xs font-semibold text-foreground">{fn.name}</span>
                    <TechBadge tone={fn.kind === "query" ? "busy" : "idle"}>{fn.kind}</TechBadge>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{fn.detail}</p>
                </li>
              ))}
            </ul>
          </ClayPanel>
        </div>
      </section>

      <section aria-labelledby="faq">
        <SectionHeader id="faq" eyebrow="FAQ" title="Questions reviewers usually ask" />
        <Accordion type="single" collapsible className="mt-6 space-y-3">
          {[
            {
              q: "Is this an ISRO product?",
              a: "No. Drishti-Optik is an independent prototype software concept built around the stated ISRO problem statement on the Smart India Hackathon problem list. It is not developed, endorsed, certified or deployed by ISRO.",
            },
            {
              q: "Can it control a real optical terminal?",
              a: "No. There is no network path from this application to any terminal or spacecraft. The recommendation is text and graphics on a screen.",
            },
            {
              q: "Are the numbers real measurements?",
              a: "No. Pixel offsets, bearing error, confidence and the reported cadence are all produced by the simulation engine. Where they appear, they are tagged SIMULATED or DEMO.",
            },
            {
              q: "Why does sign-in use a one-time code instead of a password?",
              a: "It keeps the prototype free of stored credentials while still giving each reviewer a private session and a scoped alignment history.",
            },
            {
              q: "What happens if the AI service is unavailable?",
              a: "Drishti AI falls back to a curated knowledge base and tells you it has done so. The rest of the console is unaffected because it runs entirely in the browser.",
            },
            {
              q: "What happens if the backend is unreachable?",
              a: "The simulation keeps running locally. Session saving and history show an explicit unavailable state rather than failing silently.",
            },
            {
              q: "Does the site work without cookies?",
              a: "Yes. Essential storage keeps you signed in. Optional analytics only loads after you accept it, and rejecting it changes nothing about the console.",
            },
          ].map((item) => (
            <AccordionItem
              key={item.q}
              value={item.q}
              className="clay overflow-hidden rounded-3xl border-0 px-2"
            >
              <AccordionTrigger className="px-4 py-4 text-sm font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section aria-labelledby="quality">
        <SectionHeader
          id="quality"
          eyebrow="Quality notes"
          title="Accessibility, error handling and performance"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Accessibility",
              body: "Semantic landmarks, keyboard-reachable controls, visible focus rings, ARIA labelling on icon-only buttons, descriptive alt text on the 3D scenes and full reduced-motion support.",
            },
            {
              icon: TriangleAlert,
              title: "Error handling",
              body: "Validation errors, authentication failures, network failures and timeouts each have a distinct message. Stack traces are never shown, and a persistence failure never interrupts a run.",
            },
            {
              icon: Server,
              title: "Performance",
              body: "Routes are code-split, the 3D scenes are dynamically imported behind a Suspense fallback, and the landing page is fully readable before the 3D canvas initialises.",
            },
          ].map((item) => (
            <ClayPanel key={item.title} className="p-5">
              <span className="clay-sm flex size-10 items-center justify-center rounded-2xl text-primary">
                <item.icon className="size-4" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.body}</p>
            </ClayPanel>
          ))}
        </div>
      </section>

      <ClayInset className="rounded-3xl p-5">
        <p className="hud-label">Need something not covered here?</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Send a question through the{" "}
          <Link to="/contact" className="text-primary underline-offset-4 hover:underline">
            contact page
          </Link>{" "}
          and describe the session you were running. Including the event log text makes it much
          faster to answer.
        </p>
      </ClayInset>
    </div>
  );
}
