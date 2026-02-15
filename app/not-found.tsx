"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image src="/icon.svg" alt="Vamo" width={48} height={48} />
      </Link>

      {/* Big 404 */}
      <h1 className="text-8xl font-extrabold tracking-tighter text-primary/20 select-none">
        404
      </h1>

      {/* Message */}
      <h2 className="mt-4 text-2xl font-bold tracking-tight">
        Page not found
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-1.5" />
          Go back
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="size-4 mr-1.5" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
