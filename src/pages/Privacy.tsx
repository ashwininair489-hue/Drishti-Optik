import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { PageHeader } from "@/components/common/Section";
import { ConsentStatus } from "@/components/analytics/ConsentStatus";
import { Button } from "@/components/ui/button";
import { TechBadge } from "@/components/common/Tags";
import { usePageMeta } from "@/lib/seo";
import { ANALYTICS_SUPPORTED, clearConsent } from "@/lib/analytics";
import { Cookie, Lock } from "lucide-react";
import { Link } from "react-router";

const SECTIONS = [
  {
    id: "collected",
    title: "Information we collect",
    body: [
      "Account information: the display name you optionally provide and the email address used to receive your one-time sign-in code. We do not ask for, or store, a password.",
      "Simulation data: when a coarse alignment run completes, the outcome is stored — duration, peak and final simulated error, tracking mode, and the modelled range. These values describe the simulation, not any hardware.",
      "Contact submissions: the name, email address, optional organisation, selected topic and message you enter on the contact form.",
      "Assistant transcripts: if you are signed in and use Drishti AI, your question and the assistant's answer are stored against your account so the panel can pick up where you left off. Signed-out visitors are not stored.",
      "We do not collect precise location, biometric data, government identifiers, payment details or advertising identifiers.",
    ],
  },
  {
    id: "authentication",
    title: "Authentication data",
    body: [
      "Sign-in uses a short-lived one-time code delivered by email. The code is valid for 15 minutes. No password is created, transmitted or stored.",
      "Sessions are managed by the authentication provider and stored in secure, HTTP-only cookies. Signing out revokes the session on the server as well as in your browser.",
      "Anonymous demo sessions are not linked to an email address and cannot be recovered once the browser session ends.",
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    body: [
      "Analytics is optional, privacy-conscious and off by default. It records coarse product events only: a page view, a sign-in, a demo launch, a tracking session start, an auto-align engagement, opening the assistant, viewing documentation, and a contact submission.",
      "Events are stored with the route they occurred on and, if you are signed in, your account identifier. We do not record form contents, query strings, keystrokes, precise location or any cross-site identifier.",
      "If analytics is disabled at build time, or you decline it, no analytics events are collected at all and the application behaves identically.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: [
      "Essential storage keeps you signed in and remembers your cookie choice. It cannot be disabled, because the application cannot function securely without it.",
      "Optional storage is limited to analytics. It is not loaded before you consent.",
      "You can change your choice at any time using the button below. Reopening the banner lets you accept analytics, reject it, or manage preferences per category.",
    ],
  },
  {
    id: "storage",
    title: "Data storage and retention",
    body: [
      "Data is stored in the application's backend database and is scoped per account. Simulation history is retained until you clear it from profile & settings.",
      "Clearing your history permanently deletes your simulation sessions and their associated pipeline events. Contact submissions are retained so a reply can be tracked.",
      "There is no automated deletion schedule in this prototype; if you want data removed, contact the team and describe the account.",
    ],
  },
  {
    id: "security",
    title: "Security",
    body: [
      "Transport is encrypted in transit. Authentication uses one-time codes so no credential material is stored on the client.",
      "Public write endpoints — contact, analytics and the assistant — are validated server-side and rate limited.",
      "Any third-party model key is held server-side in the backend action. It is never sent to, or readable by, the browser.",
      "No system is perfectly secure, and this is a prototype. Do not submit confidential or sensitive material through the contact form.",
    ],
  },
  {
    id: "rights",
    title: "Your choices",
    body: [
      "You can use the console without creating an account by selecting the demo option, and you can clear your simulation history at any time.",
      "You can decline optional analytics without losing any functionality, and you can reopen the consent banner to change that choice.",
      "To request access to, correction of, or deletion of your account data, contact the team with the email address you signed in with.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-party services",
    body: [
      "Email delivery for one-time sign-in codes is handled by a transactional email provider.",
      "If a language model is configured, Drishti AI sends your question and a short summary of the current simulation state to a model provider through the backend. No account identifiers or contact details are included.",
      "Web fonts are loaded from a public font service. The 3D scenes, charts and simulation engine all run locally in your browser.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [
      "Questions about this policy should go through the contact form, choosing “Technical question” or “Other” as the topic.",
      "This prototype does not claim compliance with any specific privacy regulation. The statements above describe what the software actually does.",
    ],
  },
];

export default function Privacy() {
  usePageMeta({
    title: "Privacy Policy | Drishti-Optik",
    description:
      "What the Drishti-Optik prototype collects, how authentication and analytics work, cookie choices, storage, security and your options.",
    path: "/privacy",
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Privacy policy"
        icon={Lock}
        title="What this prototype collects — and why"
        description="Written to describe the software's actual behaviour rather than to satisfy a template. If something here is unclear, ask and it will be corrected."
        badge={<TechBadge tone="busy">Last updated September 2026</TechBadge>}
      />

      <ClayInset className="flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Your current choice</p>
            <ConsentStatus />
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {ANALYTICS_SUPPORTED
                ? "Optional analytics only loads after you accept it."
                : "Optional analytics is disabled in this deployment."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="clay-press rounded-full"
          onClick={clearConsent}
        >
          Manage cookie preferences
        </Button>
      </ClayInset>

      <div className="space-y-4">
        {SECTIONS.map((section, index) => (
          <ClayPanel key={section.id} id={section.id} className="scroll-mt-28 p-5 sm:p-7">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
              <span className="hud-label !text-[10px]">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </ClayPanel>
        ))}
      </div>

      <ClayPanel size="sm" className="p-5 text-xs leading-6 text-muted-foreground">
        See also the{" "}
        <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
          terms &amp; conditions
        </Link>{" "}
        for the prototype and simulation disclaimers, and the{" "}
        <Link to="/documentation" className="text-primary underline-offset-4 hover:underline">
          documentation
        </Link>{" "}
        for the data model.
      </ClayPanel>
    </div>
  );
}
