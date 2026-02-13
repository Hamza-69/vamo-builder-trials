import { AppNavbar } from "@/components/app-navbar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
