import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /auth/callback
 *
 * Supabase redirects here after a user clicks the email confirmation link.
 * We exchange the `code` query param for a session, then redirect the user
 * to the appropriate page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/projects";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If no code or exchange failed, redirect to login with an error hint
  return NextResponse.redirect(`${origin}/login`);
}
