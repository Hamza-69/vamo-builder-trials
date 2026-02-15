import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  verifyOrigin,
  verifyCsrfToken,
  ensureCsrfCookie,
} from "@/lib/csrf";

export const updateSession = async (request: NextRequest) => {
  // ── CSRF Protection: Origin header verification ──────────────────────
  // Reject state-changing requests whose Origin doesn't match the Host.
  if (!verifyOrigin(request)) {
    return new NextResponse("Forbidden – origin mismatch", { status: 403 });
  }

  // ── CSRF Protection: Double-submit token verification ────────────────
  // Next.js server actions carry an unforgeable `next-action` header and are
  // already protected by the origin check above, so we skip the double-submit
  // token check for them. All other state-changing requests must include it.
  const isServerAction = request.headers.has("next-action");
  if (!isServerAction) {
    const csrfValid = await verifyCsrfToken(request);
    if (!csrfValid) {
      return new NextResponse("Forbidden – invalid CSRF token", { status: 403 });
    }
  }

  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          // Enforce SameSite=Lax and Secure on all Supabase auth cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            }),
          );
        },
      },
    },
  );

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes logic
  const path = request.nextUrl.pathname;
  const isPublicRoute =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/confirm-email") ||
    path.startsWith("/auth/callback") ||
    path.startsWith("/marketplace");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/confirm-email");

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  // Admin route protection
  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/projects"; // Redirect non-admins to projects
      return NextResponse.redirect(url);
    }
  }

  // ── CSRF Protection: Ensure CSRF cookie is set on every response ─────
  response = await ensureCsrfCookie(request, response);

  return response;
};
