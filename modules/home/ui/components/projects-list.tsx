"use client"

import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const ProjectsList = () => {
  const projects = [
    {
      id: "1",
      name: "Project 1",
      updatedAt: new Date()
    },
    {
      id: "2",
      name: "Project 2",
      updatedAt: new Date()
    },
    {
      id: "3",
      name: "Project 3",
      updatedAt: new Date()
    }
  ]
  
  return (
    <div className="w-full bg-white dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {false ? (
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="flex items-center gap-x-4 p-4 border rounded-xl bg-muted">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col flex-1 gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))
        ) : false ? (
            <p className="text-sm text-muted-foreground">
              No Vibes Found
            </p>
        ) : (
          projects?.map((p) => {
            return <Button
            key={p.id}
            variant={"outline"}
            asChild
            className="font-normal h-auto justify-start w-full text-start p-4"
            >
            <Link href={`/projects/${p.id}`} className="">
              <div className="flex items-center gap-x-4">
                <Image src={"/logo.svg"} alt="vibe" width={32} height={32} className="object-contain"/>
                <div className="flex flex-col">
                  <h3 className="truncate font-medium">
                    {p.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(p.updatedAt, {
                      addSuffix: true
                    })}
                  </p>
                </div>
              </div>
            </Link>
            </Button>
          })
        )}
      </div>
    </div>
  )
}