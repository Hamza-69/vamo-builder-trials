import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NewProjectForm } from "@/modules/projects/components/new-project-form";

export default async function NewProjectPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-12">
      <NewProjectForm />
    </div>
  );
}
