"use client";

import { useCallback, useState } from "react";
import { useCsrf } from "@/hooks/use-csrf";

export interface OfferData {
  id: string;
  offer_low: number;
  offer_high: number;
  reasoning: string;
  signals_used: string[];
  status: string;
  created_at: string;
}

export function useOffer(projectId: string) {
  const { csrfFetch } = useCsrf();
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOffer = useCallback(async (): Promise<OfferData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await csrfFetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to get offer");
      }

      const data = await res.json();
      setOffer(data.offer);
      return data.offer;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, csrfFetch]);

  return { offer, isLoading, error, requestOffer, setOffer } as const;
}
