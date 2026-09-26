import { useAssistant } from "@/components/assistant/assistant-context";
import { Brand } from "@/components/common/Brand";
import { EASE_OUT } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PRIMARY_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { open } = useAssistant();
  const reduced = useReducedMotion();
  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto w-full max-w-7xl">
        <div className="clay flex items-center gap-2 rounded-full px-3 py-2 sm:px-4">
          <Brand compact className="mr-1 shrink-0" />

          <nav aria-label="Primary" className="ml-2 hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href} className="relative">
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "relative z-10 block rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-active-pill"
                            className="absolute inset-0 -z-10 rounded-full bg-primary"
                            transition={
                              reduced
                                ? { duration: 0 }
                                : { type: "spring", stiffness: 380, damping: 32 }
                            }
                          />
                        )}
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => open()}
              className="clay-sm clay-press hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground/85 sm:flex"
            >
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <span className="hidden xl:inline">Drishti AI</span>
            </button>

            <Button asChild size="sm" variant="outline" className="clay-press hidden rounded-full px-4 sm:inline-flex">
              <Link to="/login">
                <span>Sign in</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="clay-press rounded-full px-4">
              <Link to={isAuthenticated ? "/dashboard" : "/console"}>
                <LayoutDashboard className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {isAuthenticated ? "Console" : "Launch Console"}
                </span>
                <span className="sm:hidden">Console</span>
              </Link>
            </Button>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="clay-sm clay-press flex size-9 items-center justify-center rounded-full lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-nav"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10, height: 0 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: EASE_OUT }}
              className="overflow-hidden lg:hidden"
            >
              <div className="clay mt-2 rounded-3xl p-3">
                <nav aria-label="Mobile">
                  <ul className="grid gap-1">
                    {PRIMARY_NAV.map((item) => (
                      <li key={item.href}>
                        <NavLink
                          to={item.href}
                          onClick={closeMenu}
                          className={({ isActive }) =>
                            cn(
                              "block rounded-2xl px-4 py-3 text-sm font-medium",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "clay-inset text-foreground/85",
                            )
                          }
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    open();
                  }}
                  className="clay-inset mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-foreground/85"
                >
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  Ask Drishti AI
                </button>
                <Button asChild variant="outline" className="mt-2 w-full rounded-2xl">
                  <Link to={isAuthenticated ? "/profile" : "/login"} onClick={closeMenu}>
                    {isAuthenticated ? "Profile & settings" : "Sign in"}
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
