import { getConsent, subscribeConsent } from "@/lib/analytics";
import { useEffect, useState } from "react";

/**
 * Small readout of the visitor's current cookie choice, used on the privacy
 * page and in profile settings. Split out so the consent banner file exports
 * only the banner component.
 */
export function ConsentStatus() {
  const [value, setValue] = useState(getConsent());
  useEffect(() => subscribeConsent(setValue), []);
  return (
    <span className="hud-value text-sm text-foreground">
      {value === "all"
        ? "Analytics accepted"
        : value === "essential"
          ? "Essential only"
          : "Not chosen yet"}
    </span>
  );
}
