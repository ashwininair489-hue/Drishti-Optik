import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { PageHeader } from "@/components/common/Section";
import { TechBadge } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { usePageMeta } from "@/lib/seo";
import { DISCLAIMERS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { track } from "@/lib/analytics";

const TOPICS = [
  "Technical question",
  "Prototype feedback",
  "Collaboration / review",
  "Documentation correction",
  "Other",
] as const;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(80, "That name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address."),
  organisation: z.string().trim().max(120, "That organisation name is too long.").optional(),
  topic: z.enum(TOPICS),
  message: z
    .string()
    .trim()
    .min(20, "Please describe your question in at least 20 characters.")
    .max(4000, "Please keep the message under 4000 characters."),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function Contact() {
  usePageMeta({
    title: "Contact | Drishti-Optik Prototype Team",
    description:
      "Contact the Drishti-Optik prototype team, and find ISRO's official public contact information with a note that it is not the project office.",
    path: "/contact",
  });

  const navigate = useNavigate();
  const submitContact = useMutation(api.contact.submit);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: "Technical question" },
  });

  async function onSubmit(values: ContactValues) {
    setServerError(null);
    try {
      await submitContact({
        name: values.name,
        email: values.email,
        organisation: values.organisation || undefined,
        topic: values.topic,
        message: values.message,
      });
      track("contact_submitted", { topic: values.topic });
      reset();
      navigate("/thank-you");
    } catch (error) {
      setServerError(
        error instanceof Error && error.message
          ? error.message
          : "The message could not be sent — the contact service may be unavailable. Please try again shortly.",
      );
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Contact"
        icon={Mail}
        title="Talk to the prototype team"
        description="Questions about the simulation, a documentation correction, or a review request. Messages reach the Drishti-Optik development team only."
        badge={<TechBadge tone="busy">Prototype team</TechBadge>}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <ClayPanel className="p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-foreground">Send a message</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Please include the session you were running and any text from the event log — it makes
            technical questions much faster to answer.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Your name"
                id="name"
                error={errors.name?.message}
                input={
                  <input
                    id="name"
                    autoComplete="name"
                    {...register("name")}
                    aria-invalid={Boolean(errors.name)}
                    className={inputClass(Boolean(errors.name))}
                    placeholder="Ada Lovelace"
                  />
                }
              />
              <Field
                label="Email"
                id="email"
                error={errors.email?.message}
                input={
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    aria-invalid={Boolean(errors.email)}
                    className={inputClass(Boolean(errors.email))}
                    placeholder="name@example.com"
                  />
                }
              />
            </div>

            <Field
              label="Organisation (optional)"
              id="organisation"
              error={errors.organisation?.message}
              input={
                <input
                  id="organisation"
                  autoComplete="organization"
                  {...register("organisation")}
                  className={inputClass(Boolean(errors.organisation))}
                  placeholder="College, company or lab"
                />
              }
            />

            <div>
              <label className="hud-label" htmlFor="topic">
                Topic
              </label>
              <select
                id="topic"
                {...register("topic")}
                className={cn(
                  "mt-2 w-full rounded-2xl bg-transparent px-3.5 py-3 text-sm text-foreground outline-none",
                  "clay-inset",
                )}
              >
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="hud-label" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                {...register("message")}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : "message-hint"}
                className={cn(inputClass(Boolean(errors.message)), "resize-y rounded-2xl")}
                placeholder="Describe your question or feedback…"
              />
              <p id="message-hint" className="mt-2 text-[11px] text-muted-foreground">
                Minimum 20 characters. Please do not include confidential information.
              </p>
              {errors.message && <FieldError id="message-error">{errors.message.message}</FieldError>}
            </div>

            {serverError && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="flex items-start gap-2 rounded-2xl bg-[color-mix(in_oklch,var(--destructive)_14%,transparent)] px-3.5 py-3 text-xs leading-5 text-destructive"
              >
                <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {serverError}
              </motion.p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting} className="clay-press h-11 rounded-2xl px-6">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="size-4" aria-hidden="true" />
                    Send message
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Validated on the client and again on the server. Rate limited per address.
              </p>
            </div>
          </form>
        </ClayPanel>

        <div className="space-y-5">
          <ClayPanel className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="size-4 text-primary" aria-hidden="true" />
              Project contact
            </h2>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">{SITE.contactNote}</p>
            <ClayInset className="mt-4 rounded-2xl p-4">
              <p className="hud-label">What we can help with</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                <li>Reproducing a simulation session</li>
                <li>Corrections to the technical copy</li>
                <li>Review or demonstration requests</li>
              </ul>
            </ClayInset>
          </ClayPanel>

          <ClayPanel className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                ISRO public contact information
              </h2>
              <TechBadge tone="ok">Official source</TechBadge>
            </div>

            <p className="mt-3 rounded-2xl bg-[color-mix(in_oklch,var(--chart-5)_14%,transparent)] px-3.5 py-3 text-[11px] leading-5 text-[color-mix(in_oklch,var(--chart-5)_45%,black)]">
              Official ISRO public contact information — not the project office. Drishti-Optik is
              not affiliated with ISRO, and this address should not be used for questions about
              this prototype.
            </p>

            <address className="mt-4 not-italic">
              <p className="text-xs font-semibold text-foreground">Indian Space Research Organisation</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                ISRO Headquarters, Antariksh Bhavan
                <br />
                New BEL Road, Bengaluru 560 094, India
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                +91 80 22172294 / 96
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                isropr [at] isro [dot] gov [dot] in
              </p>
            </address>
            <a
              href="https://www.isro.gov.in/contact.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Verify on isro.gov.in
            </a>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Details reproduced from ISRO's official contact page; check that page for the
              current information.
            </p>
          </ClayPanel>

          <ClayPanel size="sm" className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              Before you write
            </h2>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">{DISCLAIMERS.notIsro}</p>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              For anything about ISRO's own programmes, use ISRO's official channels rather than
              this form. See the{" "}
              <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
                privacy policy
              </Link>{" "}
              for how submissions are stored.
            </p>
          </ClayPanel>
        </div>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "mt-2 w-full rounded-2xl px-3.5 py-3 text-sm text-foreground outline-none clay-inset placeholder:text-muted-foreground",
    hasError && "ring-1 ring-destructive/60",
  );
}

function Field({
  label,
  id,
  input,
  error,
}: {
  label: string;
  id: string;
  input: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="hud-label" htmlFor={id}>
        {label}
      </label>
      {input}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
