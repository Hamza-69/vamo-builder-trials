import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative rounded-3xl border bg-card overflow-hidden p-10 md:p-16 text-center">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 -z-0">
            <div className="absolute top-0 right-0 h-64 w-64 bg-primary/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-primary/5 blur-[80px] rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="text-5xl mb-6">🍍</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to build your startup?
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
              Join Vamo and start turning your idea into a real product — while
              earning pineapples along the way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8 h-12 rounded-full" asChild>
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
