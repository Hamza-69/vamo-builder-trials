import { MessageSquare, Layers, TrendingUp, Gift } from "lucide-react"

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Describe your idea",
    description:
      "Tell Vamo what you're building in plain English. No wireframes, no code — just your vision.",
  },
  {
    icon: Layers,
    step: "02",
    title: "Iterate on UI + Business",
    description:
      "Toggle between your live UI preview and your business panel. Update both as you go.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Track real progress",
    description:
      "Every meaningful update earns pineapples. Your valuation and traction signals update in real-time.",
  },
  {
    icon: Gift,
    step: "04",
    title: "Redeem or sell",
    description:
      "Cash in pineapples for Uber Eats credits. Or list your project on the marketplace and get offers.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/40" id="how-it-works">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-2 tracking-wide uppercase">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            From idea to traction in 4 steps
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No technical skills required. Just describe, build, track, and earn.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.step} className="relative text-center">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-border" />
              )}
              <div className="relative mx-auto mb-4 inline-flex items-center justify-center size-14 rounded-2xl bg-card border shadow-xs text-primary">
                <step.icon className="size-6" />
                <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-primary text-primary-foreground rounded-full size-5 flex items-center justify-center">
                  {step.step}
                </span>
              </div>
              <h3 className="font-semibold text-base mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
