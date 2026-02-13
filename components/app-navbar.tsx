"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { FolderKanban, Store, Wallet, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { ThemeSubmenu } from "@/components/theme-submenu"
import { createClient } from "@/utils/supabase/client"
import { useMediaQuery } from "@/hooks/use-media-query"

const navLinks = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/wallet", label: "Wallet", icon: Wallet },
] as const

export function AppNavbar() {
  const pathname = usePathname()
  const supabase = createClient()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [user, setUser] = useState<{ id: string; email?: string; avatar_url?: string } | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", authUser.id)
          .single()
        setUser({
          id: authUser.id,
          email: authUser.email,
          avatar_url: profile?.avatar_url ?? undefined,
        })
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U"

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between h-14 px-4">
        {/* Left: Logo */}
        <Link href="/projects" className="flex items-center gap-2 shrink-0">
          <Image src="/icon.svg" alt="Vamo" width={28} height={28} />
          <span className="font-semibold text-lg hidden sm:inline">Vamo</span>
        </Link>

        {/* Center: Nav links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "text-muted-foreground transition-colors",
                  isActive && "text-foreground bg-secondary"
                )}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            )
          })}
        </div>

        {/* Right: Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full size-8 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar size="sm">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52" style={{ zIndex: 100 }}>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user?.id ?? ""}`}>
                  <User className="size-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Nav links — mobile only */}
            {isMobile && (
              <DropdownMenuGroup>
                {navLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href)
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={cn(isActive && "font-medium text-foreground")}
                      >
                        <link.icon className="size-4" />
                        <span>{link.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            )}
            {isMobile && <DropdownMenuSeparator />}
            <ThemeSubmenu />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
