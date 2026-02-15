import Link from "next/link"
import { Tag, DollarSign, Eye, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

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
          <Button asChild size="lg" className="mt-6">
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
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
      </div>
    </section>
  )
}
