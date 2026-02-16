import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — Form */}
      <div className="flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 109 113"
              fill="none"
              className="text-primary"
            >
              <path
                d="M63.708 110.284C60.726 114.635 53.951 112.55 53.906 107.27L53.389 42.8H95.24C104.856 42.8 110.276 53.745 104.514 61.478L63.708 110.284Z"
                fill="url(#paint0)"
              />
              <path
                d="M63.708 110.284C60.726 114.635 53.951 112.55 53.906 107.27L53.389 42.8H95.24C104.856 42.8 110.276 53.745 104.514 61.478L63.708 110.284Z"
                fill="url(#paint1)"
                fillOpacity="0.2"
              />
              <path
                d="M45.317 2.071C48.269 -2.313 55.073 -0.175 55.073 5.131V42.8H16.026C6.442 42.8 1.046 31.911 6.773 24.17L45.317 2.071Z"
                fill="currentColor"
              />
              <defs>
                <linearGradient
                  id="paint0"
                  x1="53.389"
                  y1="54.974"
                  x2="94.564"
                  y2="71.829"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="currentColor" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint1"
                  x1="42.948"
                  y1="35.977"
                  x2="53.389"
                  y2="85.434"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop />
                  <stop offset="1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              vamo
            </span>
          </Link>
        </div>

        {/* Form slot */}
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-xs text-muted-foreground">
          By continuing, you agree to Vamo&apos;s{" "}
          <a href="#" className="underline hover:text-foreground">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </div>
      </div>

      {/* Right — Quote panel */}
      <div className="relative hidden flex-col items-center justify-center gap-8 bg-muted/40 lg:flex">
        {/* Large decorative quote mark */}
        <span className="text-[120px] leading-none font-serif text-muted-foreground/20 select-none">
          &ldquo;
        </span>

        <blockquote className="-mt-16 max-w-md text-center text-xl font-medium leading-relaxed text-foreground">
          Vamo is a Lovable-style builder where non-technical founders iterate
          on their startup UI and business progress in parallel.
        </blockquote>

        <div className="flex items-center gap-3">
          {/* B circle avatar */}
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            B
          </div>
          <span className="text-sm text-muted-foreground">@BolunLI</span>
        </div>
      </div>
    </div>
  );
}
