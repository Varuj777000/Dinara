"use client";

import { useEffect } from "react";

/** После нового поиска плавно прокручивает страницу к блоку результатов. */
export function ScrollToResults({ query, targetId = "results" }: { query: string; targetId?: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [query, targetId]);
  return null;
}
