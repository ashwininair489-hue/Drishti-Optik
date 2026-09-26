import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { Reveal } from "@/components/common/Reveal";
import { PageHeader, SectionHeader } from "@/components/common/Section";
import { CredibilityTag, TechBadge } from "@/components/common/Tags";
import { usePageMeta } from "@/lib/seo";
import { REFERENCES, SITE } from "@/lib/site";
import { CheckCircle2, CircleSlash, Info, Landmark, Users } from "lucide-react";
import { Link } from "react-router";

export default function About() {
  usePageMeta({
    title: "About the Project | Drishti-Optik",
    description:
      "What Drishti-Optik is, what it is not, and how it relates to the stated ISRO problem statement. Includes the official ISRO source used for organisational context.",
    path: "/about",
  });

  const isroRef = REFERENCES.find((ref) => ref.id === "ref-isro-hq")!;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="About the project"
        icon={Users}
        title="An independent prototype built around a stated problem"
        description="Drishti-Optik explores how a virtual camera tracking stage could assist coarse alignment of mobile free-space optical communication terminals. It exists to demonstrate a workflow, not to claim a capability."
        badge={<TechBadge tone="busy">Independent prototype</TechBadge>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <ClayPanel className="p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Info className="size-4 text-primary" aria-hidden="true" />
            What this is
          </h2>
          <ul className="mt-4 space-y-3">
            {[
              "A working simulation console that runs the coarse alignment sequence end to end.",
              "A demonstration of how detection, tracking, offset estimation and a recommended correction fit together.",
              "A credibility-first presentation: every technical statement is labelled sourced, simulated, assumed or proposed.",
              "A deployable full-stack web application with accounts, persistence and documentation.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-[color-mix(in_oklch,var(--chart-4)_55%,black)]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </ClayPanel>

        <ClayPanel className="p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CircleSlash className="size-4 text-primary" aria-hidden="true" />
            What this is not
          </h2>
          <ul className="mt-4 space-y-3">
            {[
              "Not an ISRO product, and not endorsed, certified, reviewed or deployed by ISRO.",
              "Not connected to any optical terminal, ground station, satellite or spacecraft.",
              "Not a validated perception system — no detector or tracker is trained in this build.",
              "Not a source of performance figures. Every number in the console is simulation output.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                <CircleSlash className="mt-1 size-4 shrink-0 text-destructive/80" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </ClayPanel>
      </div>

      <section aria-labelledby="problem-statement">
        <SectionHeader
          id="problem-statement"
          eyebrow="Problem statement"
          title="Where the brief came from"
          description="The project is built around the problem statement text supplied for this work."
        />
        <ClayPanel className="mt-6 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <TechBadge tone="busy">Reference {SITE.problemStatementId}</TechBadge>
            <TechBadge tone="idle">Category: Software</TechBadge>
          </div>
          <blockquote className="mt-4 border-l-4 border-primary/40 pl-4 text-sm italic leading-7 text-foreground/85">
            “Development of an AI-Based Virtual Camera Tracking System for Coarse Alignment of
            Mobile Free Space Optical Communication (FSOC) Terminals.”
          </blockquote>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            The organisation named against the brief is the Indian Space Research Organisation. The
            brief itself sits in a public hackathon problem-statement catalogue; that catalogue
            entry is the origin of this prototype, and nothing beyond it is claimed.
          </p>
          <ClayInset className="mt-5 rounded-2xl p-4">
            <p className="hud-label">Scope for version 1</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Version 1 focuses on the simulated tracking demo screen, aimed at hackathon and
              problem-statement reviewers. Everything else in the application exists to support
              that screen: accounts so a session can be saved, a dashboard summary, documentation,
              and the credibility and legal surfaces.
            </p>
          </ClayInset>
        </ClayPanel>
      </section>

      <section aria-labelledby="isro">
        <SectionHeader
          id="isro"
          eyebrow="ISRO information"
          title="Using ISRO information correctly"
          description="Where ISRO is mentioned, it is either public information reproduced from an official page, or a statement that this project is not affiliated with ISRO."
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <ClayPanel className="p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Landmark className="size-4 text-primary" aria-hidden="true" />
              Official ISRO source used
            </h3>
            <div className="mt-4">
              <CredibilityTag label={isroRef.label} />
              <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{isroRef.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{isroRef.publisher}</p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">{isroRef.note}</p>
              <a
                href={isroRef.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                isro.gov.in
              </a>
            </div>
            <ClayInset className="mt-5 rounded-2xl p-4">
              <p className="hud-label">Technical background sources</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Statements about pointing, acquisition and tracking come from peer-reviewed surveys
                and public terminal standards, listed in full on the{" "}
                <Link to="/technology#references" className="text-primary underline-offset-4 hover:underline">
                  technology page
                </Link>
                .
              </p>
            </ClayInset>
          </ClayPanel>

          <ClayPanel className="p-6">
            <h3 className="text-sm font-semibold text-foreground">How this page is worded</h3>
            <div className="mt-4 space-y-3">
              {[
                ["Do not read as", "\"Developed by ISRO\" or \"ISRO uses Drishti-Optik\"."],
                ["Read as", "\"A student / independent prototype software concept developed around a stated problem statement.\""],
                ["ISRO technologies", "Described only where an official ISRO source supports it, and linked."],
              ].map(([label, value]) => (
                <ClayInset key={label} className="rounded-2xl p-4">
                  <p className="hud-label">{label}</p>
                  <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{value}</p>
                </ClayInset>
              ))}
            </div>
          </ClayPanel>
        </div>
      </section>

      <Reveal>
        <ClayPanel size="lg" className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Team &amp; contributions</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Drishti-Optik is a prototype project. Named team members and institutional affiliations
            are not published on this site: individual contact details are not invented, and no
            affiliation should be assumed from this page. If you need to reach the team, use the
            contact form, which reaches the development team directly.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/contact"
              className="clay-sm clay-press rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
            >
              Contact the team
            </Link>
            <Link
              to="/documentation"
              className="clay-sm clay-press rounded-full px-4 py-2.5 text-xs font-semibold text-foreground/85"
            >
              Read the documentation
            </Link>
          </div>
        </ClayPanel>
      </Reveal>
    </div>
  );
}
