import { ClayPanel } from "@/components/common/Clay";
import { CredibilityTag } from "@/components/common/Tags";
import { REFERENCES, type CredibilityLabel } from "@/lib/site";
import { ExternalLink } from "lucide-react";

/**
 * The credibility ledger. Every factual claim in the interface points here so a
 * reviewer can check what is sourced, simulated or assumed.
 */
export function SourcesList({
  filter,
  className,
}: {
  filter?: CredibilityLabel[];
  className?: string;
}) {
  const items = filter
    ? REFERENCES.filter((ref) => filter.includes(ref.label))
    : REFERENCES;

  return (
    <ul className={className}>
      {items.map((ref) => {
        const external = ref.href.startsWith("http");
        return (
          <li key={ref.id}>
            <ClayPanel size="sm" className="h-full p-4">
              <div className="flex flex-wrap items-center gap-2">
                <CredibilityTag label={ref.label} />
                <span className="hud-label !text-[10px]">{ref.publisher}</span>
              </div>
              <p className="mt-2.5 text-sm font-semibold leading-6 text-foreground">
                {ref.title}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{ref.note}</p>
              <a
                href={ref.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                {external ? "Open source" : "Read the parameter set"}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </ClayPanel>
          </li>
        );
      })}
    </ul>
  );
}
