"use client";

import { useCallback, useMemo } from "react";

const CSRF_COOKIE_NAME = "__csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Read the CSRF token from the `__csrf_token` cookie.
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/**
 * Hook that returns helpers for attaching the CSRF token to requests.
 *
 * Usage with fetch:
 * ```ts
 * const { csrfHeaders, csrfFetch } = useCsrf();
 *
 * // Option A — spread headers
 * fetch("/api/action", { method: "POST", headers: { ...csrfHeaders } });
 *
 * // Option B — use the wrapper (auto-injects header)
 * csrfFetch("/api/action", { method: "POST", body: ... });
 * ```
 */
export function useCsrf() {
  /** Current token value – re-read on every render so it stays fresh. */
  const token = getCsrfToken();

  /** Headers object ready to spread into a fetch call. */
  const csrfHeaders = useMemo<Record<string, string>>(() => {
    if (!token) return {} as Record<string, string>;
    return { [CSRF_HEADER_NAME]: token } as Record<string, string>;
  }, [token]);

  /**
   * A thin wrapper around `fetch` that automatically injects the
   * `x-csrf-token` header on state-changing methods.
   */
  const csrfFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

      if (isStateChanging && token) {
        const headers = new Headers(init?.headers);
        headers.set(CSRF_HEADER_NAME, token);
        return fetch(input, { ...init, headers });
      }

      return fetch(input, init);
    },
    [token]
  );

  return { token, csrfHeaders, csrfFetch } as const;
}

export { getCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
