import { ProjectView } from "@/modules/projects/views/project-view"

export default function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div className="h-screen w-screen">
      <ProjectView projectId={params.projectId} />
    </div>
  )
}
