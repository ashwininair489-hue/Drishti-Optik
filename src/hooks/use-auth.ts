import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useCallback } from "react";

/** How long a sign-in call may stay unanswered before the UI reports failure. */
const SIGN_IN_TIMEOUT_MS = 20_000;

type SignIn = ReturnType<typeof useAuthActions>["signIn"];

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn: requestSignIn, signOut } = useAuthActions();

  // While the Convex client is (re)connecting it queues calls instead of
  // rejecting them, so a dead deployment or dropped connection would leave the
  // sign-in buttons spinning forever. Bound every attempt so the pages can show
  // an actionable error instead.
  const signIn = useCallback<SignIn>(
    async (...args) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "The sign-in service did not respond. Check your connection and try again.",
              ),
            ),
          SIGN_IN_TIMEOUT_MS,
        );
      });

      try {
        return await Promise.race([requestSignIn(...args), timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
    [requestSignIn],
  );

  // Derive isLoading directly from the dependencies instead of managing separate state
  const isLoading = isAuthLoading || user === undefined;

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}
