import { useEffect } from "react";
import { SITE } from "@/lib/site";

/**
 * Per-route document metadata.
 *
 * The app is a client-rendered SPA, so route metadata is applied to the live
 * document head. Every route passes a unique title, description and path so
 * canonical URLs, Open Graph and Twitter/X cards stay in sync with the page.
 */
export interface PageMeta {
  title: string;
  description: string;
  /** Route path used for the canonical URL, e.g. "/technology". */
  path: string;
  /** Signed-in or transactional routes opt out of indexing. */
  noindex?: boolean;
  ogImage?: string;
}

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

export function usePageMeta({ title, description, path, noindex, ogImage }: PageMeta) {
  useEffect(() => {
    const pathname = path || "/";
    const url = `${SITE.canonicalBase}${pathname === "/" ? "/" : pathname}`;
    const image = ogImage ?? `${SITE.canonicalBase}/og-image.svg`;

    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow",
    );
    setCanonical(url);

    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");

    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  }, [title, description, path, noindex, ogImage]);
}
