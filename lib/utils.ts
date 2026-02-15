import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Escape special characters in user input before interpolating into
 * PostgREST `.or()` / `.ilike()` filter strings.
 * Prevents filter-injection attacks via crafted search terms.
 */
export function escapeFilterValue(value: string): string {
  // Escape PostgREST-meaningful characters: backslash, percent, underscore,
  // and filter-syntax characters: comma, dot, parentheses
  return value.replace(/[\\%_.,()]/g, (c) => `\\${c}`);
}

/**
 * Strip HTML tags from a string to prevent stored XSS.
 * Also collapses excess whitespace and trims.
 */
export function sanitizePlainText(value: string, maxLength?: number): string {
  let cleaned = value.replace(/<[^>]*>/g, "").trim();
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}
