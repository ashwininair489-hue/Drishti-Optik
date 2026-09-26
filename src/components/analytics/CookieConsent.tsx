import { ClayInset, ClayPanel } from "@/components/common/Clay";
import { EASE_OUT } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ANALYTICS_SUPPORTED, setConsent, subscribeConsent } from "@/lib/analytics";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cookie, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

/**
 * Consent banner. Optional analytics stays switched off until the visitor
 * explicitly accepts, and "Reject non-essential" is a first-class choice
 * rather than a hidden link.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => subscribeConsent((value) => setVisible(value === null)), []);

  const decide = (analytics: boolean) => {
    setConsent(analytics ? "all" : "essential");
    setVisible(false);
    setManageOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: EASE_OUT }}
            className="fixed inset-x-3 bottom-20 z-40 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md"
            role="region"
            aria-label="Cookie consent"
          >
            <ClayPanel className="p-5">
              <div className="flex items-start gap-3">
                <span className="clay-sm flex size-10 shrink-0 items-center justify-center rounded-2xl text-primary">
                  <Cookie className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Cookies & optional analytics
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    Essential cookies keep you signed in. Optional, privacy-conscious
                    analytics records coarse product events only, and never loads until you
                    accept. Read the{" "}
                    <Link to="/privacy#cookies" className="text-primary underline-offset-4 hover:underline">
                      privacy policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  className="clay-press flex-1 rounded-2xl"
                  onClick={() => decide(true)}
                  disabled={!ANALYTICS_SUPPORTED}
                >
                  Accept all
                </Button>
                <Button
                  variant="outline"
                  className="clay-press flex-1 rounded-2xl"
                  onClick={() => decide(false)}
                >
                  Reject non-essential
                </Button>
                <Button
                  variant="ghost"
                  className="clay-press rounded-2xl"
                  onClick={() => setManageOpen(true)}
                >
                  <Settings2 className="size-4" aria-hidden="true" />
                  Manage
                </Button>
              </div>
            </ClayPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="clay max-w-md border-0 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Cookie preferences</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You are in control of what runs in your browser. Essential storage cannot be
              disabled because it keeps your session secure.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <ClayInset className="flex items-start justify-between gap-4 rounded-2xl p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Essential</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Authentication session and your cookie choice. Always on.
                </p>
              </div>
              <Switch checked disabled aria-label="Essential cookies are always enabled" />
            </ClayInset>

            <ClayInset className="flex items-start justify-between gap-4 rounded-2xl p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Optional product analytics
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Coarse events such as page views and simulation starts. No form contents,
                  no precise location, no cross-site advertising.
                </p>
              </div>
              <Switch
                checked={analyticsOn}
                onCheckedChange={setAnalyticsOn}
                disabled={!ANALYTICS_SUPPORTED}
                aria-label="Optional product analytics"
              />
            </ClayInset>
          </div>

          <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="clay-press rounded-2xl sm:flex-1"
              onClick={() => setManageOpen(false)}
            >
              Keep current choice
            </Button>
            <Button
              className="clay-press rounded-2xl sm:flex-1"
              onClick={() => decide(analyticsOn)}
            >
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
