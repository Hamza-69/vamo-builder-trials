"use client"

import Link from "next/link"
import { ArrowRight, Monitor, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-40 left-1/4 h-[300px] w-[400px] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-xs">
          <span className="text-base">🍍</span>
          <span>Earn pineapples for real progress</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          Build your startup.
          <br />
          <span className="text-primary">Track your business.</span>
        </h1>

        {/* Subline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Vamo is a builder for non-technical founders. Iterate on your UI and
          business progress in parallel — and get rewarded with pineapples
          redeemable for Uber&nbsp;Eats credits.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Button size="lg" className="text-base px-8 h-12 rounded-full" asChild>
            <Link href="/signup">
              Start building
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8 h-12 rounded-full" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>

        {/* Visual: Toggle preview */}
        <div className="relative mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center border-b bg-muted/50 px-4 py-3 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-red-400/70" />
                <div className="size-3 rounded-full bg-yellow-400/70" />
                <div className="size-3 rounded-full bg-green-400/70" />
              </div>
              <div className="flex items-center gap-1 ml-4 rounded-lg bg-background p-1">
                <button className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">
                  <Monitor className="size-3.5" />
                  UI Preview
                </button>
                <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <BarChart3 className="size-3.5" />
                  Business Panel
                </button>
              </div>
            </div>

            {/* Mock UI Preview content */}
            <div className="p-6 md:p-8 space-y-4 min-h-[300px] bg-gradient-to-br from-card to-muted/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg">🏠</div>
                <div>
                  <div className="h-4 w-32 rounded bg-foreground/10" />
                  <div className="h-3 w-20 rounded bg-foreground/5 mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border bg-background p-4 space-y-2">
                    <div className="h-20 rounded-lg bg-primary/5" />
                    <div className="h-3 w-3/4 rounded bg-foreground/10" />
                    <div className="h-3 w-1/2 rounded bg-foreground/5" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <div className="h-9 w-24 rounded-lg bg-primary/20" />
                <div className="h-9 w-24 rounded-lg bg-foreground/5" />
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-8 rounded-xl border bg-card shadow-lg p-3 flex items-center gap-2 text-sm">
            <span className="text-xl">🍍</span>
            <span className="font-medium">+5 pineapples earned!</span>
          </div>
        </div>
      </div>
    </section>
  )
}
