import { ProjectView } from "@/modules/projects/views/project-view";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <ProjectView projectId={"1"} />
    </div>
  );
}
