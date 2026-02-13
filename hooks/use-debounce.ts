"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a value — returns the latest value only after `delay` ms
 * of inactivity.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
