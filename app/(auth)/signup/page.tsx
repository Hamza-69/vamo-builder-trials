"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signUp, signInWithGoogle } from "../actions";
import { CheckCircle2, XCircle } from "lucide-react";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

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

    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result?.success) {
      const email = formData.get("email") as string;
      router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
      return;
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      {/* Google */}
      <Button
        variant="outline"
        className="w-full justify-center gap-2"
        type="button"
        disabled={googleLoading || loading}
        onClick={handleGoogleSignIn}
      >
        <svg viewBox="0 0 24 24" className="size-4">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </Button>

      {/* Divider */}
      <div className="relative flex items-center">
        <Separator className="flex-1" />
        <span className="px-3 text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Form */}
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            required
            minLength={2}
            autoComplete="name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* Password strength indicators */}
          {password.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const passes = rule.test(password);
                return (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 text-xs ${passes ? "text-primary" : "text-muted-foreground"
                      }`}
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
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
              <XCircle className="size-3.5" />
              Passwords do not match
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {success && (
          <p className="text-sm text-primary">{success}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !allRulesPass || !passwordsMatch}
        >
          {loading ? "Creating account…" : "Sign Up"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
