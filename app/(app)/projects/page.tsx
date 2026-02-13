import { createClient } from "@/utils/supabase/server";
import { ProjectsView } from "@/modules/projects/views/projects-view";

export default async function ProjectsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    userName = profile?.full_name ?? user.email?.split("@")[0] ?? null;
  }

  return <ProjectsView userName={userName} />;
}
