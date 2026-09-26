import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const TrackingConsole = lazy(() => import("./pages/TrackingConsole.tsx"));
const Technology = lazy(() => import("./pages/Technology.tsx"));
const Architecture = lazy(() => import("./pages/Architecture.tsx"));
const Documentation = lazy(() => import("./pages/Documentation.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const ThankYou = lazy(() => import("./pages/ThankYou.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const SiteLayout = lazy(() =>
  import("./components/layout/SiteLayout.tsx").then((module) => ({
    default: module.SiteLayout,
  })),
);
const AssistantProvider = lazy(() =>
  import("./components/assistant/AssistantProvider.tsx").then((module) => ({
    default: module.AssistantProvider,
  })),
);
const AnalyticsBridge = lazy(() =>
  import("./components/analytics/AnalyticsBridge.tsx").then((module) => ({
    default: module.AnalyticsBridge,
  })),
);
const CookieConsent = lazy(() =>
  import("./components/analytics/CookieConsent.tsx").then((module) => ({
    default: module.CookieConsent,
  })),
);

/** Route-transition fallback. Keeps the shell visible instead of flashing. */
function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="clay-sm size-10 animate-pulse rounded-2xl" />
      <p className="hud-label">Loading module…</p>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown runtime error" };
  }
  componentDidCatch(err: Error) {
    console.error("[Drishti-Optik] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="clay max-w-lg p-8 text-center">
            <p className="hud-label">Console error</p>
            <p className="mt-3 text-lg font-semibold">Something interrupted the interface</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The application hit an unexpected runtime error. Reloading the page usually clears
              it, and no simulation data is lost.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="clay-sm clay-press mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Reload the console
            </button>
            <p className="mt-4 break-words text-[11px] leading-5 text-muted-foreground/80">
              {this.state.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

/** Keeps the host iframe in sync and resets scroll between routes. */
function RouteSyncer() {
  const location = useLocation();

  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={null}>
            <AnalyticsBridge />
          </Suspense>
          <Suspense fallback={<RouteLoading />}>
            <AssistantProvider>
              <Routes>
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/technology" element={<Technology />} />
                  <Route path="/architecture" element={<Architecture />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/thank-you" element={<ThankYou />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth
                        title="Sign in to open your dashboard"
                        description="The monitoring dashboard summarises your simulation sessions and system health."
                      >
                        <Dashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/console"
                    element={
                      <RequireAuth
                        title="Sign in to launch the tracking console"
                        description="The virtual camera tracking console runs the coarse alignment simulation and saves your sessions."
                      >
                        <TrackingConsole />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth
                        title="Sign in to manage your profile"
                        description="Profile and settings are scoped to your account."
                      >
                        <Profile />
                      </RequireAuth>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/auth" element={<AuthPage redirectAfterAuth="/console" />} />
              </Routes>
            </AssistantProvider>
          </Suspense>
          <Suspense fallback={null}>
            <CookieConsent />
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
