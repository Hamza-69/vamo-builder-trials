import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { ProjectView } from "@/modules/projects/views/project-view"

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const supabase = createClient()

  // Run auth + project ownership check in parallel
  const [userResult, projectResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", params.projectId)
      .single(),
  ])

  const user = userResult.data.user
  const project = projectResult.data

  if (!user || !project || project.owner_id !== user.id) {
    notFound()
  }

  return (
    <div className="h-screen w-screen">
      <ProjectView projectId={params.projectId} />
    </div>
  )
}
