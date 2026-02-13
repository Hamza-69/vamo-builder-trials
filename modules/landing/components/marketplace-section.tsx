import { Tag, DollarSign, Eye, Shield } from "lucide-react"

export function MarketplaceSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/40" id="marketplace">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-2 tracking-wide uppercase">Marketplace</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            List your project. Get instant offers.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Optionally put your project on the Vamo marketplace. Buyers see your
            real traction data, making offers fast and transparent.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Tag,
              title: "List in seconds",
              description: "One click to list your project with all its data.",
            },
            {
              icon: Eye,
              title: "Transparent traction",
              description: "Buyers see verified metrics — no guesswork.",
            },
            {
              icon: DollarSign,
              title: "Instant offers",
              description: "Receive offers from interested buyers immediately.",
            },
            {
              icon: Shield,
              title: "Safe transfers",
              description: "Secure handoff of code, data, and ownership.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 inline-flex items-center justify-center size-12 rounded-2xl bg-primary/10 text-primary">
                <item.icon className="size-6" />
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Mock listing card */}
        <div className="mt-12 mx-auto max-w-md rounded-2xl border bg-card shadow-md overflow-hidden">
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm">🚀</div>
                <span className="font-semibold">FoodDash</span>
              </div>
              <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-2.5 py-0.5">
                Listed
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Food delivery app for college campuses. 2.4k MAU, growing 18% MoM.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Valuation</span>
              <span className="font-semibold">$45,000</span>
            </div>
            <div className="flex gap-2 pt-1">
              <div className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                Make an offer
              </div>
              <div className="h-9 px-4 rounded-lg border text-sm font-medium flex items-center justify-center text-muted-foreground">
                View
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
