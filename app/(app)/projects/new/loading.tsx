import { Skeleton } from "@/components/ui/skeleton"

export default function NewProjectLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
