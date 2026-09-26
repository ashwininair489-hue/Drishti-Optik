import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

/**
 * Wraps a route that requires a signed-in user.
 *
 * Signed-out visitors used to be bounced straight to `/auth`, which left them
 * on a bare sign-in form with no idea which page they had asked for or why they
 * were moved. The block is now stated on the page they landed on, and sign-in
 * still returns them to it via `returnTo`. Pass `redirectImmediately` for a
 * route where the bounce really is the better experience.
 */
export function RequireAuth({
  children,
  title = "Sign in to continue",
  description = "This page is only available to signed-in users.",
  redirectImmediately = false,
}: {
  children: ReactNode;
  /** Headline on the blocked screen. */
  title?: string;
  /** Says what the visitor gets by signing in. */
  description?: string;
  /** Skip the explanation and go straight to `/auth`. */
  redirectImmediately?: boolean;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="clay-sm flex size-12 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="sr-only">Checking your session…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    const signInHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

    if (redirectImmediately) {
      return <Navigate to={signInHref} replace />;
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center py-6">
        <Card className="clay w-full max-w-md gap-4 border-0 py-7">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <div className="clay-sm mb-4 flex size-12 items-center justify-center rounded-2xl text-primary">
                <Lock className="size-5" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            You'll come straight back to this page once you're signed in.
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="clay-press w-full rounded-full"
              onClick={() => navigate(signInHref)}
            >
              Sign in
            </Button>
            <Button
              variant="ghost"
              className="clay-press w-full rounded-full"
              onClick={() => navigate("/")}
            >
              Back to home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return children;
}
