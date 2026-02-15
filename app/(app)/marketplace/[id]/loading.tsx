import { Skeleton } from "@/components/ui/skeleton"

export default function ListingDetailLoading() {
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-8">
      {/* Back link */}
      <Skeleton className="h-5 w-36" />

      {/* Hero image */}
      <Skeleton className="h-[400px] w-full rounded-xl" />

      {/* Title + badges */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-80" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
