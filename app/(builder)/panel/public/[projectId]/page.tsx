export default function PanelPublicPage({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Public Panel</h1>
      <p className="text-muted-foreground">
        Public panel for project {params.projectId}.
      </p>
    </div>
  )
}
