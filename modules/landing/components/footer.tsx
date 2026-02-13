import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍍</span>
            <span className="font-semibold text-lg">Vamo</span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
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
          </nav>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vamo
          </p>
        </div>
      </div>
    </footer>
  )
}
