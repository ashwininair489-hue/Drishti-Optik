import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { Brand } from "@/components/common/Brand";
import { EASE_OUT } from "@/components/common/Reveal";
import { TechBadge } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { track } from "@/lib/analytics";
import { DISCLAIMERS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  UserRound,
  UserX,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";

const TerminalScene = lazy(() => import("@/components/three/TerminalScene"));

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(160, "That email address is too long.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address.");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name (at least 2 characters).")
  .max(80, "That name is too long.");

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirect(returnTo: string | null, fallback: string) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

type Step = "credentials" | "code" | "success";
type Mode = "signin" | "signup";

function Auth({ redirectAfterAuth = "/console" }: AuthProps) {
  const { isLoading: authLoading, isAuthenticated, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reduced = useReducedMotion();
  const updateDisplayName = useMutation(api.profile.updateDisplayName);

  const redirect = resolveRedirect(searchParams.get("returnTo"), redirectAfterAuth);
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; name?: string; code?: string }>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<"sending" | "verifying" | "demo" | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && step !== "success") {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect, step]);

  // Persist the display name captured during registration, then move on.
  useEffect(() => {
    if (step !== "success" || !name.trim() || !user) return;
    let cancelled = false;
    let timer: number | undefined;

    async function persistName() {
      try {
        await updateDisplayName({ name: name.trim() });
      } catch {
        // A failed name update is not worth blocking sign-in for.
      }
      if (!cancelled) {
        timer = window.setTimeout(() => navigate(redirect, { replace: true }), 900);
      }
    }

    void persistName();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [step, name, user, updateDisplayName, navigate, redirect]);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: typeof fieldErrors = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) nextErrors.email = emailResult.error.issues[0]?.message;
    if (mode === "signup") {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) nextErrors.name = nameResult.error.issues[0]?.message;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsBusy(true);
    setBusyLabel("sending");
    setServerError(null);
    try {
      const formData = new FormData();
      formData.set("email", emailResult.data!);
      await signIn("email-otp", formData);
      setStep("code");
      track(mode === "signup" ? "sign_up" : "login", { stage: "code_requested" });
    } catch (error) {
      setServerError(
        error instanceof Error && error.message
          ? `We could not send a verification code. ${error.message}`
          : "We could not reach the sign-in service. Check your connection and try again.",
      );
    } finally {
      setIsBusy(false);
      setBusyLabel(null);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setFieldErrors({ code: "Enter the 6-digit code from your email." });
      return;
    }
    setIsBusy(true);
    setBusyLabel("verifying");
    setServerError(null);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", trimmed);
      await signIn("email-otp", formData);
      track("login", { stage: "verified" });
      setStep("success");
      if (!name.trim()) {
        window.setTimeout(() => navigate(redirect, { replace: true }), 900);
      }
    } catch {
      setServerError(
        "That verification code was not accepted. Codes expire after 15 minutes — request a new one if needed.",
      );
      setCode("");
      setFieldErrors({ code: "Incorrect or expired code." });
    } finally {
      setIsBusy(false);
      setBusyLabel(null);
    }
  }

  async function continueAsDemo() {
    setIsBusy(true);
    setBusyLabel("demo");
    setServerError(null);
    try {
      await signIn("anonymous");
      track("demo_launch");
      navigate(redirect, { replace: true });
    } catch {
      setServerError(
        "Demo mode is unavailable right now. Create an account with an email address instead.",
      );
    } finally {
      setIsBusy(false);
      setBusyLabel(null);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div
        className="hud-grid pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />

      {/* Narrative panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-8 lg:flex xl:p-12">
        <Brand />

        <div className="my-10">
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.6, ease: EASE_OUT }}
            className="text-balance text-3xl font-extrabold uppercase leading-tight tracking-tight text-foreground xl:text-4xl"
          >
            Sign in to the
            <br />
            <span className="bg-[linear-gradient(120deg,color-mix(in_oklch,var(--chart-1)_82%,black),color-mix(in_oklch,var(--chart-2)_78%,black))] bg-clip-text text-transparent">
              tracking console
            </span>
          </motion.h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Your session keeps the simulated alignment runs, event log and session history
            together so a reviewer can compare attempts.
          </p>

          <div className="clay-screen relative mt-8 h-64 overflow-hidden xl:h-72">
            <Suspense
              fallback={
                <div className="flex size-full items-center justify-center">
                  <p className="hud-label !text-white/50">Loading 3D terminal…</p>
                </div>
              }
            >
              <TerminalScene
                className="size-full"
                azimuthDeg={4.5}
                elevationDeg={-2.5}
                targetAzimuthDeg={-3.2}
                targetElevationDeg={2.1}
                beamProgress={0.6}
              />
            </Suspense>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            Illustrative 3D model. It is not a representation of any real optical terminal.
          </p>
        </div>

        <ul className="space-y-2.5">
          {[
            "One-time email codes — no password is ever stored",
            "Session history scoped to your account",
            "Simulation only: no hardware or ISRO systems are connected",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Form panel */}
      <section className="relative flex flex-1 items-center justify-center p-4 sm:p-8">
        <ClayPanel size="lg" className="w-full max-w-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Brand compact />
          </div>

          <div className="mt-4 lg:mt-0">
            <TechBadge tone="busy" pulse>
              Prototype • Simulation environment
            </TechBadge>
          </div>

          <AnimatePresence mode="wait">
            {step === "success" ? (
              <motion.div
                key="success"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.35, ease: EASE_OUT }}
                className="py-8 text-center"
                role="status"
                aria-live="polite"
              >
                <span className="clay-sm mx-auto flex size-14 items-center justify-center rounded-3xl text-[color-mix(in_oklch,var(--chart-4)_55%,black)]">
                  <CheckCircle2 className="size-7" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  You're signed in
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Opening the virtual camera tracking console…
                </p>
                <Button
                  className="clay-press mt-5 rounded-full"
                  onClick={() => navigate(redirect, { replace: true })}
                >
                  Continue now
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </motion.div>
            ) : step === "code" ? (
              <motion.div
                key="code"
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: EASE_OUT }}
              >
                <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="hud-value text-foreground">{email}</span>. It expires in 15
                  minutes.
                </p>

                <form onSubmit={verifyCode} className="mt-6" noValidate>
                  <label className="hud-label" htmlFor="code">
                    Verification code
                  </label>
                  <ClayInset className="mt-2 flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
                    <KeyRound className="size-4 text-muted-foreground" aria-hidden="true" />
                    <input
                      id="code"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                      aria-invalid={Boolean(fieldErrors.code)}
                      aria-describedby={fieldErrors.code ? "code-error" : undefined}
                      className="hud-value w-full bg-transparent text-lg tracking-[0.4em] text-foreground outline-none"
                      placeholder="000000"
                    />
                  </ClayInset>
                  {fieldErrors.code && (
                    <p id="code-error" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3.5" aria-hidden="true" />
                      {fieldErrors.code}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isBusy}
                    className="clay-press mt-5 h-11 w-full rounded-2xl"
                  >
                    {isBusy && busyLabel === "verifying" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        Verify and continue
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("credentials");
                        setCode("");
                        setFieldErrors({});
                        setServerError(null);
                      }}
                      className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Use a different email
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHelp((value) => !value)}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Didn't get the code?
                    </button>
                  </div>

                  <AnimatePresence>
                    {showHelp && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden text-[11px] leading-5 text-muted-foreground"
                      >
                        Codes can take a minute to arrive. Check spam, then go back and request a
                        new code. Sign-in uses one-time codes only, so there is no password to
                        reset.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="credentials"
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: EASE_OUT }}
              >
                <div
                  className="clay-inset mt-5 flex gap-1 rounded-full p-1"
                  role="tablist"
                  aria-label="Sign in or create an account"
                >
                  {(
                    [
                      ["signin", "Sign in"],
                      ["signup", "Create account"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={mode === value}
                      onClick={() => {
                        setMode(value);
                        setFieldErrors({});
                        setServerError(null);
                      }}
                      className={cn(
                        "relative flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                        mode === value
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode === value && (
                        <motion.span
                          layoutId="auth-mode-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      {label}
                    </button>
                  ))}
                </div>

                <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                  {mode === "signup" ? "Create your account" : "Sign in"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {mode === "signup"
                    ? "Register with your name and email. We'll send a one-time code to verify it."
                    : "Enter your email and we'll send a one-time sign-in code."}
                </p>

                <form onSubmit={requestCode} className="mt-6 space-y-4" noValidate>
                  {mode === "signup" && (
                    <div>
                      <label className="hud-label" htmlFor="name">
                        Full name
                      </label>
                      <ClayInset className="mt-2 flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
                        <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                        <input
                          id="name"
                          name="name"
                          autoComplete="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          aria-invalid={Boolean(fieldErrors.name)}
                          aria-describedby={fieldErrors.name ? "name-error" : undefined}
                          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                          placeholder="Ada Lovelace"
                        />
                      </ClayInset>
                      {fieldErrors.name && (
                        <p id="name-error" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="size-3.5" aria-hidden="true" />
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="hud-label" htmlFor="email">
                      Email
                    </label>
                    <ClayInset className="mt-2 flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
                      <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        placeholder="name@example.com"
                      />
                    </ClayInset>
                    {fieldErrors.email && (
                      <p id="email-error" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="size-3.5" aria-hidden="true" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isBusy}
                    className="clay-press h-11 w-full rounded-2xl"
                  >
                    {isBusy && busyLabel === "sending" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Sending code…
                      </>
                    ) : (
                      <>
                        {mode === "signup" ? "Create account" : "Send sign-in code"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="hud-label !text-[9.5px]">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={continueAsDemo}
                  className="clay-press h-11 w-full rounded-2xl"
                >
                  {isBusy && busyLabel === "demo" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <UserX className="size-4" aria-hidden="true" />
                  )}
                  Continue as demo user
                </Button>
                <p className="mt-2.5 text-[11px] leading-5 text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Simulation demo account</span>{" "}
                  — an anonymous, ephemeral session for exploring the console. Nothing you enter
                  is saved to an account, and the session cannot be recovered later.
                </p>

                <button
                  type="button"
                  onClick={() => setShowHelp((value) => !value)}
                  className="mt-4 text-xs text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
                <AnimatePresence>
                  {showHelp && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden text-[11px] leading-5 text-muted-foreground"
                    >
                      There is no password to reset. Drishti-Optik signs you in with a one-time
                      code sent to your email, so nothing sensitive is stored.
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {serverError && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-2xl bg-[color-mix(in_oklch,var(--destructive)_14%,transparent)] px-3.5 py-3 text-xs leading-5 text-destructive"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {serverError}
            </motion.p>
          )}

          <p className="mt-6 border-t border-border/60 pt-4 text-[11px] leading-5 text-muted-foreground">
            {DISCLAIMERS.notIsro}{" "}
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>
        </ClayPanel>
      </section>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={null}>
      <Auth {...props} />
    </Suspense>
  );
}
