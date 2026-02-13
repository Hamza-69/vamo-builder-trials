"use client"

import { Gift, Utensils, Trophy, Star } from "lucide-react"

const rewardActions = [
  { label: "Ship a new feature", pineapples: "+5 🍍" },
  { label: "Update business metrics", pineapples: "+3 🍍" },
  { label: "Add traction signals", pineapples: "+4 🍍" },
  { label: "Complete your business panel", pineapples: "+10 🍍" },
  { label: "Get your first marketplace offer", pineapples: "+15 🍍" },
]

export function RewardsSection() {
  return (
    <section className="py-20 md:py-32" id="rewards">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <p className="text-sm font-medium text-primary mb-2 tracking-wide uppercase">Rewards</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Real progress.
              <br />
              Real pineapples. 🍍
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Every time you ship something meaningful — a new feature, a
              business update, a traction signal — you earn pineapples. Redeem
              them for Uber&nbsp;Eats credits and fuel your hustle, literally.
            </p>

            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Gift className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Earn</p>
                  <p className="text-xs text-muted-foreground">Ship & progress</p>
                </div>
              </div>
              <div className="text-muted-foreground text-xl">→</div>
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Utensils className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Redeem</p>
                  <p className="text-xs text-muted-foreground">Uber Eats credits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Reward card */}
          <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
            <div className="p-5 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                <span className="font-semibold">Pineapple Ledger</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Star className="size-4" />
                42 🍍
              </div>
            </div>
            <div className="divide-y">
              {rewardActions.map((action) => (
                <div
                  key={action.label}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm">{action.label}</span>
                  <span className="text-sm font-semibold text-primary">
                    {action.pineapples}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-5 bg-primary/5 border-t">
              <p className="text-xs text-muted-foreground text-center">
                50 🍍 = $10 Uber Eats credit · Redeemable anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
