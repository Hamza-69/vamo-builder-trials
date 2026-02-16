"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Database } from "@/types/supabase"

export type ProjectData = Pick<Database["public"]["Tables"]["projects"]["Row"], "id" | "name" | "progress_score" | "status">
export type ProfileData = Pick<Database["public"]["Tables"]["profiles"]["Row"], "pineapple_balance">

export function useProject(projectId: string) {
  const [project, setProject] = useState<ProjectData | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [projectRes, profileRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, progress_score, status")
          .eq("id", projectId)
          .single(),
        supabase
          .from("profiles")
          .select("pineapple_balance")
          .eq("id", user.id)
          .single(),
      ])

      if (projectRes.data) setProject(projectRes.data)
      if (profileRes.data) setProfile(profileRes.data)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  useEffect(() => {
    fetchData()

    const projectChannel = supabase
      .channel(`project-header-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    const subProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      profileChannel = supabase
        .channel(`profile-header-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          () => {
            fetchData()
          }
        )
        .subscribe()
    }
    subProfile()

    return () => {
      supabase.removeChannel(projectChannel)
      if (profileChannel) supabase.removeChannel(profileChannel)
    }
  }, [projectId, fetchData, supabase])

  return { project, profile, isLoading, refetch: fetchData, setProject }
}
