"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useCsrf } from "@/hooks/use-csrf";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createClient } from "@/utils/supabase/client";
import { trackEvent } from "@/lib/analytics";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or fewer")
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Project name is required"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
  url: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return val.trim().startsWith("http://") || val.trim().startsWith("https://");
      },
      { message: "URL must start with http:// or https://" }
    ),
  why_built: z
    .string()
    .max(1000, "Must be 1000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function NewProjectForm() {
  const router = useRouter();
  const { csrfFetch } = useCsrf();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      why_built: "",
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Screenshot must be under 5 MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF are allowed");
      return;
    }

    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  }

  function removeScreenshot() {
    setScreenshotFile(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if present
      if (screenshotFile) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("You must be logged in to create a project");
          setIsSubmitting(false);
          return;
        }

        const ext = screenshotFile.name.split(".").pop() ?? "png";
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("projects")
          .upload(filePath, screenshotFile);

        if (uploadError) {
          toast.error("Failed to upload screenshot: " + uploadError.message);
          setIsSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("projects")
          .getPublicUrl(filePath);

        screenshotUrl = publicUrlData.publicUrl;
      }

      // Create project via API
      const res = await csrfFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || undefined,
          url: values.url || undefined,
          why_built: values.why_built || undefined,
          screenshot_url: screenshotUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create project");
        setIsSubmitting(false);
        return;
      }

      toast.success("Project created!");
      trackEvent("project_created", { projectId: data.project.id });
      router.push(`/projects/${data.project.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Create a new project</CardTitle>
        <CardDescription>
          Set up your project to start building and tracking progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Project Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My awesome project"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/100 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* External URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://my-project.lovable.app"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to your Lovable, Replit, or other hosted project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short summary of what your project does..."
                      maxLength={500}
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Why did you build this? */}
            <FormField
              control={form.control}
              name="why_built"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why did you build this?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us the story behind your project..."
                      maxLength={1000}
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm leading-none font-medium select-none">
                Screenshot
              </label>
              {screenshotPreview ? (
                <div className="relative w-full max-w-sm">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    className="absolute -top-2 -right-2"
                    onClick={removeScreenshot}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-input hover:bg-accent flex h-32 w-full max-w-sm cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors"
                >
                  <ImagePlus className="size-5" />
                  <span>Upload a screenshot</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-muted-foreground text-sm">
                JPEG, PNG, WebP, or GIF — max 5 MB.
              </p>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
