import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "__csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token.
 */
function generateToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute an HMAC-SHA256 signature for a token using the app secret.
 */
async function signToken(token: string): Promise<string> {
  const secret = process.env.CSRF_SECRET;
  if (!secret) {
    throw new Error("CSRF_SECRET environment variable is required");
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  return Array.from(new Uint8Array(signature), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * Create a signed CSRF token in the format `token.signature`.
 */
export async function createSignedCsrfToken(): Promise<string> {
  const token = generateToken();
  const signature = await signToken(token);
  return `${token}.${signature}`;
}

/**
 * Verify that a signed CSRF token is valid (i.e., the signature matches).
 */
export async function verifySignedCsrfToken(
  signedToken: string
): Promise<boolean> {
  const parts = signedToken.split(".");
  if (parts.length !== 2) return false;
  const [token, providedSignature] = parts;
  const expectedSignature = await signToken(token);
  // Constant-time comparison
  if (providedSignature.length !== expectedSignature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < providedSignature.length; i++) {
    mismatch |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Middleware helpers ──────────────────────────────────────────────────

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Verify that the request Origin header matches the expected host.
 * Returns `true` if the origin is valid or the request is safe (GET/HEAD/OPTIONS).
 */
export function verifyOrigin(request: NextRequest): boolean {
  if (!STATE_CHANGING_METHODS.has(request.method)) return true;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // If there's no Origin header, also check Referer as a fallback
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) return false; // No origin info at all — reject
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

/**
 * Verify the double-submit CSRF token on state-changing requests.
 * The token must be present in both the cookie and the `x-csrf-token` header,
 * and both must be valid signed tokens that match.
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  if (!STATE_CHANGING_METHODS.has(request.method)) return true;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken !== headerToken) return false;

  return verifySignedCsrfToken(cookieToken);
}

/**
 * Ensure a CSRF cookie is set on the response.
 * If one doesn't already exist on the request, generate a new signed token.
 */
export async function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!existingToken || !(await verifySignedCsrfToken(existingToken))) {
    const newToken = await createSignedCsrfToken();
    response.cookies.set(CSRF_COOKIE_NAME, newToken, {
      httpOnly: false, // Must be readable by client JS for double-submit
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

// ── Server Component helper ────────────────────────────────────────────

/**
 * Read the current CSRF token from cookies (for use in Server Components / Actions).
 */
export function getCsrfTokenFromCookies(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
