"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/**
 * Fires a `page_view` analytics event on every client-side route change.
 * Mount once in a layout that wraps authenticated pages.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid duplicate fires for the same path
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
