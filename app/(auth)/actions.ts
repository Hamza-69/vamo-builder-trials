"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

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

  const fullName = (formData.get("fullName") as string)?.trim();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Server-side validation
  if (!fullName || fullName.length < 2) {
    return { error: "Full name is required." };
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
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
