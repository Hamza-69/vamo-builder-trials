"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function updateEmail(formData: FormData) {
  const supabase = createClient();
  const newEmail = formData.get("email") as string;

  if (!newEmail || !newEmail.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "A confirmation link has been sent to both your old and new email addresses. Please confirm to complete the change.",
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword) {
    return { error: "Current password is required." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { error: "Password must contain an uppercase letter." };
  }
  if (!/[a-z]/.test(newPassword)) {
    return { error: "Password must contain a lowercase letter." };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { error: "Password must contain a number." };
  }

  // Verify current password by re-authenticating
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Unable to verify current session." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect." };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated successfully." };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
