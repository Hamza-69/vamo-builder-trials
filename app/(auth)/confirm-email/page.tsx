import Link from "next/link";
import { MailIcon } from "lucide-react";

interface Props {
  searchParams: { email?: string };
}

export default function ConfirmEmailPage({ searchParams }: Props) {
  const email = searchParams.email;

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

      <div className="flex flex-col gap-3 w-full">
        <p className="text-xs text-muted-foreground">
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
