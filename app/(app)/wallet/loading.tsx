import { Skeleton } from "@/components/ui/skeleton"

export default function WalletLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12 space-y-8">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Balance Card */}
      <Skeleton className="h-[160px] w-full rounded-xl" />

      {/* History Table */}
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
