import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { PageHeader, StatTile } from "@/components/common/Section";
import { SimulatedTag, TechBadge } from "@/components/common/Tags";
import { ConsentStatus } from "@/components/analytics/ConsentStatus";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ANALYTICS_SUPPORTED, clearConsent } from "@/lib/analytics";
import { usePageMeta } from "@/lib/seo";
import { fmt } from "@/lib/tracking-engine";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Cookie,
  Loader2,
  LogOut,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(80, "Display name must be under 80 characters."),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function Profile() {
  usePageMeta({
    title: "Profile & Settings | Drishti-Optik",
    description:
      "Manage your Drishti-Optik display name, simulation history and cookie preferences.",
    path: "/profile",
    noindex: true,
  });

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const updateDisplayName = useMutation(api.profile.updateDisplayName);
  const clearHistory = useMutation(api.profile.clearHistory);
  const stats = useQuery(api.simulation.sessionStats, {});

  const [clearing, setClearing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "" },
  });

  async function onSubmit(values: ProfileValues) {
    try {
      await updateDisplayName({ name: values.name });
      toast.success("Display name updated.");
      reset({ name: values.name });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update your display name.",
      );
    }
  }

  async function handleClearHistory() {
    setClearing(true);
    try {
      const result = await clearHistory({});
      toast.success(
        result.deleted === 0
          ? "There was no saved history to clear."
          : `Cleared ${result.deleted} saved session${result.deleted === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not clear your history right now.",
      );
    } finally {
      setClearing(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/");
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile & settings"
        icon={UserRound}
        title="Your account"
        description="Control how you appear in the console, review what has been saved, and manage your cookie choices."
        badge={<TechBadge tone="busy">Session scoped to your account</TechBadge>}
        actions={
          <Button variant="outline" className="clay-press rounded-full" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Saved runs"
          value={stats ? stats.total : "—"}
          tag={<SimulatedTag />}
          hint="Completed simulation sessions stored against your account"
        />
        <StatTile
          label="Aligned runs"
          value={stats ? stats.aligned : "—"}
          hint="Runs that reached the coarse tolerance band"
        />
        <StatTile
          label="Best final error"
          value={stats && stats.total > 0 ? fmt.deg(stats.bestFinalErrorDeg) : "—"}
          hint="Lowest simulated residual error achieved"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ClayPanel className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Display name</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Shown on the dashboard greeting. Your email address is used only for sign-in and is
            never displayed to other users.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5" noValidate>
            <label className="hud-label" htmlFor="display-name">
              Display name
            </label>
            <input
              id="display-name"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "display-name-error" : undefined}
              className={cn(
                "clay-inset mt-2 w-full rounded-2xl px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground",
                errors.name && "ring-1 ring-destructive/60",
              )}
              placeholder="Your name"
            />
            {errors.name && (
              <p id="display-name-error" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                {errors.name.message}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting} className="clay-press rounded-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" aria-hidden="true" />
                    Save name
                  </>
                )}
              </Button>
              {isSubmitSuccessful && (
                <span className="flex items-center gap-1.5 text-xs text-[color-mix(in_oklch,var(--chart-4)_52%,black)]">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Saved
                </span>
              )}
            </div>
          </form>

          <ClayInset className="mt-6 rounded-2xl p-4">
            <p className="hud-label">Account</p>
            <p className="hud-value mt-2 text-sm text-foreground">
              {user?.email ?? "Anonymous demo session"}
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
              {user?.isAnonymous
                ? "This is an anonymous demo session. It is not linked to an email address and cannot be recovered later."
                : "Signed in with a one-time email code. No password is stored for this account."}
            </p>
          </ClayInset>
        </ClayPanel>

        <div className="space-y-5">
          <ClayPanel className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Simulation history</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Clearing history permanently deletes your saved simulation sessions and their
              pipeline events. It does not affect other accounts.
            </p>

            <div className="mt-5">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="clay-press rounded-full">
                    <Trash2 className="size-4" aria-hidden="true" />
                    Clear history
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="clay rounded-[2rem] border-0">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all saved simulation history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes every saved session and its events from your
                      account. It cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl">Keep history</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearHistory}
                      disabled={clearing}
                      className="rounded-2xl"
                    >
                      {clearing ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Clearing…
                        </>
                      ) : (
                        "Yes, clear it"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </ClayPanel>

          <ClayPanel className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Cookie className="size-4 text-primary" aria-hidden="true" />
              Cookie preferences
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {ANALYTICS_SUPPORTED
                ? "Essential storage keeps you signed in. Optional analytics collects coarse product events only, and only after you accept it."
                : "Optional analytics is disabled in this deployment. Essential storage keeps you signed in."}
            </p>
            <ClayInset className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <span className="hud-label">Current choice</span>
              <ConsentStatus />
            </ClayInset>
            <Button
              variant="outline"
              className="clay-press mt-4 rounded-full"
              onClick={clearConsent}
            >
              Open cookie preferences
            </Button>
          </ClayPanel>
        </div>
      </div>
    </div>
  );
}
