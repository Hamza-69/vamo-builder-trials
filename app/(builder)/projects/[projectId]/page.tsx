import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { ProjectView } from "@/modules/projects/views/project-view"

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.projectId)
    .eq("owner_id", user.id)
    .single()

  if (!project) {
    notFound()
  }

  return (
    <div className="h-screen w-screen">
      <ProjectView projectId={params.projectId} />
    </div>
  )
}
