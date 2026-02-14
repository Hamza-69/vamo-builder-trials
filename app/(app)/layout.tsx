import { AppNavbar } from "@/components/app-navbar"
import { PageViewTracker } from "@/components/page-view-tracker"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />
      <PageViewTracker />
      <main className="flex-1">{children}</main>
    </div>
  )
}
