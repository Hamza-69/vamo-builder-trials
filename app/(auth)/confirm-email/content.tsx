"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MailIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "../actions";
import { createClient } from "@/utils/supabase/client";

export function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state changes — when the user confirms their email
    // and the session becomes active, redirect to /projects.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.replace("/projects");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const result = await resendVerificationEmail(email);
      if (result?.error) {
        setResendError(result.error);
      } else {
        setResendSuccess(true);
      }
    } catch {
      setResendError("An error occurred while resending the email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <MailIcon className="size-8 text-primary" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          We&apos;ve sent a confirmation link to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email address"
          )}
          . Click the link to activate your account.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {email && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resending || resendSuccess}
            className="w-full"
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Resending...
              </>
            ) : resendSuccess ? (
              <>
                <CheckCircle2 className="mr-2 size-4 text-green-500" />
                Email resent!
              </>
            ) : (
              "Resend confirmation email"
            )}
          </Button>
        )}

        {resendError && (
          <p className="text-xs text-destructive">{resendError}</p>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            try again
          </Link>
          .
        </p>
      </div>

      <Link
        href="/login"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
