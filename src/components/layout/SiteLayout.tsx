import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Link, Outlet } from "react-router";
import React, { Suspense } from "react";

function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="clay-sm size-10 animate-pulse rounded-2xl" />
      <p className="hud-label">Loading module…</p>
    </div>
  );
}

/**
 * Shell for the public marketing and documentation routes. The assistant
 * provider is mounted above the router so the launcher appears on every page,
 * including this one.
 */
export function SiteLayout() {
  return (
    <>
      <div className="relative flex min-h-screen flex-col">
        <div
          className="hud-grid pointer-events-none absolute inset-0 opacity-[0.55]"
          aria-hidden="true"
        />
        <a
          href="#main-content"
          className="clay-sm sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Navbar />
        <main
          id="main-content"
          className="relative mx-auto w-full max-w-7xl flex-1 px-3 pb-28 pt-6 sm:px-5 sm:pb-12 sm:pt-10"
        >
          <Suspense fallback={<RouteLoading />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <MobileCtaBar />
    </>
  );
}

/** Sticky primary action on phones so the console is always one tap away. */
function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:hidden">
      <div className="clay flex items-center gap-2 rounded-3xl p-2">
        <Button asChild className="h-11 flex-1 rounded-2xl">
          <Link to="/login?returnTo=%2Fconsole">
            <PlayCircle className="size-4" aria-hidden="true" />
            Get access
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-2xl px-3">
          <Link to="/technology" aria-label="Explore the technology">
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
