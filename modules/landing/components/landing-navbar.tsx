"use client"

import Link from "next/link"
import { useScroll } from "@/hooks/use-scroll"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function LandingNavbar() {
  const isScrolled = useScroll()

  return (
    <nav
      className={cn(
        "p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent",
        isScrolled && "bg-background/80 backdrop-blur-lg border-border"
      )}
    >
      <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.svg" alt="Vamo Logo" width={32} height={32} />
          <span className="font-semibold text-lg">Vamo</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="#rewards" className="hover:text-foreground transition-colors">
            Rewards
          </Link>
          <Link href="#marketplace" className="hover:text-foreground transition-colors">
            Marketplace
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
