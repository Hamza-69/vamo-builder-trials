"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { User } from "@supabase/supabase-js";

export async function signIn(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/projects");
}

export async function signUp(formData: FormData) {
  const supabase = createClient();

  const rawFullName = (formData.get("fullName") as string)?.trim();
  const fullName = rawFullName?.replace(/<[^>]*>/g, "").trim();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Server-side validation
  if (!fullName || fullName.length < 2) {
    return { error: "Full name is required." };
  }

  if (fullName.length > 100) {
    return { error: "Full name must be 100 characters or fewer." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: "Password must contain an uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { error: "Password must contain a lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { error: "Password must contain a number." };
  }

  const serviceClient = createServiceClient();
  const { data: { users } } = await serviceClient.auth.admin.listUsers();
  const existingUser = users.find((u: User) => u.email === email);

  if (existingUser) {
    if (!existingUser.email_confirmed_at) {
      // User exists but is not verified. 
      // Do not allow re-signup (which might change password).
      // Instead, just resend the verification email.
      const origin = headers().get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await serviceClient.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      return { success: "Account exists but is not verified. Verification email resent." };
    }
    // If user exists and IS verified, Supabase signUp will return an obfuscated response or error depending on config.
    // We can just proceed to let Supabase handle the "already registered" case, 
    // or return a specific error here if we want to be explicit.
    // For now, let's let standard Supabase flow handle the verified case (it usually returns success but sends no email, or returns error),
    // but we DEFINITELY want to intercept the unverified case to prevent password change.
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase returns a user with empty identities when the email is already taken
  if (data?.user?.identities?.length === 0) {
    return { error: "An account with this email already exists." };
  }

  return { success: "Check your email to confirm your account." };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = headers().get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Could not initiate Google sign-in." };
}

export async function resendVerificationEmail(email: string) {
  const supabase = createClient();
  const origin = headers().get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Verification email resent." };
}
