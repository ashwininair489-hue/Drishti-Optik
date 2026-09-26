import { Brand } from "@/components/common/Brand";
import { EASE_OUT } from "@/components/common/Reveal";
import { TechBadge } from "@/components/common/Tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { usePageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Globe,
  KeyRound,
  Layers,
  Loader2,
  Mail,
  Orbit,
  Rocket,
  Satellite,
  ShieldCheck,
  Sparkles,
  Telescope,
  UserRound,
  UserX,
  Zap,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";

const TerminalScene = lazy(() => import("@/components/three/TerminalScene"));
const LoginScene = lazy(() => import("@/components/three/LoginScene"));

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(160, "That email address is too long.")
  .regex(/^[^\\s@]+@[^\\s@]+\.[^\\s@]{2,}$/, "Enter a valid email address.");
const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name (at least 2 characters).")
  .max(80, "That name is too long.");

function resolveReturnTo(v: string | null, fallback: string) {
  if (v && v.startsWith("/") && !v.startsWith("//")) return v;
  return fallback;
}

type Step = "credentials" | "code" | "success";
type Mode = "signin" | "signup";

/* ── tiny animated constellation behind the 3D canvas ─────────────────── */
function Constellation({ animate }: { animate: boolean }) {
  const points = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: 12 + (i * 53) % 78,
        y: 10 + (i * 37) % 74,
        r: 1.2 + (i % 3) * 0.7,
        delay: (i * 0.22) % 2,
      })),
    []
  );
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full opacity-[0.28]"
    >
      {/* faint connecting lines */}
      <path
        d="M12 18 L34 42 L52 28 L70 55 L88 22 M34 42 L22 78 L58 84 L88 62"
        fill="none"
        stroke="currentColor"
        className="text-[color-mix(in_oklch,var(--chart-2)_55%,white)]"
        strokeWidth={0.35}
        strokeDasharray="1.5 2.5"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.r} fill="currentColor" className="text-white/70" />
          {animate && (
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r * 2.2}
              fill="none"
              stroke="currentColor"
              className="text-white/20"
              strokeWidth={0.4}
            >
              <animate
                attributeName="r"
                values={`${p.r * 1.2};${p.r * 3.2};${p.r * 1.2}`}
                dur={`${2.8 + p.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.35;0;0.35"
                dur={`${2.8 + p.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ── floating stat chips that drift slightly ──────────────────────────── */
const FLOAT_STATS = [
  { icon: Orbit, label: "Tracking", value: "Coarse alignment" },
  { icon: Zap, label: "Latency", value: "~42 ms (sim)" },
  { icon: Telescope, label: "Field of view", value: "12° × 7° (sim)" },
];

export default function Login() {
  usePageMeta({
    title: "Sign in — Drishti-Optik",
    description:
      "Sign in to Drishti-Optik: one-time email codes or a demo session. Access the virtual camera tracking console — a simulation, not an official ISRO product.",
    path: "/login",
  });

  const reduced = useReducedMotion();
  const { isLoading: authLoading, isAuthenticated, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const updateName = useMutation(api.profile.updateDisplayName);

  const redirect = resolveReturnTo(params.get("returnTo"), "/console");
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [fieldErr, setFieldErr] = useState<{ email?: string; name?: string; code?: string }>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "sending" | "verifying" | "demo">(null);
  const [showHelp, setShowHelp] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && step !== "success") navigate(redirect, { replace: true });
  }, [authLoading, isAuthenticated, navigate, redirect, step]);

  useEffect(() => {
    if (step !== "success" || !name.trim() || !user) return;
    let cancelled = false;
    let t: number | undefined;
    (async () => {
      try {
        await updateName({ name: name.trim() });
      } catch {}
      if (!cancelled) t = window.setTimeout(() => navigate(redirect, { replace: true }), 900);
    })();
    return () => {
      cancelled = true;
      if (t !== undefined) window.clearTimeout(t);
    };
  }, [step, name, user, updateName, navigate, redirect]);

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof fieldErr = {};
    const er = emailSchema.safeParse(email);
    if (!er.success) errs.email = er.error.issues[0]?.message;
    if (mode === "signup") {
      const nr = nameSchema.safeParse(name);
      if (!nr.success) errs.name = nr.error.issues[0]?.message;
    }
    setFieldErr(errs);
    if (Object.keys(errs).length) {
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      return;
    }
    setBusy("sending");
    setServerErr(null);
    try {
      const fd = new FormData();
      fd.set("email", er.data!);
      await signIn("email-otp", fd);
      setStep("code");
    } catch (err) {
      setServerErr(
        err instanceof Error && err.message
          ? `We couldn't send a code. ${err.message}`
          : "We couldn't reach the sign-in service. Check your connection."
      );
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    } finally {
      setBusy(null);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    const t = code.trim();
    if (!/^\d{6}$/.test(t)) {
      setFieldErr({ code: "Enter the 6-digit code from your email." });
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      return;
    }
    setBusy("verifying");
    setServerErr(null);
    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("code", t);
      await signIn("email-otp", fd);
      setStep("success");
      if (!name.trim()) window.setTimeout(() => navigate(redirect, { replace: true }), 900);
    } catch {
      setServerErr("That code wasn't accepted. It may have expired — request a new one.");
      setCode("");
      setFieldErr({ code: "Incorrect or expired code." });
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    } finally {
      setBusy(null);
    }
  }

  async function onDemo() {
    setBusy("demo");
    setServerErr(null);
    try {
      await signIn("anonymous");
      navigate(redirect, { replace: true });
    } catch {
      setServerErr("Demo mode is unavailable right now. Try signing in with email.");
    } finally {
      setBusy(null);
    }
  }

  const isBusy = busy !== null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(120%_90%_at_18%_-10%,color-mix(in_oklch,var(--chart-1)_18%,transparent),transparent_55%),radial-gradient(95%_70%_at_92%_100%,color-mix(in_oklch,var(--chart-2)_16%,transparent),transparent_60%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_92%,white))]">
      {/* subtle grid */}
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-[0.45]" aria-hidden="true" />

      {/* 3D — full-bleed on mobile behind the card; side panel on desktop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden lg:inset-y-0 lg:right-0 lg:left-[52%]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background lg:bg-gradient-to-r lg:from-background lg:via-transparent lg:to-transparent" />
        <Suspense fallback={null}>
          <LoginScene animate={!reduced} />
        </Suspense>
        <Constellation animate={!reduced} />
        {/* floating badges — desktop only */}
        <div className="hidden lg:block">
          {FLOAT_STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={reduced ? undefined : { y: 0 }}
                animate={reduced ? undefined : { y: [0, -6, 0] }}
                transition={
                  reduced ? undefined : { duration: 3 + i * 0.6, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }
                }
                className={cn(
                  "clay-sm absolute flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                  i === 0 && "left-[8%] top-[18%]",
                  i === 1 && "right-[10%] top-[34%]",
                  i === 2 && "left-[14%] bottom-[18%]"
                )}
              >
                <Icon className="size-3.5 text-primary" aria-hidden="true" />
                <span className="hud-label !text-[10px]">{s.label}</span>
                <span className="hud-value text-xs font-semibold text-foreground">{s.value}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* layout */}
      <div className="relative z-10 flex min-h-screen flex-col lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* left — narrative (hidden on small screens' top; shown as compact header) */}
        <section className="flex flex-col gap-6 px-5 pb-6 pt-5 sm:px-8 sm:pt-8 lg:justify-between lg:px-10 lg:py-10 xl:px-14">
          <Brand />

          <div className="hidden lg:block">
            <motion.h1
              initial={reduced ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.6, ease: EASE_OUT }}
              className="text-balance text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-foreground xl:text-5xl"
            >
              Drift
              <br />
              <span className="bg-[linear-gradient(120deg,color-mix(in_oklch,var(--chart-1)_84%,black),color-mix(in_oklch,var(--chart-2)_80%,black))] bg-clip-text text-transparent">
                into orbit
              </span>
            </motion.h1>
            <motion.p
              initial={reduced ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.55, delay: 0.12, ease: EASE_OUT }}
              className="mt-4 max-w-md text-sm leading-6 text-muted-foreground"
            >
              Sign in to run the coarse-alignment simulation — a lively, 3D preview of
              how a mobile FSOC terminal acquires its partner. Everything you see is{" "}
              <span className="font-semibold text-foreground/80">SIMULATED DATA</span>.
            </motion.p>

            {/* mini feature strip */}
            <div className="mt-7 grid max-w-md grid-cols-3 gap-2.5">
              {[
                { icon: Layers, label: "Console", hint: "8-stage pipeline" },
                { icon: Satellite, label: "3D pair", hint: "Two terminals + beam" },
                { icon: Sparkles, label: "Drishti AI", hint: "In-app guide" },
              ].map((f, i) => {
                const I = f.icon;
                return (
                  <motion.div
                    key={f.label}
                    initial={reduced ? undefined : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduced ? 0 : 0.45, delay: 0.2 + i * 0.08, ease: EASE_OUT }}
                    className="clay-sm flex flex-col items-start gap-2 rounded-2xl px-3 py-3"
                  >
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <I className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">{f.label}</span>
                    <span className="hud-label !text-[10px] !normal-case !tracking-normal">{f.hint}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* 3D peephole inside the narrative column */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.6, delay: 0.32, ease: EASE_OUT }}
              className="clay-screen relative mt-8 h-56 overflow-hidden xl:h-64"
            >
              <Suspense
                fallback={
                  <div className="flex size-full items-center justify-center">
                    <p className="hud-label !text-white/50">Loading 3D preview…</p>
                  </div>
                }
              >
                <TerminalScene
                  className="size-full"
                  azimuthDeg={6}
                  elevationDeg={-2}
                  targetAzimuthDeg={-4}
                  targetElevationDeg={3}
                  beamProgress={0.7}
                  errorMagnitudeDeg={2.1}
                />
              </Suspense>
              <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/60 backdrop-blur">
                Interactive — drag to orbit
              </span>
            </motion.div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Illustrative 3D models — not a CAD representation of any real terminal.
            </p>

            <ul className="mt-6 space-y-2">
              {[
                "One-time email codes — no password stored",
                "Demo session for quick exploration",
                "Simulation only — no hardware or ISRO link",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* mobile compact hero */}
          <div className="lg:hidden">
            <h1 className="text-balance text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground sm:text-4xl">
              Welcome to{" "}
              <span className="bg-[linear-gradient(120deg,color-mix(in_oklch,var(--chart-1)_84%,black),color-mix(in_oklch,var(--chart-2)_80%,black))] bg-clip-text text-transparent">
                Drishti-Optik
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Run the coarse-alignment simulation — lively, 3D, and fully simulated.
            </p>
          </div>
        </section>

        {/* right — auth card */}
        <section className="flex flex-1 items-start justify-center px-4 pb-8 pt-2 sm:px-8 sm:pt-4 lg:items-center lg:px-8 lg:py-8">
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduced ? 0 : 0.55, ease: EASE_OUT }}
            className={cn(
              "clay-lg relative w-full max-w-md overflow-hidden p-6 sm:p-8",
              shake && !reduced && "animate-[shake_0.42s_ease]"
            )}
          >
            {/* top sheen */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-60"
            />
            {/* subtle inner glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--chart-1)_18%,transparent),transparent_70%)] blur-2xl"
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <TechBadge tone="busy" pulse>
                  Prototype · Simulation
                </TechBadge>
                <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:flex">
                  <Globe className="size-3" aria-hidden="true" /> Prototype
                </span>
              </div>

              <AnimatePresence mode="wait">
                {step === "success" ? (
                  <motion.div
                    key="success"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.35, ease: EASE_OUT }}
                    className="py-10 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="clay-sm mx-auto flex size-14 items-center justify-center rounded-3xl text-[color-mix(in_oklch,var(--chart-4)_55%,black)]">
                      <CheckCircle2 className="size-7" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold text-foreground">You&apos;re in</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Opening the tracking console…
                    </p>
                    <motion.div
                      className="mx-auto mt-5 h-1 w-24 overflow-hidden rounded-full bg-muted"
                      aria-hidden="true"
                    >
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                      />
                    </motion.div>
                    <Button
                      className="clay-press mt-6 rounded-full"
                      onClick={() => navigate(redirect, { replace: true })}
                    >
                      Continue now <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  </motion.div>
                ) : step === "code" ? (
                  <motion.div
                    key="code"
                    initial={reduced ? { opacity: 0, x: 14 } : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: reduced ? 0 : 0.3, ease: EASE_OUT }}
                  >
                    <h2 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                      Check your inbox
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      6-digit code sent to <span className="hud-value text-foreground">{email}</span>. Expires in
                      15 minutes.
                    </p>
                    <form onSubmit={onVerify} className="mt-6" noValidate>
                      <Label htmlFor="code" className="hud-label">
                        Verification code
                      </Label>
                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-card px-3.5 py-2.5 shadow-[inset_0_1px_2px_color-mix(in_oklch,var(--clay-shade)_12%,transparent)] focus-within:ring-2 focus-within:ring-ring/30">
                        <KeyRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <input
                          id="code"
                          name="code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                          aria-invalid={Boolean(fieldErr.code)}
                          aria-describedby={fieldErr.code ? "code-err" : undefined}
                          className="hud-value w-full bg-transparent text-lg tracking-[0.42em] text-foreground outline-none placeholder:text-muted-foreground/40"
                          placeholder="000000"
                        />
                      </div>
                      {fieldErr.code && (
                        <p id="code-err" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="size-3.5" aria-hidden="true" /> {fieldErr.code}
                        </p>
                      )}
                      <Button type="submit" disabled={isBusy} className="clay-press mt-5 h-11 w-full rounded-2xl">
                        {busy === "verifying" ? (
                          <>
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Verifying…
                          </>
                        ) : (
                          <>
                            Verify and continue <ArrowRight className="size-4" aria-hidden="true" />
                          </>
                        )}
                      </Button>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setStep("credentials");
                            setCode("");
                            setFieldErr({});
                            setServerErr(null);
                          }}
                          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          Use a different email
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowHelp((v) => !v)}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Didn&apos;t get the code?
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
                            Check spam, then go back and request a new code. Codes expire quickly and there&apos;s no
                            password to reset.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="creds"
                    initial={reduced ? { opacity: 0, x: 14 } : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: reduced ? 0 : 0.3, ease: EASE_OUT }}
                  >
                    {/* mode switch */}
                    <div
                      className="clay-inset mt-6 flex gap-1 rounded-full p-1"
                      role="tablist"
                      aria-label="Sign in or create an account"
                    >
                      {(
                        [
                          ["signin", "Sign in"],
                          ["signup", "Create account"],
                        ] as const
                      ).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          role="tab"
                          aria-selected={mode === v}
                          onClick={() => {
                            setMode(v);
                            setFieldErr({});
                            setServerErr(null);
                          }}
                          className={cn(
                            "relative flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                            mode === v ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {mode === v && (
                            <motion.span
                              layoutId="login-mode-pill"
                              className="absolute inset-0 -z-10 rounded-full bg-primary"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            />
                          )}
                          {label}
                        </button>
                      ))}
                    </div>

                    <h2 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                      {mode === "signup" ? "Create your account" : "Welcome back"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {mode === "signup"
                        ? "Name + email, then a one-time code. No passwords, ever."
                        : "Enter your email — we'll send a one-time sign-in code."}
                    </p>

                    <form onSubmit={onRequestCode} className="mt-6 space-y-4" noValidate>
                      {mode === "signup" && (
                        <div>
                          <Label htmlFor="name" className="hud-label">
                            Full name
                          </Label>
                          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-card px-3.5 py-2.5 shadow-[inset_0_1px_2px_color-mix(in_oklch,var(--clay-shade)_12%,transparent)] focus-within:ring-2 focus-within:ring-ring/30">
                            <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <Input
                              id="name"
                              name="name"
                              autoComplete="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              aria-invalid={Boolean(fieldErr.name)}
                              aria-describedby={fieldErr.name ? "name-err" : undefined}
                              className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                              placeholder="Ada Lovelace"
                            />
                          </div>
                          {fieldErr.name && (
                            <p id="name-err" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                              <AlertCircle className="size-3.5" aria-hidden="true" /> {fieldErr.name}
                            </p>
                          )}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="email" className="hud-label">
                          Email
                        </Label>
                        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-card px-3.5 py-2.5 shadow-[inset_0_1px_2px_color-mix(in_oklch,var(--clay-shade)_12%,transparent)] focus-within:ring-2 focus-within:ring-ring/30">
                          <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={Boolean(fieldErr.email)}
                            aria-describedby={fieldErr.email ? "email-err" : undefined}
                            className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                            placeholder="name@example.com"
                          />
                        </div>
                        {fieldErr.email && (
                          <p id="email-err" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="size-3.5" aria-hidden="true" /> {fieldErr.email}
                          </p>
                        )}
                      </div>

                      <Button type="submit" disabled={isBusy} className="clay-press h-11 w-full rounded-2xl">
                        {busy === "sending" ? (
                          <>
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending code…
                          </>
                        ) : (
                          <>
                            {mode === "signup" ? "Create account" : "Send sign-in code"}{" "}
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
                      onClick={onDemo}
                      className="clay-press h-11 w-full rounded-2xl border-dashed"
                    >
                      {busy === "demo" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <UserX className="size-4" aria-hidden="true" />
                      )}
                      Continue as demo user
                    </Button>
                    <p className="mt-2.5 text-center text-[11px] leading-5 text-muted-foreground">
                      Ephemeral session — nothing is saved to an account.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowHelp((v) => !v)}
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
                          There&apos;s no password — sign-in is one-time codes only. Nothing sensitive is stored.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {serverErr && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-2xl bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)] px-3.5 py-3 text-xs leading-5 text-destructive"
                >
                  <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" /> {serverErr}
                </motion.p>
              )}

              <p className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-[11px] leading-5 text-muted-foreground">
                <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                Simulation only — not an official ISRO product.
                <Link to="/" className="ml-auto font-medium text-primary underline-offset-4 hover:underline">
                  Back to home →
                </Link>
              </p>
            </div>
          </motion.div>
        </section>
      </div>

      {/* shake keyframes (local) */}
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`}</style>
    </div>
  );
}
