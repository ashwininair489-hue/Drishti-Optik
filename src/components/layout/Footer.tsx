import { Brand } from "@/components/common/Brand";
import { ClayPanel } from "@/components/common/Clay";
import { DISCLAIMERS, SITE } from "@/lib/site";
import { Link } from "react-router";

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Technology", href: "/technology" },
      { label: "Simulation console", href: "/console" },
      { label: "Tracking dashboard", href: "/dashboard" },
      { label: "System architecture", href: "/architecture" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "Documentation", href: "/documentation" },
      { label: "About the project", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Profile & settings", href: "/profile" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms & conditions", href: "/terms" },
      { label: "Cookie preferences", href: "/privacy#cookies" },
      { label: "Thank you", href: "/thank-you" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="px-3 pb-24 pt-10 sm:px-5 sm:pb-10" id="site-footer">
      <div className="mx-auto w-full max-w-7xl">
        <div className="clay-lg grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              {SITE.tagline}. Computer-vision-assisted coarse alignment for mobile
              free-space optical communication terminals.
            </p>
            <div className="clay-inset mt-5 rounded-2xl p-3.5">
              <p className="hud-label">Prototype / educational demonstration</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {DISCLAIMERS.notIsro}
              </p>
            </div>
          </div>

          {FOOTER_LINKS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="hud-label">{column.heading}</p>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <ClayPanel
          size="sm"
          className="mt-4 flex flex-col gap-3 px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            © {new Date().getFullYear()} Drishti-Optik prototype team ·{" "}
            <span className="text-foreground/70">
              Problem statement {SITE.problemStatementId}
            </span>
          </p>
          <p className="max-w-xl sm:text-right">
            Not an official ISRO product unless explicitly stated by an official ISRO source.
          </p>
        </ClayPanel>
      </div>
    </footer>
  );
}
