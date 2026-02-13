import { Monitor, BarChart3, ArrowLeftRight, TrendingUp, ShoppingBag, Zap } from "lucide-react"

const features = [
  {
    icon: Monitor,
    title: "UI Preview",
    description:
      "See what you've built in real-time. Iterate on your product UI without writing code — like Lovable, but for your entire startup.",
  },
  {
    icon: BarChart3,
    title: "Business Panel",
    description:
      "Track valuation, traction signals, why you built the company, and your progress — all in one place next to your product.",
  },
  {
    icon: ArrowLeftRight,
    title: "Toggle, don't context-switch",
    description:
      "Flip between your UI and your business in one click. No more juggling tabs, spreadsheets, and pitch decks.",
  },
  {
    icon: TrendingUp,
    title: "Progress = Rewards",
    description:
      "Ship real updates, track traction, and earn pineapples — an in-app currency redeemable for Uber Eats credits.",
  },
  {
    icon: ShoppingBag,
    title: "List or sell your project",
    description:
      "Optionally list your project on the marketplace. Get instant offers from buyers who see your traction data.",
  },
  {
    icon: Zap,
    title: "Built for non-technical founders",
    description:
      "No code knowledge needed. Describe what you want, and Vamo builds it. Focus on the business, not the tech.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-32" id="features">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-2 tracking-wide uppercase">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything a founder needs
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Build your product and your business side by side. No more context-switching.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="mb-4 inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
