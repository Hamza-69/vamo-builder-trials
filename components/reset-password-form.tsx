"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "../utils/supabase/client";
import { Button } from "./ui/button";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  ];
  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    if (!allRulesPass) {
      setError("Password does not meet the requirements.");
      setLoading(false);
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    // Get user email before updating password
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("");
      setError(error.message);
      setLoading(false);
      return;
    }

    // Sign out to invalidate the recovery session (prevents reuse of reset link)
    await supabase.auth.signOut();

    // Re-login with the new password
    if (userEmail) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });
      if (signInError) {
        setError("Password updated but auto-login failed. Please log in manually.");
        setTimeout(() => router.push("/login"), 1500);
        setLoading(false);
        return;
      }
    }

    setError("");
    setMessage("Password updated! Redirecting...");
    setTimeout(() => {
      router.push("/projects");
    }, 1200);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-8">
      <h2 className="text-xl font-bold">Reset Password</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-medium">New Password</label>
        <input
          id="password"
          type="password"
          required
          placeholder="Enter new password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          minLength={8}
          autoComplete="new-password"
        />
        {password.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const passes = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs ${passes ? "text-primary" : "text-muted-foreground"}`}
                >
                  {passes ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="font-medium">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          required
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          minLength={8}
          autoComplete="new-password"
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
            <XCircle className="size-3.5" />
            Passwords do not match
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !allRulesPass || !passwordsMatch}
      >
        {loading ? "Sending..." : "Reset Password"}
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center mt-2">{error}</p>
      )}
      {message && (
        <p className="text-sm text-primary text-center mt-2">{message}</p>
      )}
    </form>
  );
}
